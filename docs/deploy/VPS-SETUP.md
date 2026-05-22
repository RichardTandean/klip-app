# VPS Setup Guide

Step-by-step guide to provision and secure a fresh Ubuntu VPS for Klip SaaS.

## 1. Initial Setup (SSH into VPS)

```bash
ssh root@<VPS_IP>
```

## 2. Create User + SSH Key

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
mkdir ~/.ssh && chmod 700 ~/.ssh
echo "<YOUR_PUBLIC_KEY>" > ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 3. Secure SSH

```bash
sudo nano /etc/ssh/sshd_config
```

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

```bash
sudo systemctl restart sshd
```

## 4. Install Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker deploy
newgrp docker
```

## 5. Install Other Dependencies

```bash
# FFMPEG
sudo apt install -y ffmpeg

# yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Chromium (for Remotion rendering)
sudo apt install -y chromium-browser

# Node.js 20 (optional, for debugging on host)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 6. Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 7. Swap Space (for 4GB RAM)

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 8. Project Directory

```bash
mkdir -p /home/deploy/klip-saas
mkdir -p /home/deploy/klip-saas/data/postgres
mkdir -p /home/deploy/klip-saas/data/redis
mkdir -p /home/deploy/klip-saas/data/temp
mkdir -p /home/deploy/klip-saas/certbot
```

## 9. Environment

Create `/home/deploy/klip-saas/.env.production` with all required variables (see `.env.example`).

## 10. Deploy

See CI/CD workflow in `.github/workflows/deploy.yml`. For manual deploy:

```bash
cd /home/deploy/klip-saas
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps  # verify all running
```
