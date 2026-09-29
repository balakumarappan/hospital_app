#!/bin/sh
# Render start script: prepare the database, optionally (re)create the admin login, then start the app.
set -e
node dist-server/migrate.js
if [ -n "$ADMIN_PASSWORD" ]; then
  STAFF_PASSWORD="$ADMIN_PASSWORD" node dist-server/create-staff.js admin "Hospital Admin" admin
else
  echo "ADMIN_PASSWORD not set; skipping admin account creation"
fi
exec node dist-server/index.js
