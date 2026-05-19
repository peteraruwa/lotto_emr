#!/usr/bin/env bash
# ============================================================
# Lotto Central Hospital EMR — Backup Script
#
# Backs up:
#   1. PostgreSQL database via pg_dump
#   2. MinIO object storage via mc mirror
#
# Retention: keeps last 7 days of backups, deletes older ones.
#
# Usage:
#   ./deploy/backup/backup.sh
#
# Recommended: add to crontab for nightly execution:
#   0 2 * * * /opt/lotto-emr/deploy/backup/backup.sh >> /var/log/emr-backup.log 2>&1
# ============================================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-/var/backups/lotto-emr}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_BASE_DIR}/${TIMESTAMP}"

# Database
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-medplum}"
DB_USER="${DATABASE_USERNAME:-medplum}"
PGPASSWORD="${DATABASE_PASSWORD:-}"

# MinIO
MINIO_ALIAS="${MINIO_ALIAS:-emr-minio}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
MINIO_BUCKET="lotto-hospital-medplum-storage"

# ── Helpers ──────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
err() { log "ERROR: $*" >&2; }

check_deps() {
  local missing=()
  command -v pg_dump >/dev/null 2>&1 || missing+=("pg_dump (postgresql-client)")
  command -v mc >/dev/null 2>&1 || missing+=("mc (minio-client)")
  if [ ${#missing[@]} -gt 0 ]; then
    err "Missing required tools: ${missing[*]}"
    err "Install with: apt-get install postgresql-client && snap install minio-client"
    exit 1
  fi
}

# ── Main ─────────────────────────────────────────────────────
main() {
  log "=== Lotto Central Hospital EMR Backup ==="
  log "Backup directory: ${BACKUP_DIR}"

  check_deps

  mkdir -p "${BACKUP_DIR}/postgres" "${BACKUP_DIR}/minio"

  # ── 1. PostgreSQL backup ──────────────────────────────────
  log "Starting PostgreSQL backup..."
  export PGPASSWORD="${PGPASSWORD}"

  pg_dump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --no-password \
    --file="${BACKUP_DIR}/postgres/${DB_NAME}_${TIMESTAMP}.dump"

  local pg_size
  pg_size=$(du -sh "${BACKUP_DIR}/postgres/" | cut -f1)
  log "PostgreSQL backup complete. Size: ${pg_size}"

  # ── 2. MinIO backup ──────────────────────────────────────
  log "Starting MinIO backup..."

  # Configure MinIO client alias (idempotent)
  mc alias set "${MINIO_ALIAS}" \
    "${MINIO_ENDPOINT}" \
    "${MINIO_ACCESS_KEY}" \
    "${MINIO_SECRET_KEY}" \
    --api S3v4 \
    >/dev/null 2>&1

  mc mirror \
    "${MINIO_ALIAS}/${MINIO_BUCKET}" \
    "${BACKUP_DIR}/minio/${MINIO_BUCKET}" \
    --overwrite \
    --remove

  local minio_size
  minio_size=$(du -sh "${BACKUP_DIR}/minio/" | cut -f1)
  log "MinIO backup complete. Size: ${minio_size}"

  # ── 3. Write backup manifest ─────────────────────────────
  cat > "${BACKUP_DIR}/manifest.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "database": {
    "host": "${DB_HOST}",
    "port": "${DB_PORT}",
    "name": "${DB_NAME}",
    "file": "postgres/${DB_NAME}_${TIMESTAMP}.dump"
  },
  "minio": {
    "endpoint": "${MINIO_ENDPOINT}",
    "bucket": "${MINIO_BUCKET}",
    "directory": "minio/${MINIO_BUCKET}"
  },
  "retention_days": ${RETENTION_DAYS}
}
EOF
  log "Manifest written to ${BACKUP_DIR}/manifest.json"

  # ── 4. Enforce retention policy ───────────────────────────
  log "Enforcing retention policy: keeping last ${RETENTION_DAYS} days..."

  find "${BACKUP_BASE_DIR}" -maxdepth 1 -mindepth 1 -type d \
    -mtime "+${RETENTION_DAYS}" \
    -print \
    -exec rm -rf {} \; 2>/dev/null || true

  log "Old backups pruned."

  # ── 5. Summary ───────────────────────────────────────────
  local total_size
  total_size=$(du -sh "${BACKUP_DIR}" | cut -f1)
  log "=== Backup complete ==="
  log "Location : ${BACKUP_DIR}"
  log "Total size: ${total_size}"
}

main "$@"
