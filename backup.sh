#!/usr/bin/env bash
DATE=$(date +%Y-%m-%d)
pg_dump "postgresql://postgres:YOUR_DB_PASSWORD@db.iyhdzfxakqmxfvcajauv.supabase.co:5432/postgres" \
  --no-owner --no-acl > "backup-$DATE.sql"
echo "Backed up to backup-$DATE.sql"
