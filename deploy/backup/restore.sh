#!/usr/bin/env bash
# ============================================================
# Lotto Central Hospital EMR — Restore Script
#
# Restores:
#   1. PostgreSQL database from a pg_dump custom-format file
#   2. MinIO object storage from a mirrored backup directory
#
# Usage:
#   ./deploy/backup/restore.sh /var/backups/lotto-emr/20240515_020000
#
# WARNING: This will DROP and RECREATE the database. All current
# data will be permanently lost. Ensure services are stopped first.
# ============================================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-medplum}"
DB_USER="${DATABASE_USERNAME:-medplum}"
PGPASSWORD="${DATABASE_PASSWORD:-}"
DB_SUPERUSER="${DB_SUPERUSER:-postgres}"

MINIO_ALIAS="${MINIO_ALIAS:-emr-minio}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
MINIO_BUCKET="lotto-hospital-medplum-storage"

# ── Helpers ──────────────────────────────────────────────────
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
err()  { log "ERROR: $*" >&2; }
warn() { log "WARNING: $*" >&2; }

confirm() {
  local prompt="$1"
  local response
  echo ""
  echo "⚠️  ${prompt}"
  echo -n "Type 'YES' (all caps) to confirm, anything else to abort: "
  read -r response
  if [ "${response}" != "YES" ]; then
    log "Aborted by user."
    exit 0
  fi
}

check_deps() {
  local missing=()
  command -v pg_restore >/dev/null 2>&1 || missing+=("pg_restore (postgresql-client)")
  command -v psql >/dev/null 2>&1 || missing+=("psql (postgresql-client)")
  command -v mc >/dev/null 2>&1 || missing+=("mc (minio-client)")
  if [ ${#missing[@]} -gt 0 ]; then
    err "Missing required tools: ${missing[*]}"
    exit 1
  fi
}

# ── Main ─────────────────────────────────────────────────────
main() {
  local backup_dir="${1:-}"

  if [ -z "${backup_dir}" ]; then
    err "Usage: $0 <backup-directory>"
    err "Example: $0 /var/backups/lotto-emr/20240515_020000"
    exit 1
  fi

  if [ ! -d "${backup_dir}" ]; then
    err "Backup directory not found: ${backup_dir}"
    exit 1
  fi

  local manifest="${backup_dir}/manifest.json"
  if [ ! -f "${manifest}" ]; then
    warn "No manifest.json found in ${backup_dir} — proceeding with autodetection."
  else
    log "Manifest found:"
    cat "${manifest}"
    echo ""
  fi

  # Find the dump file
  local dump_file
  dump_file=$(find "${backup_dir}/postgres" -name "*.dump" | head -1)
  if [ -z "${dump_file}" ]; then
    err "No .dump file found in ${backup_dir}/postgres/"
    exit 1
  fi

  local minio_dir="${backup_dir}/minio/${MINIO_BUCKET}"
  if [ ! -d "${minio_dir}" ]; then
    err "MinIO backup directory not found: ${minio_dir}"
    exit 1
  fi

  check_deps

  log "=== Lotto Central Hospital EMR Restore ==="
  log "Backup source  : ${backup_dir}"
  log "Database dump  : ${dump_file}"
  log "MinIO source   : ${minio_dir}"
  echo ""

  confirm "This will PERMANENTLY DESTROY all current data in '${DB_NAME}' and replace it with the backup."

  # ── 1. Stop application services ─────────────────────────
  log "Stopping application services (web, medplum-server)..."
  docker compose -f "$(dirname "$0")/../docker-compose.yml" stop web medplum-server 2>/dev/null || \
    warn "Could not stop Docker services — ensure they are stopped manually before restoring."

  # ── 2. Restore PostgreSQL ─────────────────────────────────
  log "Restoring PostgreSQL database '${DB_NAME}'..."
  export PGPASSWORD="${PGPASSWORD}"

  # Terminate active connections to the database
  psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_SUPERUSER}" \
    --dbname="postgres" \
    --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" \
    >/dev/null 2>&1 || warn "Could not terminate existing connections — proceeding anyway."

  # Drop and recreate the database
  psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_SUPERUSER}" \
    --dbname="postgres" \
    --command="DROP DATABASE IF EXISTS ${DB_NAME};"

  psql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_SUPERUSER}" \
    --dbname="postgres" \
    --command="CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

  # Restore from dump
  pg_restore \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --no-password \
    --jobs=4 \
    --verbose \
    "${dump_file}"

  log "PostgreSQL restore complete."

  # ── 3. Restore MinIO ─────────────────────────────────────
  log "Restoring MinIO bucket '${MINIO_BUCKET}'..."

  mc alias set "${MINIO_ALIAS}" \
    "${MINIO_ENDPOINT}" \
    "${MINIO_ACCESS_KEY}" \
    "${MINIO_SECRET_KEY}" \
    --api S3v4 \
    >/dev/null 2>&1

  # Ensure the bucket exists
  mc mb --ignore-existing "${MINIO_ALIAS}/${MINIO_BUCKET}"

  # Mirror backup → MinIO (overwrite + remove deleted objects)
  mc mirror \
    "${minio_dir}" \
    "${MINIO_ALIAS}/${MINIO_BUCKET}" \
    --overwrite \
    --remove

  log "MinIO restore complete."

  # ── 4. Restart services ───────────────────────────────────
  log "Restarting application services..."
  docker compose -f "$(dirname "$0")/../docker-compose.yml" start medplum-server web 2>/dev/null || \
    warn "Could not restart Docker services — start them manually."

  log "=== Restore complete ==="
  log "Verify the application is healthy before resuming clinical operations."
}

main "$@"
