#!/bin/bash

# Configuration
APP_DIR="/var/www/erlkim-ppob-digiflazz"
BACKUP_DIR="${APP_DIR}/backups"
ENV_FILE="${APP_DIR}/.env"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Extract DATABASE_URL from .env
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

DB_URL=$(grep -oP '^DATABASE_URL=\K.*' "$ENV_FILE" | tr -d '"' | tr -d "'")

if [ -z "$DB_URL" ]; then
    echo "Error: DATABASE_URL not found in $ENV_FILE"
    exit 1
fi

# Run pg_dump and compress the output
echo "Starting database backup to $BACKUP_FILE..."
pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully."
else
    echo "Error: Database backup failed."
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;

echo "Backup process finished."
