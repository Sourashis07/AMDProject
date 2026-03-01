# Deployment Guide

## Local Development Setup

### Prerequisites
- Python 3.11
- MySQL 8.0
- Ollama with llama3.1:8b
- Firebase project with credentials

### Steps

1. **Clone and Setup**
```bash
cd backend
# Windows
setup.bat
# Linux/Mac
chmod +x setup.sh
./setup.sh
```

2. **Configure Environment**
Edit `.env` file with your settings

3. **Initialize Database**
```bash
python init_db.py
```

4. **Run Application**
```bash
python main.py
```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Ensure Ollama is running on host**
```bash
ollama serve
ollama pull llama3.1:8b
```

2. **Place Firebase credentials**
```bash
cp /path/to/firebase-credentials.json ./firebase-credentials.json
```

3. **Start services**
```bash
docker-compose up -d
```

4. **Check logs**
```bash
docker-compose logs -f backend
```

5. **Initialize database**
```bash
docker-compose exec backend python init_db.py
```

### Manual Docker Build

```bash
# Build image
docker build -t agentic-ai-backend .

# Run container
docker run -d \
  --name agentic-backend \
  -p 8000:8000 \
  -e DATABASE_URL=mysql+pymysql://root:password@host.docker.internal:3306/agentic_ai \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/chroma_db:/app/chroma_db \
  -v $(pwd)/firebase-credentials.json:/app/firebase-credentials.json \
  agentic-ai-backend
```

## LAN Access Configuration

### Windows Firewall

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port "8000"
6. Allow the connection
7. Apply to all profiles
8. Name it "Agentic AI Backend"

### Access from other devices

```
http://<YOUR_LOCAL_IP>:8000
```

Find your local IP:
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

## Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS/SSL
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Configure firewall rules
- [ ] Enable database backups
- [ ] Set up monitoring and alerting
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Enable rate limiting
- [ ] Set up logging aggregation

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL with Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Systemd Service (Linux)

Create `/etc/systemd/system/agentic-ai.service`:

```ini
[Unit]
Description=Agentic AI Backend
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/agentic-ai/backend
Environment="PATH=/opt/agentic-ai/backend/venv/bin"
ExecStart=/opt/agentic-ai/backend/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable agentic-ai
sudo systemctl start agentic-ai
sudo systemctl status agentic-ai
```

### Database Backup

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p agentic_ai > backup_$DATE.sql
gzip backup_$DATE.sql

# Keep only last 7 days
find . -name "backup_*.sql.gz" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

### Monitoring

#### Health Check Endpoint
```bash
curl http://localhost:8000/health
```

#### Prometheus Metrics (Optional)
Add `prometheus-fastapi-instrumentator` to requirements.txt

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

### Performance Tuning

#### Uvicorn Workers
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Gunicorn with Uvicorn Workers
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Scaling

#### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Multiple backend instances
- Shared MySQL and ChromaDB storage
- Redis for session management

#### Vertical Scaling
- Increase MAX_WORKERS in .env
- Allocate more RAM to MySQL
- Use faster storage (SSD/NVMe)

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux
lsof -i :8000
kill -9 <PID>
```

### Database Connection Issues
```bash
# Test connection
mysql -h localhost -u root -p -e "SHOW DATABASES;"

# Check if MySQL is running
# Windows
sc query MySQL80

# Linux
systemctl status mysql
```

### Ollama Not Responding
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama
# Windows: Restart from system tray
# Linux:
systemctl restart ollama
```

### ChromaDB Persistence Issues
```bash
# Check directory permissions
ls -la chroma_db/

# Fix permissions
chmod -R 755 chroma_db/
```

## Maintenance

### Update Dependencies
```bash
pip install --upgrade -r requirements.txt
```

### Database Migrations
```bash
# Backup first
mysqldump -u root -p agentic_ai > backup.sql

# Run migration
python init_db.py
```

### Clear ChromaDB
```bash
# Backup first
cp -r chroma_db chroma_db_backup

# Clear
rm -rf chroma_db/*
```

## Support

For issues, check:
1. Application logs: `logs/app.log`
2. Docker logs: `docker-compose logs`
3. MySQL logs: `/var/log/mysql/error.log`
4. Ollama logs: Check Ollama service logs
