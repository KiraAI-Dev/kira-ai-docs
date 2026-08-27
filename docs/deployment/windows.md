# Windows Deployment

This guide will help you deploy KiraAI on Windows systems.

## System Requirements

- Windows 10/11
- Python 3.10+ (recommended 3.10-3.12)
- Network connection

## Installation Steps

### 1. Install Python

1. Visit the [Python official website](https://www.python.org/downloads/windows/) to download Python 3.10 or higher
2. Run the installer and make sure to check "Add Python to PATH"
3. After installation is complete, open Command Prompt or PowerShell to verify the installation:

```powershell
python --version
pip --version
```

### 2. Install Git (Optional)

If you need to use Git to clone the project:

1. Visit the [Git official website](https://git-scm.com/download/win) to download Git
2. Run the installer and use the default options
3. Verify the installation:

```powershell
git --version
```

### 3. Get KiraAI

#### Method 1: Clone using Git (Recommended)

```powershell
git clone https://github.com/KiraAI-Dev/KiraAI.git
cd KiraAI
```

#### Method 2: Download ZIP file directly

1. Visit the [KiraAI GitHub repository](https://github.com/KiraAI-Dev/KiraAI)
2. Click the "Code" button and select "Download ZIP"
3. Extract the ZIP file to the directory of your choice
4. Open Command Prompt or PowerShell and navigate to the extracted directory

### 4. Create Virtual Environment and Install Dependencies

### 5. Start the Service

Method 1: Start with Script (Recommended)

```powershell
scripts\run.bat
```

Method 2: Start Directly

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

python main.py
```

## Access KiraAI

After deployment is complete, you can access KiraAI's Web management interface through the following address:

http://localhost:5267

If accessing remotely, replace localhost with the server IP address.

## Notes

- Ensure the firewall allows port 5267 (or other ports you configured)
- It is recommended to use a virtual environment to isolate project dependencies
- Regularly update project code to get the latest features and security fixes

## Troubleshooting

- Check if Python version meets requirements: `python --version`
- Ensure the virtual environment is properly activated: `venv\Scripts\activate`
- View project logs to locate errors
- Check if the port is occupied by other services: `netstat -ano | findstr :5267`
- If you encounter permission issues, try running Command Prompt or PowerShell as administrator

## Common Issues

1. **Unable to activate virtual environment**
   - Ensure you are using the correct path: `venv\Scripts\activate`
   - If you encounter execution policy issues, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

2. **Dependency installation failed**
   - Try updating pip: `pip install --upgrade pip`
   - Ensure network connection is normal
   - Check if requirements.txt file exists

3. **Port is occupied**
   - Find the process occupying the port: `netstat -ano | findstr :5267`
   - Terminate the process occupying the port: `taskkill /PID <Process ID> /F`
