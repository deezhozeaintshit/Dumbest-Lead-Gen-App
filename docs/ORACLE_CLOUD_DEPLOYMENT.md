# Oracle Cloud "Always Free" Deployment Guide

This guide walks through deploying the application 24/7 on Oracle Cloud Infrastructure (OCI) under their **Always Free Tier** at **$0/month forever**.

---

## 1. What Oracle Always Free Provides
- **Architecture**: Ampere A1 Compute (ARM64)
- **Resources**: Up to 4 OCPUs and 24 GB of RAM (can be allocated to 1 VM or split into multiple)
- **Storage**: 200 GB of NVMe Block Volume storage
- **Bandwidth**: 10 TB/month outbound data transfer

This is more than enough computing power and storage to run this ingestion pipeline, its SQLite database, and heavy background crawling processes continuously without slowdowns.

---

## 2. Step-by-Step Server Setup

### Step 1: Create Compute Instance
1. Log into your [Oracle Cloud Console](https://cloud.oracle.com).
2. Go to **Compute** > **Instances** > **Create Instance**.
3. **Name**: `b2b-lead-pipeline`
4. **Image**: Choose `Ubuntu 22.04 LTS` or `Ubuntu 24.04 LTS` (ARM64 Ampere compatible).
5. **Shape**: Select **Ampere** (`VM.Standard.A1.Flex`) with **2 OCPUs** and **12 GB RAM**.
6. **SSH Keys**: Download both the private and public SSH keys to your local machine.
7. Click **Create** and wait 1–2 minutes for the instance status to turn green (**Running**). Note down the **Public IP Address**.

---

### Step 2: Open Ingress Ports in Oracle Cloud Console
Oracle Cloud instances block all ports by default except port 22. You must open web traffic ports:

1. In the instance details, click on the **Virtual Cloud Network (VCN)** subnet.
2. Click on the **Default Security List**.
3. Click **Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `80, 443, 3000`
   - **Description**: `Web and API ingress traffic`
4. Click **Add Ingress Rules**.

---

### Step 3: Connect via SSH & Configure Firewall
On your local computer, open a terminal:

```bash
chmod 400 /path/to/ssh-private-key.key
ssh -i /path/to/ssh-private-key.key ubuntu@<YOUR_VM_PUBLIC_IP>
```

Once connected inside the Ubuntu VM, allow traffic through Ubuntu's internal firewall:

```bash
# Update Ubuntu package lists
sudo apt update && sudo apt upgrade -y

# Configure internal firewall rules
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT

# Persist firewall rules across reboots
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

---

### Step 4: Install Node.js 20 LTS & Build Essentials

```bash
# Install NodeSource repository for Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js, npm, git, and build tools
sudo apt install -y nodejs git build-essential

# Verify versions
node -v   # Should output v20.x.x
npm -v
```

---

### Step 5: Deploy Application Code & Build

```bash
# Clone the repository
git clone <YOUR_GIT_REPO_URL> ~/lead-pipeline
cd ~/lead-pipeline

# Install dependencies
npm install

# Setup environment configuration
cp .env.example .env
nano .env   # Configure any custom variables or JWT secrets (Ctrl+O, Enter, Ctrl+X to save)

# Generate Prisma Client and initialize SQLite DB
npx prisma generate
npx prisma db push

# Build production bundle (Frontend + Express server bundle)
npm run build
```

---

### Step 6: Run 24/7 with PM2 Process Manager

PM2 keeps the Node.js application running in the background and restarts it automatically if the process exits or the VM restarts:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Launch the compiled server
pm2 start dist/server.cjs --name "lead-pipeline"

# Configure PM2 to launch on system startup
pm2 startup
# (Run the generated 'sudo env PATH=...' command shown in terminal output)

# Save current PM2 processes
pm2 save
```

Your app is now live and accessible at `http://<YOUR_VM_PUBLIC_IP>:3000`!

---

### Step 7 (Recommended): Configure Nginx & Free Let's Encrypt SSL

To serve the app cleanly over standard HTTPS (`https://yourdomain.com`) with a free SSL certificate:

```bash
# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/lead-pipeline
```

Paste the following Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com; # Or your server's Public IP

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/lead-pipeline /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Obtain free SSL certificate via Let's Encrypt (if using a domain):
```bash
sudo certbot --nginx -d yourdomain.com
```
Nginx will automatically handle certificate renewal and redirect all HTTP traffic to secure HTTPS.
