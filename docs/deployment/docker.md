# Docker Deployment

Docker is a convenient way to deploy KiraAI and is recommended for production environments.

## Environment Requirements

- Docker >= 20.10.0
- Docker Compose >= 2.0.0

## Quick Deployment

### 1. Create Deployment Directory

```bash
mkdir KiraAI && cd KiraAI
```

### 2. Method 1: Start with Docker Command

```bash
docker run -d \
  --name KiraAI \
  -p 5267:5267 \
  -v ./data:/app/data \
  --restart unless-stopped \
  xxynet/kira-ai:latest
```

### 3. Method 2: Get docker-compose.yml File

```bash
curl -O https://raw.githubusercontent.com/KiraAI-Dev/KiraAI/refs/heads/main/docker-compose.yml
```

Or using PowerShell:

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/KiraAI-Dev/KiraAI/refs/heads/main/docker-compose.yml -OutFile docker-compose.yml
```

Start the service:

```bash
docker-compose up -d
```

### 4. Access the Service

After the container starts, access it through the browser:
<a href="http://localhost:5267" target="_blank" rel="noreferrer">http://localhost:5267</a>

### 5. View Logs

```bash
docker-compose logs -f
```

## docker-compose.yml Configuration Description

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

- **image**: Use the official latest image `xxynet/kira-ai:latest`
- **container_name**: Set the container name to `KiraAI`
- **ports**: Port mapping, map container port 5267 to host port 5267
- **volumes**: Volume mount, mount the host's `./data` directory to the container's `/app/data` directory for persistent data
- **restart**: Set the restart policy to `unless-stopped`, which means the container will restart after normal exit and not restart in other cases

## Custom Configuration

### Modify Port Mapping

If you need to use a different port, you can modify the port mapping in the `docker-compose.yml` file:

```yaml
ports:
  - "8000:5267"  # Map host port 8000 to container port 5267
```

### Custom Data Directory

If you need to use a different data directory, you can modify the volume mount:

```yaml
volumes:
  - /path/to/your/data:/app/data  # Use a custom data directory path
```

## Stop and Delete Service

```bash
docker-compose down
```

If you need to delete all data volumes, you can use:

```bash
docker-compose down -v
```

## Update Service

When a new version is released, you can use the following command to update the service:

```bash
docker-compose pull
docker-compose up -d
```

## Notes

- Ensure the Docker daemon is running
- Adjust port mapping and volume mounting as needed
- Regularly update Docker images to get the latest features and security fixes

## Troubleshooting

- Check if the Docker service is running
- View container logs to locate errors: `docker logs KiraAI`
- Ensure the port is not occupied by other services: `netstat -tulpn | grep 5267` (Linux) or `netstat -ano | findstr :5267` (Windows)
- Check if volume mounting permissions are correct
- Check read/write permissions of the data directory
- View detailed container information: `docker inspect KiraAI`
