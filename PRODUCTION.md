# Production Deployment Guide

Deploy the AI Classroom Attendance system for real-world use with Nginx, SSL, and proper environment configuration.

---

## Overview

Production stack:
```
Internet → Nginx (SSL termination) → Docker containers
                                      ├── frontend :3000
                                      └── backend  :8000
```

---

## 1. Build Production Docker Images

```bash
docker-compose -f docker-compose.yml build
```

Or build individually:
```bash
docker build -t attendance-backend ./backend
docker build -t attendance-frontend ./frontend
```

---

## 2. Environment Variables

Never hardcode secrets. Create a `.env` file on the server (not committed to git):

```bash
# /opt/attendance/.env
DATABASE_URL=sqlite:////data/attendance.db
UPLOAD_DIR=/data/uploads
FACE_RECOGNITION_TOLERANCE=0.5
SECRET_KEY=your-secret-key-here-change-this
ALLOWED_ORIGINS=https://attendance.yourdomain.com
```

Reference in `docker-compose.yml`:
```yaml
services:
  backend:
    env_file: .env
```

---

## 3. Nginx Reverse Proxy

Install Nginx on the host:
```bash
sudo apt-get install nginx
```

Create `/etc/nginx/sites-available/attendance`:
```nginx
server {
    listen 80;
    server_name attendance.yourdomain.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name attendance.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/attendance.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/attendance.yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for face recognition uploads
        proxy_read_timeout 120s;
        client_max_body_size 20M;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. SSL / HTTPS with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d attendance.yourdomain.com
```

Auto-renewal is configured automatically by certbot. Verify:
```bash
sudo certbot renew --dry-run
```

---

## 5. Run in Production

```bash
docker-compose up -d
```

Set Docker to start on system boot:
```bash
sudo systemctl enable docker
```

Add a restart policy in `docker-compose.yml` (already set to `unless-stopped`).

---

## 6. Persistent Data & Backups

Data is stored in:
- `backend/attendance.db` — SQLite database
- `backend/uploads/` — enrolled face images (or Docker volume `uploads_data`)

### Automated backup (cron)

```bash
# /etc/cron.d/attendance-backup
0 2 * * * root tar -czf /backups/attendance-$(date +\%Y\%m\%d).tar.gz \
  /opt/attendance/backend/attendance.db \
  /opt/attendance/backend/uploads/
```

Retain 30 days:
```bash
find /backups -name "attendance-*.tar.gz" -mtime +30 -delete
```

### Restore from backup

```bash
docker-compose down
tar -xzf /backups/attendance-20240101.tar.gz -C /
docker-compose up -d
```

---

## 7. Monitoring

View live logs:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

Check container health:
```bash
docker-compose ps
```

---

## 8. Upgrading

```bash
git pull origin main
docker-compose build
docker-compose up -d
```

The SQLite database and uploads are preserved in volumes and bind mounts.
