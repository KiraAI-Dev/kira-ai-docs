# Docker 部署

Docker是部署KiraAI的便捷方式，推荐在生产环境使用。

## 环境要求

- Docker >= 20.10.0
- Docker Compose >= 2.0.0

## 快速部署

### 1. 创建部署目录

```bash
mkdir KiraAI && cd KiraAI
```

### 2. 方式一：Docker 命令启动

```bash
docker run -d \
  --name KiraAI \
  -p 5267:5267 \
  -v ./data:/app/data \
  --restart unless-stopped \
  xxynet/kira-ai:latest
```

### 2. 方式二：获取docker-compose.yml文件

```bash
curl -O https://raw.githubusercontent.com/KiraAI-Dev/KiraAI/refs/heads/main/docker-compose.yml
```

或者使用PowerShell：

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/KiraAI-Dev/KiraAI/refs/heads/main/docker-compose.yml -OutFile docker-compose.yml
```

启动服务：

```bash
docker-compose up -d
```

### 3. 访问服务

容器启动后，通过浏览器访问：
<a href="http://localhost:5267" target="_blank" rel="noreferrer">http://localhost:5267</a>

### 4. 查看日志

```bash
docker-compose logs -f
```

## docker-compose.yml 配置说明

```yaml
version: '3.8'

services:
  app:
    image: xxynet/kira-ai:latest
    container_name: KiraAI      
    ports:
      - "5267:5267"
    volumes:
      - ./data:/app/data        
    restart: unless-stopped
```

- **image**: 使用官方最新镜像 `xxynet/kira-ai:latest`
- **container_name**: 容器名称设为 `KiraAI`
- **ports**: 端口映射，将容器的5267端口映射到主机的5267端口
- **volumes**: 卷挂载，将主机的 `./data` 目录挂载到容器的 `/app/data` 目录，用于持久化数据
- **restart**: 重启策略设为 `unless-stopped`，容器在正常退出后重启，其他情况不重启

## 自定义配置

### 修改端口映射

如果需要使用不同的端口，可以修改 `docker-compose.yml` 文件中的端口映射：

```yaml
ports:
  - "8000:5267"  # 将主机的8000端口映射到容器的5267端口
```

### 自定义数据目录

如果需要使用不同的数据目录，可以修改卷挂载：

```yaml
volumes:
  - /path/to/your/data:/app/data  # 使用自定义的数据目录路径
```

## 停止和删除服务

```bash
docker-compose down
```

如果需要删除所有数据卷，可以使用：

```bash
docker-compose down -v
```

## 更新服务

当有新版本发布时，可以使用以下命令更新服务：

```bash
docker-compose pull
docker-compose up -d
```

## 注意事项

- 确保Docker守护进程正在运行
- 根据需要调整端口映射和卷挂载
- 定期更新Docker镜像以获取最新功能和安全修复

## 故障排查

- 检查Docker服务是否正在运行
- 查看容器日志以定位错误：`docker logs KiraAI`
- 确保端口未被其他服务占用：`netstat -tulpn | grep 5267`（Linux）或 `netstat -ano | findstr :5267`（Windows）
- 检查卷挂载权限是否正确
- 检查数据目录的读写权限
- 查看详细的容器信息：`docker inspect KiraAI`
