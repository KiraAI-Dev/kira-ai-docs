# Windows部署

本指南将帮助您在Windows系统上部署KiraAI。

## 系统要求

- Windows 10/11
- Python 3.10+（推荐3.10-3.12）
- 网络连接

## 安装步骤

### 1. 安装Python

1. 访问[Python官网](https://www.python.org/downloads/windows/)下载Python 3.10或更高版本
2. 运行安装程序，确保勾选"Add Python to PATH"
3. 完成安装后，打开命令提示符或PowerShell验证安装：

```powershell
python --version
pip --version
```

### 2. 安装Git（可选）

如果您需要使用Git克隆项目：

1. 访问[Git官网](https://git-scm.com/download/win)下载Git
2. 运行安装程序，使用默认选项即可
3. 验证安装：

```powershell
git --version
```

### 3. 获取KiraAI

#### 方式一：使用Git克隆（推荐）

```powershell
git clone https://github.com/KiraAI-Dev/KiraAI.git
cd KiraAI
```

#### 方式二：直接下载ZIP文件

1. 访问[KiraAI GitHub仓库](https://github.com/KiraAI-Dev/KiraAI)
2. 点击"Code"按钮，选择"Download ZIP"
3. 解压ZIP文件到您选择的目录
4. 打开命令提示符或PowerShell，进入解压后的目录

### 4. 创建虚拟环境和安装依赖

### 5. 启动服务

方式一：使用脚本启动（推荐）

```powershell
scripts\run.bat
```

方式二：直接启动

```powershell
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

python main.py
```

## 访问KiraAI

部署完成后，您可以通过以下地址访问KiraAI的Web管理界面：
http://localhost:5267
如果是远程访问，将localhost替换为服务器IP地址。

## 注意事项

- 确保防火墙允许5267端口（或您配置的其他端口）
- 建议使用虚拟环境来隔离项目依赖
- 定期更新项目代码以获取最新功能和安全修复

## 故障排查

- 检查Python版本是否符合要求：`python --version`
- 确保虚拟环境已正确激活：`venv\Scripts\activate`
- 查看项目日志以定位错误
- 检查端口是否被其他服务占用：`netstat -ano | findstr :5267`
- 如果遇到权限问题，尝试以管理员身份运行命令提示符或PowerShell

## 常见问题

1. **无法激活虚拟环境**
   - 确保使用正确的路径：`venv\Scripts\activate`
   - 如果遇到执行策略问题，运行：`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

2. **依赖安装失败**
   - 尝试更新pip：`pip install --upgrade pip`
   - 确保网络连接正常
   - 检查requirements.txt文件是否存在

3. **端口被占用**
   - 查找占用端口的进程：`netstat -ano | findstr :5267`
   - 终止占用端口的进程：`taskkill /PID <进程ID> /F`
