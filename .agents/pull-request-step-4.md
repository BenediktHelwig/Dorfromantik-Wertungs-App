## Schritt 4: Nextcloud-App und PWA

- **Backend (PHP):** eine Zeile je Kampagne, nur Rohdaten. Unbekannte oder abgeleitete Felder werden abgelehnt, beendete Kampagnen sind schreibgeschützt.
- **Oberfläche (Vue):** Funktionsumfang des Prototyps. `src/core` wird direkt eingebunden und ist **unverändert**, ebenso `web/` und die bisherigen Tests. Speichersperre und Partieende-Frage liegen in `src/flow.js`.
- **PWA:** Manifest, Service Worker (Oberfläche zwischengespeichert, Daten nie), Icons, iOS-Angaben.
- **Betrieb:** `docker compose` (Nextcloud 31.0.5) für Entwicklung und Integrationstests, Einrichtung in `INSTALL.md`.

### Entscheidungen (25.11.2026, in `docs/entscheidungen.md`)
Kampagnen gemeinsam für alle · nur online · keine Übernahme der Prototyp-Daten · kein gleichzeitiges Bearbeiten (das letzte Speichern gilt) · vorhandene Nextcloud 31.0.5, HTTPS richtet Benedikt ein.

### Abweichungen vom Plan
- Die App-Seite kommt **ohne Nextcloud-Rahmen** (mit Link zurück). Der Rahmen setzt sein eigenes Manifest und Home-Bildschirm-Icon davor.
- `@nextcloud/axios` und `@nextcloud/router` werden nicht gebraucht; die einzige Laufzeit-Abhängigkeit ist Vue.
- Commit `70e6ddf` korrigiert zwischen Rot und Grün drei falsche Annahmen in den Integrationstests (Antwort ohne Anmeldung, Testdaten mit offener Baumfrage, Adressen ohne `index.php`). Der Reviewer hat bestätigt, dass keine Regel abgeschwächt wird.

### Geprüft
- `npm test` 255/255, `npm run test:integration` 24/24 (mit Neustart des Containers).
- Headless-Chrome mit echtem Nextcloud-Login: je eine Kampagne im Basisspiel und in Sakura (Speichern, Fragen im Baum, Neuladen, Blütensammler-Sperre, Partieende, Beenden), Ansicht in Handybreite, keine Konsolenfehler, auf `localhost` keine Installierbarkeitsfehler, bei gestopptem Server „Keine Verbindung zur Nextcloud“. Das war ein einmaliger Rauchtest, er liegt nicht im Repo; die Vue-Komponenten haben keine eigenen automatischen Tests. Nicht alle Wege wurden durchgespielt (z. B. Restliche Felder, Handkarten, *-Karten, Löschen über die Oberfläche).
- Review: PASS im zweiten Durchgang.

### Nur durch Menschen prüfbar
- Einrichtung auf dem Heimserver nach `INSTALL.md` (auch: „schöne URLs“ bzw. eigener Webserver, Nextcloud 32 ist ungetestet)
- HTTPS einrichten, dann Installation als App auf Android und iPhone
- Bedienung am Touchscreen, Zugriff über VPN, Offline-Meldung auf dem Handy

### Offene Fragen
Keine. Beobachtung aus dem Review: Wie im Prototyp lässt sich eine Sakura-Kampagne nicht beenden, solange der Partieende-Eintrag offen ist („Nichts eintragen“ genügt). Das steht nicht in `docs/entscheidungen.md`.

### Merge-Reihenfolge
#1 → #2 → #3 → dieser PR, jeweils mit Merge-Commit statt Squash.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
