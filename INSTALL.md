# Dorfromantik in eurer Nextcloud einrichten

Für die vorhandene Nextcloud der Familie (getestet im Container mit **31.0.5**, laut `info.xml` für Nextcloud 31 und 32;
Version 32 ist nicht getestet). Die App braucht keinen App-Store und keine eigenen Accounts: Wer sich an der Nextcloud
anmelden darf und für die App freigeschaltet ist, kann sie nutzen. **Alle sehen und bearbeiten dieselben Kampagnen.**

## 1. Oberfläche bauen (auf dem Entwicklungsrechner)

Der Build braucht das ganze Repository, weil die Rechenlogik aus `src/core` eingebunden wird. Mit Docker:

```bash
docker compose run --rm frontend-build
```

Oder mit Node ≥ 20 im Ordner `nextcloud-app/dorfromantik`: `npm install` und `npm run build`.
Das Ergebnis liegt in `nextcloud-app/dorfromantik/js/`.

## 2. Auf den Server kopieren

Legt auf dem Server im Nextcloud-Ordner `custom_apps/dorfromantik/` an (gibt es `custom_apps` nicht, dann `apps/dorfromantik/`)
und kopiert **nur** diese Ordner aus `nextcloud-app/dorfromantik/` hinein:

```
appinfo/   img/   js/   lib/   pwa/   templates/
```

`src/`, `node_modules/` und die übrigen Dateien gehören nicht auf den Server. Der Webserver-Benutzer (meist `www-data`)
muss die Dateien lesen können, z. B. `chown -R www-data:www-data custom_apps/dorfromantik`.

## 3. Aktivieren

Als Webserver-Benutzer im Nextcloud-Ordner (bei Docker: `docker exec -u www-data <container> php occ …`):

```bash
php occ app:enable dorfromantik
```

Nur für die Familie: eine Gruppe anlegen (z. B. `familie`), die beiden Personen hinzufügen und dann

```bash
php occ app:enable --groups familie dorfromantik
```

In der Oberfläche geht dasselbe unter *Apps → Deaktivierte/Aktive Apps → Dorfromantik → Auf Gruppen beschränken*.
Beim Aktivieren legt Nextcloud die Tabelle `dorfromantik_campaigns` (mit eurem Tabellen-Präfix) an. Danach steht
„Dorfromantik“ im App-Menü. Die Adresse ist `https://<eure-nextcloud>/apps/dorfromantik/` (ohne „schöne URLs“:
`…/index.php/apps/dorfromantik/`). Die App öffnet sich als eigene Seite ohne Nextcloud-Menüleiste; der Startbildschirm hat
einen Link „zurück zur Nextcloud“.

**Update:** Schritt 1 und 2 wiederholen (Ordner ersetzen). Wurde die Versionsnummer in `appinfo/info.xml` erhöht, danach
`php occ upgrade` ausführen.

**Sicherung:** Die Kampagnen liegen in der Nextcloud-Datenbank. Eure übliche Datenbank-Sicherung deckt sie ab.

### Variante: TrueNAS (ersetzt Schritt 2 und 3)

Für eine Nextcloud mit dem offiziellen Docker-Image auf TrueNAS ab 24.10. Alle Befehle laufen in der Weboberfläche
unter *System → Shell*; der Ablageordner der Nextcloud muss dafür nicht bekannt sein.

1. Auf dem Entwicklungsrechner die sechs Ordner aus Schritt 2 in einen Ordner `dorfromantik/` kopieren und diesen als
   ZIP packen (z. B. `dorfromantik-0.1.0.zip`). Die ZIP über eine SMB-Freigabe auf das NAS kopieren.
2. Den Namen des Containers suchen, in dem die Nextcloud selbst läuft (nicht Datenbank, Redis, Cron oder Proxy):

   ```bash
   sudo docker ps --format '{{.Names}}  {{.Image}}' | grep -i nextcloud
   ```

3. ZIP-Pfad und Containernamen anpassen, entpacken und nachsehen, ob die App schon vorhanden ist:

   ```bash
   ZIP=/mnt/<pool>/<dataset>/dorfromantik-0.1.0.zip
   NC=ix-nextcloud-nextcloud-1

   python3 -m zipfile -e "$ZIP" /tmp/dorf
   sudo docker exec $NC ls /var/www/html/custom_apps
   ```

4. Nur weitermachen, wenn der letzte Befehl ohne Fehler durchläuft und **kein** `dorfromantik` anzeigt (bei einem
   Update siehe unten):

   ```bash
   sudo docker cp /tmp/dorf/dorfromantik $NC:/var/www/html/custom_apps/
   sudo docker exec -u root $NC chown -R www-data:www-data /var/www/html/custom_apps/dorfromantik
   sudo docker exec -u root $NC chmod -R a+rX /var/www/html/custom_apps/dorfromantik
   sudo docker exec -u www-data $NC php occ app:enable dorfromantik
   ```

5. Auf die Familie beschränken: in der Nextcloud unter *Benutzer* die Gruppe anlegen, dann bei der App *Auf Gruppen
   beschränken* (siehe oben).

**Update auf TrueNAS:** `docker cp` würde in einen vorhandenen Ordner einen zweiten Ordner `dorfromantik/` hineinlegen.
Deshalb vor Schritt 4 den alten App-Ordner im Container entfernen (die Kampagnen liegen in der Datenbank und bleiben
erhalten) und vor dem Entpacken auch `/tmp/dorf` leeren:

```bash
sudo rm -rf /tmp/dorf    # vor dem Entpacken in Schritt 3
sudo docker exec -u root $NC rm -rf /var/www/html/custom_apps/dorfromantik    # vor Schritt 4
```

Für HTTPS wird das von der CA signierte Server-Zertifikat in den Einstellungen der Nextcloud-App auf TrueNAS
ausgewählt (siehe Abschnitt 4).

## 4. HTTPS (Voraussetzung für die Installation als App)

Browser erlauben den Service Worker nur über **HTTPS** (Ausnahme: `localhost`). Das richtet ihr selbst ein.
Ohne HTTPS läuft die App ganz normal im Browser, lässt sich aber auf Android nicht als App
installieren, und ohne Verbindung erscheint die Fehlerseite des Browsers statt unseres Hinweises.

Darauf kommt es an:

- Die Handys müssen dem Zertifikat **ohne Warnung** vertrauen. Bei einem selbst ausgestellten Zertifikat heißt das: die
  eigene Zertifizierungsstelle auf jedem Handy installieren (beim iPhone zusätzlich unter *Einstellungen → Allgemein →
  Info → Zertifikatsvertrauenseinstellungen* einschalten).
- Verwendet zu Hause und über **VPN dieselbe Adresse**. Eine installierte App gehört zu genau einer Adresse.
- In der `config.php` muss die Adresse in `trusted_domains` stehen. Läuft HTTPS über einen vorgeschalteten Proxy,
  braucht es meist zusätzlich `'overwriteprotocol' => 'https'`.

## 5. Aufs Handy

Das Handy muss die Nextcloud erreichen (WLAN zu Hause oder VPN) und dem Zertifikat vertrauen (Abschnitt 4).

### iPhone (iOS, Safari)

1. Die Adresse der App in **Safari** öffnen und anmelden.
2. Auf das **Teilen-Symbol** tippen (Quadrat mit Pfeil nach oben). Je nach iOS-Version steht es unten in der Leiste
   oder erst hinter dem Menü **•••**.
3. In der Liste nach unten scrollen und **Zum Home-Bildschirm** wählen. Fehlt der Eintrag, unter *Mehr* bzw.
   *Aktionen bearbeiten* nachsehen.
4. Gibt es den Schalter **Als Web-App öffnen**, eingeschaltet lassen.
5. Auf **Hinzufügen** tippen.

Danach die App über das neue Symbol starten. Sie hat eine eigene Anmeldung, dort also **noch einmal anmelden**.

### Android (Chrome)

1. Die Adresse der App in **Chrome** öffnen und anmelden.
2. Oben rechts auf das Menü **⋮** tippen.
3. **App installieren** wählen (oder *Zum Startbildschirm hinzufügen → Installieren*).
4. Mit **Installieren** bestätigen.

Danach die App über das neue Symbol starten. Der Weg unter Android ist noch auf keinem echten Gerät geprüft, die
Menütexte können je nach Version abweichen.

### Prüfen

- Die App startet vom Symbol **ohne Adressleiste** bzw. Browser-Leisten.
- Im Flugmodus erscheint beim Öffnen **„Keine Verbindung zur Nextcloud“**.

In der Handy-App von Nextcloud taucht Dorfromantik nach unserem Kenntnisstand nicht von selbst auf; gedacht ist der
Start über das eigene Symbol.

## Verhalten im Alltag

- Die App ist **nur online** nutzbar. Ohne WLAN bzw. VPN erscheint „Keine Verbindung zur Nextcloud“.
- Eine Eingabe gilt erst, wenn die Nextcloud sie angenommen hat. Schlägt das Speichern fehl, erscheint eine Meldung und
  das ausgefüllte Blatt bleibt stehen. Beim Neuladen der Seite gehen nicht gespeicherte Eingaben verloren.
- Meldet die App „Die Anmeldung ist abgelaufen“, ladet die Seite neu und meldet euch an. Das ausgefüllte, noch nicht
  gespeicherte Blatt ist dann weg.
- Bearbeitet eine Kampagne **nicht auf zwei Geräten gleichzeitig**: Es gilt das letzte Speichern.
- Kampagnen aus dem Browser-Prototyp werden nicht übernommen.

## Entwicklung und Tests

```bash
docker compose up -d --wait   # Wegwerf-Nextcloud auf http://localhost:8081 (admin / Dorf-Test-Admin-2026!)
npm test                      # Kern und Ablaufregeln, ohne Docker
npm run test:integration      # gegen den Container; startet ihn zwischendurch neu
docker compose run --rm frontend-build   # Oberfläche nach Änderungen neu bauen, dann Seite neu laden
docker compose down -v        # Container samt Testdaten löschen (nötig nach neuen Datenbank-Migrationen)
```

Die Integrationstests löschen nur die Kampagnen, die sie selbst anlegen, und sind nur für den Container gedacht.
