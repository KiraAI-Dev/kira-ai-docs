# Linux部署

本指南将帮助您在Linux系统上部署KiraAI。

## 环境要求
- Python 3.10+（推荐3.10-3.12）
- 网络连接

## 安装步骤

### 1. 安装依赖项

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install python3 python3-pip python3-venv git -y

# CentOS/RHEL
sudo yum update -y
sudo yum install python3 python3-pip python3-venv git -y
```

### 2. 下载KiraAI

```bash
git clone https://github.com/KiraAI-Dev/KiraAI.git
cd KiraAI
```

### 4. 启动服务

方式一：使用脚本启动（推荐）

```bash
chmod +x scripts/run.sh
./scripts/run.sh
```

方式二：直接启动

```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

python main.py
```

## 访问KiraAI

部署完成后，您可以通过以下地址访问KiraAI的Web管理界面：
`http://localhost:5267`
如果是远程访问，将localhost替换为服务器IP地址。

## 注意事项

- 确保防火墙允许5267端口（或您配置的其他端口）
- 建议使用进程管理工具（如systemd）来管理服务
- 定期更新项目代码以获取最新功能和安全修复

## 故障排查

- 检查Python版本是否符合要求：`python3 --version`
- 确保虚拟环境已正确激活：`which python`
- 查看项目日志以定位错误
- 检查端口是否被占用：`sudo lsof -i :5267`
