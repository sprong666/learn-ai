---
title: OpenCode Docker 部署
description: 容器化部署 OpenCode
sidebar_position: 5
---

# OpenCode Docker 部署

# 服务器部署

## Dockerfile
```dockerfile
FROM ghcr.io/anomalyco/opencode:latest

RUN echo "https://packages.adoptium.net/artifactory/alpine/3.23/$(uname -m)" >> /etc/apk/repositories

RUN apk add --no-cache \
    bash \
    git \
    curl \
    python3 \
    py3-pip \
    vim \
    openjdk21 \
    maven \
    nodejs \
    npm
RUN npm install -g bun

ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk

ENTRYPOINT ["/bin/bash"]

```

* docker-compose.yml
```yaml
version: '3.8'

services:
  opencode:
    container_name: opencode-dev
    image: my-opencode
    stdin_open: true
    tty: true
    ports:
      - "30082:4096"
    volumes:
      - ./workspace:/workspace
      - .config/opencode:/root/.config/opencode
      - .local/share/opencode:/root/.local/share/opencode
```

* 其它操作
```bash
# 进入容器
docker exec -it opencode-dev bash

# 启动 web
opencode web --hostname 0.0.0.0 --port 4096
```

* opencode web 后台启动
```
npm install -g pm2
pm2 start opencode --name "opencode-web" -- web --hostname 0.0.0.0
```