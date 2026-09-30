#!/bin/sh
# Render start script: prepare the database, create admin logins and sample data, then start the app.
set -e
node dist-server/migrate.js
if [ -n "$ADMIN_PASSWORD" ]; then
  # Keeps the existing 'admin' login working (its password follows ADMIN_PASSWORD).
  STAFF_PASSWORD="$ADMIN_PASSWORD" node dist-server/create-staff.js admin "Hospital Admin" admin
fi
SEED_PW="${SEED_ADMIN_PASSWORD:-$ADMIN_PASSWORD}"
if [ -n "$SEED_PW" ]; then
  # Creates velavan.admin on first run (password not changed afterwards) and, if SEED_DEMO_DATA=true, sample records.
  SEED_ADMIN_PASSWORD="$SEED_PW" node dist-server/seed.js
else
  echo "No ADMIN_PASSWORD/SEED_ADMIN_PASSWORD set; skipping admin creation and seeding"
fi
exec node dist-server/index.js
