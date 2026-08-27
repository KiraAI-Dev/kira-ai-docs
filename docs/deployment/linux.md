# Linux Deployment

This guide will help you deploy KiraAI on Linux systems.

## Environment Requirements
- Python 3.10+ (recommended 3.10-3.12)
- Network connection

## Installation Steps

### 1. Install Dependencies

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install python3 python3-pip python3-venv git -y

# CentOS/RHEL
sudo yum update -y
sudo yum install python3 python3-pip python3-venv git -y
```

### 2. Download KiraAI

```bash
git clone https://github.com/KiraAI-Dev/KiraAI.git
cd KiraAI
```

### 3. Start the Service

Method 1: Start with Script (Recommended)

```bash
chmod +x scripts/run.sh
./scripts/run.sh
```

Method 2: Start Directly

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

python main.py
```

## Access KiraAI

After deployment is complete, you can access KiraAI's Web management interface through the following address:
`http://localhost:5267`
If accessing remotely, replace localhost with the server IP address.

## Notes

- Ensure the firewall allows port 5267 (or other ports you configured)
- It is recommended to use a process management tool (such as systemd) to manage the service
- Regularly update the project code to get the latest features and security fixes

## Troubleshooting

- Check if Python version meets requirements: `python3 --version`
- Ensure the virtual environment is properly activated: `which python`
- View project logs to locate errors
- Check if the port is occupied: `sudo lsof -i :5267`
