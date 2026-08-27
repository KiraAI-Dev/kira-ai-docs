# Termux部署

:::tip 社区贡献
本部署方式由社区贡献
:::

本指南将帮助您在Termux上部署KiraAI。

## 一.前置准备
### 1. 安装 Termux 
https://github.com/termux/termux-app
下载安装v0.118.3 或更高版本。
### 2. 基础环境配置 打开 Termux，执行以下命令进行初始设置。

   ```bash
   # 1. 更换软件源为国内源（选择第三项：中国大陆）
   termux-change-repo
   
   # 2. 安装 PRoot 环境
   pkg install proot-distro -y
   
   # 3. 安装 Debian 系统
   proot-distro install debian
   
   # 4. 登录 Debian 环境
   proot-distro login debian
   
   ```
### 3. 更换 Debian 软件源（有手动选择操作）

   ```bash
   bash <(curl -sSL https://linuxmirrors.cn/main.sh)
   # 需手动选择阿里云、公网、HTTPS
   # 提示是否更新软件包：选择 否 (输入 n)
   # 提示是否清理：选择 是 (输入 y)

   apt install -y sudo curl libgcrypt20
   # 安装必要的sudo、curl、libgcrypt20系统工具包
   ```
### 4.开防杀后台：
Acquire wakelock（获取唤醒锁）选无限制，
后续显示wake lock held（保持唤醒锁定状态）

### 5.退出 Debian 环境，返回 Termux 原生环境

   ```bash
   exit
   ```
### 6.在原生环境中添加快捷命令“deb”用于快捷启动 Debian 环境

   ```bash
   # 1. 添加快捷命令deb，方便下次一键进入 Debian 环境
   echo "alias deb='proot-distro login debian'" >> ~/.bashrc

   # 2. 这条用于下次启动显示，类似于备忘录（下同）
   echo "echo ' 输入 deb 或 (proot-distro login debian) 进入 Debian 环境'" >> ~/.bashrc
   source ~/.bashrc

   ```

## 二.安装 NapCat

在 Debian 环境中进行安装：

### 1. 进入 Debian 环境

```bash
deb
```
### 2. 下载安装NapCat

```bash
curl -O https://raw.githubusercontent.com/NapNeko/NapCat-Installer/refs/heads/main/script/install.sh
```
### 3. 给予权限并运行

```bash
chmod +x install.sh && ./install.sh
# 根据提示选择n "shell包安装"
# 根据提示选择n "不安装NapCat TUI-CLI"
# 建议在良好的网络环境下进行，过程中只要能跑就不代理，除非几乎不走
```

### 4. 重新加载配置

```bash
source ~/.bashrc
```

### 5. 启动 NapCat（首次启动会要求扫码登录）

```bash
xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox
```
#### 看到正常输出日志即表示启动成功
#### 详细登录配置流程请参考 NapCat 官方文档


## 三.安装 KiraAI 
### 1.确保在proot环境中，显示为“root@localhost:~#”
### 2.安装github

```bash
apt update && apt install -y git
git --version
# 1.更新列表并安装github
# 2.验证是否成功(显示 git version x.x.x 这样的信息， 就说明安装成功了）
```

### 3.选个位置放Kiraai

```bash
cd /root
```
### 4.克隆 KiraAI 仓库
```bash
git clone https://github.com/KiraAI-Dev/KiraAI.git
```
如果显示报错信息fatal:unable to access... Recv_failure: Software caused connection abort
就表示网络连接失败开梯子去吧

### 5.返回Kiraai文件
### 6.安装 pyenv 的编译依赖
```bash
apt install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev xz-utils \
tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev
```

### 7.下载 Python 源码（使用阿里云镜像）

```bash
wget https://mirrors.aliyun.com/python-release/source/Python-3.11.11.tgz
```
### 8.下载完成后，确认文件是否存在

```bash
ls -la Python-3.11.11.tgz
```

### 9.解压

```bash
tar -xzf Python-3.11.11.tgz
```

### 10.编译 python
```bash
# 1. 回到源码目录
cd /root/Python-3.11.11

# 2. 重新配置（添加 --enable-shared 参数，这很关键）
./configure --enable-optimizations --enable-shared

# 3. 编译（这一步需要耐心等待）
make -j$(nproc)

# 4. 安装
make altinstall

# 5. 安装后更新库缓存
ldconfig

# 6. 验证安装
ls -l /usr/local/bin/python3.11
/usr/local/bin/python3.11 --version
```

### 11.启动 KiraAI

```bash
# 1.进入项目目录
cd /root/KiraAI

# 2.创建并配置 Python 虚拟环境
python3.11 -m venv .venv

# 3.激活虚拟环境
source .venv/bin/activate

# 4.安装项目依赖
pip install -r requirements.txt

# 5.运行 KiraAI
cd scripts
./run.sh
```
#### 看到正常输出日志即表示启动成功

## 四.添加全局快捷启动命令
#### 为了在 Termux 原生环境中能一键启动 NapCat 和 KiraAI，可以添加以下快捷命令：

```bash
# 在 Termux 原生环境中执行

# 1. 一键启动 NapCat 的命令
echo "alias NC='proot-distro login debian -- bash -c \"xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox\"'" >> ~/.bashrc
echo "echo '输入 NC 启动 NapCat (自动进入Debian并运行NapCat)'" >> ~/.bashrc

# 2. 一键启动 KiraAI 的命令
echo "alias kira-ai='proot-distro login debian -- bash -c \"cd /root/KiraAI && source .venv/bin/activate && cd scripts && ./run.sh\"'" >> ~/.bashrc
echo "echo ' 输入 kira-ai 一键启动 KiraAI (自动进入 Debian 并激活 .venv 环境'" >> ~/.bashrc

# 3. 重新加载配置
source ~/.bashrc
```

### 日常使用

1. 启动 NapCat：在 Termux 中输入 NC 并按回车。
2. 启动 KiraAI：新建一个 Termux 会话，输入 kira-ai 并按回车。

## 访问KiraAI

部署完成后，您可以通过以下地址访问KiraAI的Web管理界面：
http://localhost:5267
如果是远程访问，将localhost替换为服务器IP地址。

## 注意事项

- 确保防火墙允许5267端口（或您配置的其他端口）
- 过程中部分有手动选择步骤请仔细阅读注释

## 故障排查

- 检查Python版本是否符合要求：`python --version`
- 确保虚拟环境已正确激活：`venv\Scripts\activate`
- 查看项目日志以定位错误
  
## 常见问题
- 如果显示报错信息fatal:unable to access... Recv_failure: Software caused connection abort
就表示网络连接失败开梯子
