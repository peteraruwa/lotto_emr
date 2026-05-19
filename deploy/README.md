# Lotto Central Hospital EMR — Deployment Runbook

This document covers the on-premises Docker Compose deployment. For cloud (AWS/ECS) deployment see the Medplum infrastructure config at `/medplum.config.ts`.

---

## Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Docker | 24.x | https://docs.docker.com/engine/install/ |
| Docker Compose | 2.x (plugin) | Bundled with Docker Desktop / `apt install docker-compose-plugin` |
| mc (MinIO Client) | RELEASE.2024-01-01+ | `snap install minio-client` or https://min.io/docs/minio/linux/reference/minio-mc.html |
| nft | 1.0+ | `apt install nftables` |
| postgresql-client | 16 | `apt install postgresql-client-16` |

**Hardware minimum (production):**
- 4 vCPU, 8 GB RAM, 200 GB SSD
- Ubuntu 22.04 LTS or Debian 12

---

## Initial Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/lotto-central-hospital-emr.git /opt/lotto-emr
cd /opt/lotto-emr
```

### 2. Configure environment variables

```bash
cp deploy/env/.env.example deploy/env/.env.medplum
cp deploy/env/.env.example deploy/env/.env.web
```

Edit both files and fill in all required values:

```bash
nano deploy/env/.env.medplum
nano deploy/env/.env.web
```

Key variables you **must** set before starting:

| Variable | Description |
|----------|-------------|
| `DATABASE_PASSWORD` | Strong password for PostgreSQL |
| `REDIS_PASSWORD` | Redis authentication password |
| `JWT_SECRET` | 64-byte hex secret for JWTs (`openssl rand -hex 64`) |
| `MINIO_ACCESS_KEY` | MinIO root user (change from default) |
| `MINIO_SECRET_KEY` | MinIO root password (change from default) |
| `GEMINI_API_KEY` | Google Gemini API key for AI bots |

### 3. Configure the firewall

```bash
# Review and apply nftables rules
sudo nft -f deploy/firewall/nftables.rules

# Verify rules loaded
sudo nft list ruleset

# Persist across reboots
sudo cp deploy/firewall/nftables.rules /etc/nftables.conf
sudo systemctl enable nftables
sudo systemctl start nftables
```

### 4. Make scripts executable

```bash
chmod +x deploy/backup/backup.sh deploy/backup/restore.sh
```

---

## Starting Services

### Start all services

```bash
cd /opt/lotto-emr
docker compose -f deploy/docker-compose.yml up -d
```

### View logs

```bash
# All services
docker compose -f deploy/docker-compose.yml logs -f

# Single service
docker compose -f deploy/docker-compose.yml logs -f medplum-server
```

### Check health

```bash
docker compose -f deploy/docker-compose.yml ps
curl http://localhost:8103/healthcheck
curl http://localhost:3000/api/health
```

### Initial Medplum project setup

After first startup, seed the access policies and test users:

```bash
# Upload access policies
for file in medplum/access-policies/*.json; do
  curl -X POST http://localhost:8103/fhir/R4/AccessPolicy \
    -H "Authorization: Bearer $MEDPLUM_SUPERADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$file"
done

# Seed test users (non-prod only)
cd /opt/lotto-emr
MEDPLUM_BASE_URL=http://localhost:8103/ \
MEDPLUM_CLIENT_ID=... \
MEDPLUM_CLIENT_SECRET=... \
npx ts-node medplum/seed/seed.ts
```

---

## Stopping Services

```bash
# Graceful stop (preserves volumes)
docker compose -f deploy/docker-compose.yml stop

# Stop and remove containers (volumes preserved)
docker compose -f deploy/docker-compose.yml down

# Full teardown including volumes — DESTRUCTIVE, data will be lost
docker compose -f deploy/docker-compose.yml down -v
```

---

## Running Backups

### Manual backup

```bash
DATABASE_PASSWORD=your_db_password \
MINIO_SECRET_KEY=your_minio_secret \
./deploy/backup/backup.sh
```

### Scheduled backups (recommended)

Add to `/etc/cron.d/lotto-emr-backup`:

```cron
# Run nightly at 02:00
0 2 * * * root DATABASE_PASSWORD=... MINIO_SECRET_KEY=... /opt/lotto-emr/deploy/backup/backup.sh >> /var/log/emr-backup.log 2>&1
```

Backups are stored in `/var/backups/lotto-emr/<timestamp>/` and retained for 7 days by default.

---

## Restoring from Backup

```bash
# List available backups
ls -la /var/backups/lotto-emr/

# Restore from a specific backup
DATABASE_PASSWORD=your_db_password \
MINIO_SECRET_KEY=your_minio_secret \
./deploy/backup/restore.sh /var/backups/lotto-emr/20240515_020000
```

The restore script will:
1. Prompt for confirmation before proceeding.
2. Stop the web app and Medplum server.
3. Drop and recreate the database, then restore from the dump.
4. Restore MinIO objects from the mirrored backup.
5. Restart all services.

**After restore:** verify the application is healthy before resuming clinical operations.

---

## Patching Medplum

To upgrade the Medplum server to a new version:

1. Check the [Medplum changelog](https://github.com/medplum/medplum/releases) for breaking changes.
2. Take a backup: `./deploy/backup/backup.sh`
3. Edit `deploy/docker-compose.yml` and update the image tag:
   ```yaml
   image: medplum/medplum-server:3.3.0  # new version
   ```
4. Pull and restart:
   ```bash
   docker compose -f deploy/docker-compose.yml pull medplum-server
   docker compose -f deploy/docker-compose.yml up -d medplum-server
   ```
5. Check logs for migration errors:
   ```bash
   docker compose -f deploy/docker-compose.yml logs -f medplum-server
   ```

---

## Firewall Configuration

The nftables ruleset enforces a **default-deny egress** policy. Allowed outbound traffic:

| Destination | Port | Protocol | Purpose |
|-------------|------|----------|---------|
| LAN (10.x, 172.16.x, 192.168.x) | any | any | Internal services, Docker |
| Any | 53 | UDP/TCP | DNS resolution |
| Any | 123 | UDP | NTP time sync |
| `generativelanguage.googleapis.com` | 443 | TCP/HTTPS | Gemini AI API |
| SMTP relay | 587, 465 | TCP | Email notifications |

**To add a new allowed outbound destination:**

```bash
# Add the IP to the GEMINI_ALLOWED set (or create a new named set)
sudo nft add element inet filter GEMINI_ALLOWED { 1.2.3.4/32 }
```

Then update `deploy/firewall/nftables.rules` to persist across reboots.

---

## Troubleshooting

### Medplum server fails to start

Check database connectivity:
```bash
docker compose -f deploy/docker-compose.yml exec medplum-server \
  curl -f http://postgres:5432 2>&1 || true
docker compose -f deploy/docker-compose.yml logs postgres
```

### MinIO unreachable

```bash
docker compose -f deploy/docker-compose.yml logs minio
mc ls emr-minio/
```

### Database connection refused

Verify the password in `.env.medplum` matches what PostgreSQL was initialized with. If changed after init, you need to recreate the volume:

```bash
docker compose -f deploy/docker-compose.yml down
docker volume rm lotto_emr_postgres-data
docker compose -f deploy/docker-compose.yml up -d
```
