# 📦 Deployment Guide - Bluewave Messenger Backend

Полное руководство по развёртыванию на production сервере.

## 🚀 Deployment Options

### Option 1: Heroku (Простейший способ)

```bash
# 1. Установи Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Create app
heroku create bluewave-messenger-api

# 4. Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev -a bluewave-messenger-api

# 5. Set environment variables
heroku config:set JWT_SECRET=your-secret-key -a bluewave-messenger-api
heroku config:set NODE_ENV=production -a bluewave-messenger-api

# 6. Deploy
git push heroku main

# 7. Run migrations
heroku run npm run typeorm migration:run -a bluewave-messenger-api
```

### Option 2: AWS EC2 + RDS

#### Step 1: Launch EC2 Instance
```bash
# AMI: Ubuntu 22.04 LTS
# Instance Type: t3.micro (free tier)
# Security Group: Allow SSH (22), HTTP (80), HTTPS (443), Custom TCP (3000)
```

#### Step 2: SSH into Instance
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### Step 3: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### Step 4: Clone and Setup Project
```bash
# Clone repo
git clone https://github.com/your-repo/bluewave.git
cd bluewave

# Install dependencies
npm install

# Create .env file
nano .env
# Add:
# DB_HOST=your-rds-endpoint
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=your-password
# DB_NAME=bluewave_messenger
# JWT_SECRET=your-secret-key
# NODE_ENV=production
# PORT=3000

# Build
npm run build
```

#### Step 5: Setup PM2
```bash
# Start with PM2
pm2 start dist/main.js --name "bluewave-api"

# Save PM2 configuration
pm2 save

# Setup startup
pm2 startup
# Follow the command it outputs
```

#### Step 6: Setup Nginx Reverse Proxy
```bash
sudo nano /etc/nginx/sites-available/bluewave

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/bluewave /etc/nginx/sites-enabled/

# Test nginx
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### Step 7: Setup SSL (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d your-domain.com

# Auto-renewal should be set up automatically
sudo systemctl enable certbot.timer
```

### Option 3: Docker + Compose

#### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

#### Step 2: Build and Push Image
```bash
# Build
docker build -t your-registry/bluewave-api:latest .

# Push to registry
docker push your-registry/bluewave-api:latest
```

#### Step 3: Run with Docker Compose on Server
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 4: DigitalOcean App Platform (Recommended)

1. Connect your GitHub repository
2. Create new App
3. Select Node.js service
4. Add PostgreSQL database
5. Set environment variables
6. Deploy

## 🗄️ Database Setup

### PostgreSQL on AWS RDS
```bash
# Create RDS PostgreSQL instance
# Engine: PostgreSQL 14
# Allocated storage: 20 GB (free tier)
# DB instance class: db.t3.micro
# Storage type: gp2
# Enable public accessibility: Yes (for initial setup)

# After creation, run schema:
psql -h your-rds-endpoint -U postgres -d bluewave_messenger -f schema.sql
```

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Enable VPC and security groups (whitelist IPs)
- [ ] Enable SSL/TLS certificates
- [ ] Setup WAF (Web Application Firewall)
- [ ] Enable database backups
- [ ] Setup monitoring and alerts
- [ ] Enable CloudTrail logging
- [ ] Rotate JWT_SECRET regularly
- [ ] Enable rate limiting
- [ ] Setup CORS properly

## 📊 Monitoring

### CloudWatch (AWS)
```bash
# Setup CloudWatch Logs
# Monitor: CPU, Memory, Network, Database

# Setup SNS alerts for critical metrics
```

### PM2 Plus (Recommended)
```bash
pm2 plus

# Free tier includes:
# - Real-time monitoring
# - Log streaming
# - Exception tracking
# - Memory leak detection
```

## 📈 Scaling

### Horizontal Scaling
1. Load Balancer (ALB/NLB)
2. Multiple EC2 instances
3. Auto Scaling Group

### Vertical Scaling
- Upgrade EC2 instance type
- Increase RDS storage

### Database Scaling
```bash
# Read Replicas
# Multi-AZ deployment
# CloudFront caching
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Heroku
        uses: AkhileshNS/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: bluewave-messenger-api
```

## 📝 Environment Variables for Production

```
# Database
DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=secure-password-here
DB_NAME=bluewave_messenger
DB_LOGGING=false

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=generate-secure-secret-here
JWT_EXPIRATION=86400

# CORS
CORS_ORIGIN=https://your-app.com

# Firebase (Optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# S3 (Optional)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=us-east-1
```

## 🔧 Maintenance

### Regular Backups
```bash
# Daily automated backups
pg_dump -h host -U user -d dbname > backup-$(date +%Y%m%d).sql
```

### Log Rotation
```bash
# Setup logrotate for PM2 logs
sudo nano /etc/logrotate.d/pm2-logs
```

### Updates
```bash
# Check for security updates
npm audit

# Update dependencies safely
npm update

# Test in staging first!
```

## 🚨 Troubleshooting

### Port Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database Connection Issues
```bash
# Test connection
psql -h host -U user -d dbname

# Check security group rules
# Ensure port 5432 is open
```

### Memory Issues
```bash
# Monitor with PM2
pm2 monit

# Increase swap space
sudo dd if=/dev/zero of=/swapfile bs=1G count=2
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📞 Support

- Documentation: README.md
- API Tests: Postman collection
- Issues: GitHub Issues
