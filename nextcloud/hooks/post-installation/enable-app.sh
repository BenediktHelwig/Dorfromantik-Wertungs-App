#!/bin/sh
# Läuft einmal nach der Installation des Entwicklungs-Containers: App aktivieren, zweiten Testnutzer anlegen.
set -eu
php /var/www/html/occ app:enable dorfromantik
OC_PASS='Dorf-Test-Familie-2026!' php /var/www/html/occ user:add --password-from-env familie
