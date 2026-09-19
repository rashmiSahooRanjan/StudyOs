# StudyOS Production Deployment Guide (Docker & VPS)

This guide walks you through deploying **StudyOS** using Docker and Docker Compose on any Linux VPS (Ubuntu, Debian, DigitalOcean, AWS EC2, Linode, Hetzner) or local server.

---

## 🚀 Quick Start (One-Command Deploy)

If you already have Docker installed:

```bash
# 1. Clone repository
git clone <your-repository-url> studyos
cd studyos

# 2. Configure environment
cp .env.example .env

# 3. Build and launch containers in background
docker compose up -d --build
```

Access StudyOS by navigating to:
```
http://<YOUR_SERVER_IP>
```
*(or `http://localhost` if running locally)*

---

## 📋 Full VPS Setup Guide (Step-by-Step)

### Step 1: Install Docker & Docker Compose on Ubuntu / Debian

SSH into your remote server:
```bash
ssh root@<YOUR_SERVER_IP>
```

Update system packages and install Docker:
```bash
# Update package list
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open and edit `.env`:
   ```bash
   nano .env
   ```
   Generate strong secret keys for production:
   ```bash
   # Generate random 32-byte hex keys:
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```
   Paste them into `SECRET_KEY` and `JWT_SECRET_KEY` in `.env`.

---

### Step 3: Launch StudyOS

```bash
docker compose up -d --build
```

Check the status of both containers:
```bash
docker compose ps
```
You should see:
- `studyos-backend` (healthy)
- `studyos-frontend` (running on port 80)

View real-time logs:
```bash
docker compose logs -f
```

---

## 🔒 Adding a Custom Domain & Free HTTPS (SSL)

### Option A: Cloudflare Tunnel (Recommended — No Port Forwarding Required)
1. In your Cloudflare Dashboard, go to **Zero Trust** > **Networks** > **Tunnels**.
2. Create a tunnel and install `cloudflared` on your server.
3. Route your domain (e.g. `study.yourdomain.com`) to `http://localhost:80`.
4. Cloudflare automatically provides free SSL, DDoS protection, and CDN caching without modifying Nginx!

### Option B: Certbot / Host Nginx Reverse Proxy
If your VPS has public ports 80 & 443:
1. In `.env`, change `PORT=8080` (so StudyOS doesn't conflict with host Nginx).
2. Re-run: `docker compose up -d`.
3. Install host Nginx and Certbot:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
4. Configure `/etc/nginx/sites-available/studyos`:
   ```nginx
   server {
       server_name study.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
5. Enable site and obtain SSL certificate:
   ```bash
   sudo ln -s /etc/nginx/sites-available/studyos /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d study.yourdomain.com
   ```

---

## 💾 Database Persistence & Backups

StudyOS stores all user logs, questions, mistake entries, and study sessions inside the `studyos-persistent-data` Docker volume at `/app/data/studyos.db`.

### 1. Download Database Backup
To extract a live backup copy of your database to the host machine:
```bash
docker cp studyos-backend:/app/data/studyos.db ./studyos_backup_$(date +%F).db
```

### 2. Restore Database from Backup
To restore from a backup file:
```bash
docker compose stop backend
docker cp ./studyos_backup.db studyos-backend:/app/data/studyos.db
docker compose start backend
```

---

## 🛠️ Maintenance Commands

| Task | Command |
| :--- | :--- |
| **Check container health** | `docker compose ps` |
| **View logs (both services)** | `docker compose logs -f` |
| **View backend logs only** | `docker compose logs -f backend` |
| **Stop application** | `docker compose down` |
| **Restart application** | `docker compose restart` |
| **Update to latest code** | `git pull && docker compose up -d --build` |
