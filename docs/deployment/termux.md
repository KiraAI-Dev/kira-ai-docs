# Termux Deployment

:::tip Community Contribution
This deployment guide was contributed by the community
:::

This guide will help you deploy KiraAI on Termux.

## Part 1: Prerequisites
### 1. Install Termux
https://github.com/termux/termux-app
Download and install v0.118.3 or higher.
### 2. Basic Environment Setup — Open Termux and run the following commands for initial setup.

   ```bash
   # 1. Switch to a domestic mirror source (select option 3: Mainland China)
   termux-change-repo

   # 2. Install PRoot environment
   pkg install proot-distro -y

   # 3. Install Debian
   proot-distro install debian

   # 4. Log into the Debian environment
   proot-distro login debian

   ```
### 3. Switch Debian Mirror Source If Needed (requires manual selection)

   ```bash
   bash <(curl -sSL https://linuxmirrors.cn/main.sh)
   # Manually select: Aliyun, Public Network, HTTPS
   # When prompted to update packages: select No (enter n)
   # When prompted to clean up: select Yes (enter y)

   apt install -y sudo curl libgcrypt20
   # Install required system packages: sudo, curl, libgcrypt20
   ```
### 4. Disable Background Kill:
Acquire wakelock — select "No restrictions",
then confirm "wake lock held" is shown.

### 5. Exit the Debian Environment and return to Termux native environment

   ```bash
   exit
   ```
### 6. Add shortcut command "deb" in the native environment for quick Debian access

   ```bash
   # 1. Add the "deb" alias for quick entry into the Debian environment
   echo "alias deb='proot-distro login debian'" >> ~/.bashrc

   # 2. Add a reminder message shown on next launch (same pattern used below)
   echo "echo ' Enter deb or (proot-distro login debian) to enter the Debian environment'" >> ~/.bashrc
   source ~/.bashrc

   ```

## Part 2: Install NapCat

Perform the installation inside the Debian environment:

### 1. Enter the Debian Environment

```bash
deb
```
### 2. Download and Install NapCat

```bash
curl -O https://raw.githubusercontent.com/NapNeko/NapCat-Installer/refs/heads/main/script/install.sh
```
### 3. Grant Permission and Run

```bash
chmod +x install.sh && ./install.sh
# When prompted, select n for "shell package install"
# When prompted, select n for "do not install NapCat TUI-CLI"
# Recommended to run on a good network connection. Only use a proxy if downloads are extremely slow.
```

### 4. Reload Configuration

```bash
source ~/.bashrc
```

### 5. Start NapCat (first launch will require QR code login)

```bash
xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox
```
#### Normal log output indicates a successful start.
#### For detailed login configuration, refer to the official NapCat documentation.


## Part 3: Install KiraAI
### 1. Ensure you are in the proot environment — the prompt should show "root@localhost:~#"
### 2. Install Git

```bash
apt update && apt install -y git
git --version
# 1. Update package list and install git
# 2. Verify installation (output like "git version x.x.x" means success)
```

### 3. Choose a location for KiraAI

```bash
cd /root
```
### 4. Clone the KiraAI Repository
```bash
git clone https://github.com/KiraAI-Dev/KiraAI.git
```
If you see the error: `fatal: unable to access... Recv_failure: Software caused connection abort`
it means the network connection failed — use a VPN/proxy.

### 5. Navigate into the KiraAI directory
### 6. Install pyenv compilation dependencies
```bash
apt install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev xz-utils \
tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
```

### 7. Download Python Source Code (using Aliyun mirror)

```bash
wget https://mirrors.aliyun.com/python-release/source/Python-3.11.11.tgz
```
### 8. Confirm the file exists after download

```bash
ls -la Python-3.11.11.tgz
```

### 9. Extract

```bash
tar -xzf Python-3.11.11.tgz
```

### 10. Compile Python
```bash
# 1. Enter the source directory
cd /root/Python-3.11.11

# 2. Configure (the --enable-shared flag is critical)
./configure --enable-optimizations --enable-shared

# 3. Compile (this step requires patience)
make -j$(nproc)

# 4. Install
make altinstall

# 5. Update library cache after installation
ldconfig

# 6. Verify installation
ls -l /usr/local/bin/python3.11
/usr/local/bin/python3.11 --version
```

### 11. Start KiraAI

```bash
# 1. Enter project directory
cd /root/KiraAI

# 2. Create and configure a Python virtual environment
python3.11 -m venv .venv

# 3. Activate the virtual environment
source .venv/bin/activate

# 4. Install project dependencies
pip install -r requirements.txt

# 5. Run KiraAI
cd scripts
./run.sh
```
#### Normal log output indicates a successful start.

## Part 4: Add Global Shortcut Launch Commands
#### To launch NapCat and KiraAI with a single command from the Termux native environment, add the following aliases:

```bash
# Run in the Termux native environment

# 1. One-command NapCat launcher
echo "alias NC='proot-distro login debian -- bash -c \"xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox\"'" >> ~/.bashrc
echo "echo 'Enter NC to start NapCat (auto-enters Debian and runs NapCat)'" >> ~/.bashrc

# 2. One-command KiraAI launcher
echo "alias kira-ai='proot-distro login debian -- bash -c \"cd /root/KiraAI && source .venv/bin/activate && cd scripts && ./run.sh\"'" >> ~/.bashrc
echo "echo ' Enter kira-ai to launch KiraAI (auto-enters Debian and activates .venv)'" >> ~/.bashrc

# 3. Reload configuration
source ~/.bashrc
```

### Daily Usage

1. Start NapCat: type `NC` in Termux and press Enter.
2. Start KiraAI: open a new Termux session, type `kira-ai` and press Enter.

## Accessing KiraAI

Once deployed, access KiraAI's web management interface at:
http://localhost:5267
For remote access, replace `localhost` with your server's IP address.

## Notes

- Ensure your firewall allows port 5267 (or whichever port you configured)
- Some steps require manual input — read the comments carefully

## Troubleshooting

- Check Python version: `python --version`
- Ensure the virtual environment is activated: `source .venv/bin/activate`
- Check the project logs to locate errors

## FAQ
- If you see the error: `fatal: unable to access... Recv_failure: Software caused connection abort`
  it means the network connection failed — use a VPN/proxy.
