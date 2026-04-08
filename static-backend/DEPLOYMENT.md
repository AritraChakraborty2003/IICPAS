# Deployment Guide for Static-Backend Microservice

## Prerequisites

- Node.js 16+ installed on your server
- MongoDB 5.0+ installed and running on your server
- Access to deploy at `cdn.iicpa.in`
- Proper file permissions for uploads directory

## Quick Setup (Recommended)

### Automated Deployment Setup
1. **Clone and navigate to the project:**
   ```bash
   cd static-backend
   ```

2. **Run the deployment setup script:**
   ```bash
   ./deploy-setup.sh
   ```

3. **Update .env with your actual values:**
   ```bash
   nano .env
   # Update MongoDB URI, CDN URL, etc.
   ```

4. **Start the service:**
   ```bash
   npm start
   ```

### What the Setup Script Does
- ✅ Creates required upload directories (`uploads/images`, `uploads/videos`)
- ✅ Sets proper file permissions
- ✅ Creates `.env` file with default configuration
- ✅ Installs npm dependencies
- ✅ Sets up MongoDB indexes
- ✅ Provides deployment checklist

## Step 1: Server Setup

### 1.1 Install MongoDB
```bash
# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Check MongoDB status
sudo systemctl status mongodb

# Verify MongoDB is running
mongo --eval "db.runCommand('ping')"
```

### 1.2 Create Directory Structure
```bash
mkdir -p /var/www/static-backend
cd /var/www/static-backend
```

### 1.2 Upload Files
Upload all files from the `static-backend` directory to your server:
- `index.js`
- `package.json`
- `config.env`
- `README.md`

### 1.3 Install Dependencies
```bash
npm install --production
```

## Step 2: Environment Configuration

### 2.1 Update config.env
```bash
nano config.env
```

Update the following values:
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# CDN Configuration - IMPORTANT: Update this to your domain
CDN_BASE_URL=https://cdn.iicpa.in

# File Upload Limits
MAX_IMAGE_SIZE=5242880
MAX_VIDEO_SIZE=367001600

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/static_backend
MONGODB_DB_NAME=static_backend

# Allowed File Types
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
ALLOWED_VIDEO_TYPES=video/mp4,video/avi,video/mov,video/wmv/video/flv
```

### 2.2 Create Upload Directories
```bash
mkdir -p uploads/images uploads/videos
chmod 755 uploads uploads/images uploads/videos
chown www-data:www-data uploads uploads/images uploads/videos
```

## Step 3: Process Management

### 3.1 Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 3.2 Create PM2 Configuration
```bash
nano ecosystem.config.js
```

Add this content:
```javascript
module.exports = {
  apps: [{
    name: 'static-backend',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 3.3 Create Logs Directory
```bash
mkdir logs
chmod 755 logs
```

### 3.4 Start the Service
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 4: Nginx Configuration

### 4.1 Create Nginx Site Configuration
```bash
nano /etc/nginx/sites-available/cdn.iicpa.in
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name cdn.iicpa.in;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cdn.iicpa.in;
    
    # SSL Configuration
    ssl_certificate /path/to/your/ssl/certificate.crt;
    ssl_certificate_key /path/to/your/ssl/private.key;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Serve static files directly for better performance
    location /uploads/ {
        alias /var/www/static-backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }
}
```

### 4.2 Enable the Site
```bash
ln -s /etc/nginx/sites-available/cdn.iicpa.in /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 5: SSL Certificate (Let's Encrypt)

### 5.1 Install Certbot
```bash
apt install certbot python3-certbot-nginx
```

### 5.2 Obtain SSL Certificate
```bash
certbot --nginx -d cdn.iicpa.in
```

### 5.3 Auto-renewal
```bash
crontab -e
```

Add this line:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 6: Firewall Configuration

### 6.1 Configure UFW
```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

## Step 7: Testing

### 7.1 Test Health Endpoint
```bash
curl https://cdn.iicpa.in/health
```

### 7.2 Test File Upload
```bash
# Test image upload
curl -X POST https://cdn.iicpa.in/upload/image \
  -F "image=@/path/to/test-image.jpg"

# Test video upload
curl -X POST https://cdn.iicpa.in/upload/video \
  -F "video=@/path/to/test-video.mp4"
```

## Step 8: Monitoring

### 8.1 Check PM2 Status
```bash
pm2 status
pm2 logs static-backend
```

### 8.2 Check Nginx Status
```bash
systemctl status nginx
nginx -t
```

### 8.3 Monitor Disk Space
```bash
df -h /var/www/static-backend/uploads/
```

## Step 9: Backup Strategy

### 9.1 Database Backup
```bash
# Create backup script
nano /var/www/static-backend/backup.sh
```

Add content:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/static-backend"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MongoDB database
mongodump --db static_backend --out $BACKUP_DIR/mongodb_$DATE

# Backup uploaded files
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/static-backend/uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_*" -mtime +7 -exec rm -rf {} \;
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 9.2 Make Executable and Schedule
```bash
chmod +x /var/www/static-backend/backup.sh
crontab -e
```

Add this line:
```
0 2 * * * /var/www/static-backend/backup.sh
```

## Troubleshooting

### Common Issues

#### ENOENT: no such file or directory error
**Error:** `Error: ENOENT: no such file or directory, open 'uploads/videos/filename.mp4'`

**Cause:** Upload directories don't exist on the server

**Solution:**
```bash
# Run the automated setup
./deploy-setup.sh

# Or manually create directories
mkdir -p uploads/images uploads/videos
chmod 755 uploads uploads/images uploads/videos

# Restart the service
npm start
```

**Prevention:** The service now automatically creates directories on startup

1. **Permission Denied**: Check file permissions and ownership
2. **Port Already in Use**: Check if another service is using port 3001
3. **Database Locked**: Restart the service with PM2
4. **Nginx 502**: Check if Node.js service is running

### Logs Location
- Application logs: `/var/www/static-backend/logs/`
- Nginx logs: `/var/log/nginx/`
- PM2 logs: `pm2 logs static-backend`

### Restart Services
```bash
pm2 restart static-backend
systemctl restart nginx
```

## Security Considerations

1. **File Type Validation**: Only allowed file types are accepted
2. **File Size Limits**: Enforced on both client and server
3. **CORS Configuration**: Configured for cross-origin requests
4. **Input Validation**: All inputs are validated and sanitized
5. **HTTPS Only**: All traffic should use HTTPS in production

## Performance Optimization

1. **Static File Serving**: Nginx serves uploads directly
2. **Caching**: Long-term caching for uploaded files
3. **Compression**: Enable gzip compression in Nginx
4. **CDN Integration**: Ready for CDN integration

## Maintenance

### Regular Tasks
- Monitor disk space usage
- Check log files for errors
- Update dependencies monthly
- Review and rotate logs
- Test backup restoration

### Updates
```bash
cd /var/www/static-backend
git pull origin main
npm install
pm2 restart static-backend
```
