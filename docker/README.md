# Docker 部署指南

本文档提供若依项目的一键 Docker 部署方案，适合对服务器配置不熟悉的用户。

---

## 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细步骤](#详细步骤)
- [常用命令](#常用命令)
- [配置修改](#配置修改)
- [常见问题](#常见问题)

---

## 前置要求

### 服务器要求

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2核 | 4核 |
| 内存 | 4GB | 8GB |
| 磁盘 | 50GB | 100GB |
| 系统 | Ubuntu 20.04+ | Ubuntu 22.04 |

### 需要安装的软件

只需要安装 **Docker** 和 **Docker Compose**，其他所有依赖都在容器内运行。

---

## 快速开始

### 第一步：安装 Docker

在服务器上执行以下命令：

```bash
# 更新软件包索引
sudo apt update

# 安装 Docker
curl -fsSL https://get.docker.com | bash

# 将当前用户添加到 docker 组（免 sudo 执行 docker 命令）
sudo usermod -aG docker $USER

# 重新登录服务器使权限生效
exit
# 重新 SSH 连接

# 验证安装
docker --version
docker compose version
```

### 第二步：上传项目到服务器

**方式一：使用 Git（推荐）**

```bash
# 在服务器上克隆项目
git clone <你的仓库地址> /opt/ruoyi-react
cd /opt/ruoyi-react/docker
```

**方式二：使用 XFTP 上传**

1. 在本地打包项目：
   ```bash
   # 排除 node_modules 和 target 等大文件夹
   # 只需要上传源代码
   ```

2. 使用 XFTP 上传到服务器 `/opt/ruoyi-react` 目录

### 第三步：配置环境变量

```bash
cd /opt/ruoyi-react/docker

# 复制环境变量模板
cp .env.example .env

# 编辑配置（修改数据库密码等）
vim .env
```

### 第四步：一键部署

```bash
# 赋予脚本执行权限
chmod +x deploy.sh

# 一键启动所有服务
bash deploy.sh start
```

**等待 5-10 分钟**（首次需要下载镜像和编译代码），完成后访问：

- **前端：** http://124.223.83.128
- **后端 API：** http://124.223.83.128:8080
- **Druid 监控：** http://124.223.83.128:8080/druid（用户名: ruoyi，密码: 123456）

---

## 详细步骤

### 1. 安装 Docker（详细版）

```bash
# 1. 更新软件包
sudo apt update && sudo apt upgrade -y

# 2. 安装依赖
sudo apt install -y curl wget git

# 3. 安装 Docker（官方脚本，自动适配系统）
curl -fsSL https://get.docker.com | bash

# 4. 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 5. 添加当前用户到 docker 组
sudo usermod -aG docker $USER

# 6. 重新登录服务器
exit
# 重新 SSH 连接

# 7. 验证安装
docker --version
docker compose version

# 8. 测试 Docker
docker run hello-world
```

### 2. 上传项目

**方式一：Git 克隆（推荐）**

```bash
# 安装 Git
sudo apt install -y git

# 克隆项目
git clone <你的仓库地址> /opt/ruoyi-react
```

**方式二：XFTP 上传**

1. 在本地创建压缩包（排除不需要的文件）：
   ```bash
   # 在本地项目目录执行
   # Linux/Mac
   tar --exclude='node_modules' \
       --exclude='target' \
       --exclude='.git' \
       -czvf ruoyi-react.tar.gz .

   # Windows (PowerShell)
   Compress-Archive -Path * -DestinationPath ruoyi-react.zip -Force
   ```

2. 使用 XFTP 上传到服务器 `/opt/` 目录

3. 在服务器解压：
   ```bash
   cd /opt
   tar -xzvf ruoyi-react.tar.gz -C ruoyi-react
   # 或
   unzip ruoyi-react.zip -d ruoyi-react
   ```

### 3. 配置环境变量

```bash
cd /opt/ruoyi-react/docker

# 复制模板
cp .env.example .env

# 编辑配置
vim .env
```

**`.env` 文件内容：**

```bash
# MySQL root 密码（建议修改）
MYSQL_ROOT_PASSWORD=your_secure_password

# Anthropic API 配置
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_BASE_URL=https://maas-coding-api.cn-huabei-1.xf-yun.com/v2
ANTHROPIC_MODEL=astron-code-latest
```

### 4. 启动服务

```bash
# 进入 docker 目录
cd /opt/ruoyi-react/docker

# 赋予脚本执行权限
chmod +x deploy.sh

# 启动所有服务
bash deploy.sh start
```

**首次启动过程（约 5-10 分钟）：**

```
[INFO] 正在启动服务...
[INFO] Docker 环境检查通过
[SUCCESS] 服务启动完成

服务状态:
NAME                STATUS              PORTS
ruoyi-mysql         running             0.0.0.0:3306->3306/tcp
ruoyi-redis         running             0.0.0.0:6379->6379/tcp
ruoyi-java          running             0.0.0.0:8080->8080/tcp
ruoyi-copilotkit    running             0.0.0.0:4000->4000/tcp
ruoyi-frontend      running             0.0.0.0:80->80/tcp

访问地址:
  前端:        http://124.223.83.128
  后端 API:    http://124.223.83.128:8080
  Druid 监控:  http://124.223.83.128:8080/druid
  CopilotKit:  http://124.223.83.128:4000/health
```

---

## 常用命令

### 服务管理

```bash
# 启动所有服务
bash deploy.sh start

# 停止所有服务
bash deploy.sh stop

# 重启所有服务
bash deploy.sh restart

# 查看服务状态
bash deploy.sh status

# 清理无用镜像
bash deploy.sh clean
```

### 查看日志

```bash
# 查看所有服务日志
bash deploy.sh logs

# 查看特定服务日志
bash deploy.sh logs java-backend
bash deploy.sh logs mysql
bash deploy.sh logs copilotkit-backend

# 使用 docker-compose 命令
docker-compose logs -f --tail=100 java-backend
```

### 重新构建

```bash
# 修改代码后重新构建
bash deploy.sh build

# 重新启动
bash deploy.sh restart

# 完全重新构建（不使用缓存）
bash deploy.sh rebuild
```

### Docker 原生命令

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 进入容器内部
docker exec -it ruoyi-java /bin/bash
docker exec -it ruoyi-mysql /bin/bash

# 查看容器日志
docker logs -f ruoyi-java --tail 100

# 重启单个容器
docker restart ruoyi-java

# 查看容器资源使用
docker stats
```

---

## 配置修改

### 修改数据库密码

1. 修改 `.env` 文件：
   ```bash
   vim /opt/ruoyi-react/docker/.env
   # 修改 MYSQL_ROOT_PASSWORD
   ```

2. 重启服务：
   ```bash
   bash deploy.sh stop
   bash deploy.sh start
   ```

### 修改 API Key

1. 修改 `.env` 文件：
   ```bash
   vim /opt/ruoyi-react/docker/.env
   # 修改 ANTHROPIC_API_KEY
   ```

2. 重启 CopilotKit 服务：
   ```bash
   docker restart ruoyi-copilotkit
   ```

### 修改 Java 后端配置

Java 后端配置通过环境变量注入，在 `docker-compose.yml` 中修改：

```yaml
java-backend:
  environment:
    SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/ry-vue...
    SPRING_DATASOURCE_USERNAME: root
    SPRING_DATASOURCE_PASSWORD: ${MYSQL_ROOT_PASSWORD:-ruoyi123}
```

### 修改 Nginx 配置

修改 `docker/nginx.conf` 文件后重新构建：

```bash
# 修改配置
vim /opt/ruoyi-react/docker/nginx.conf

# 重新构建前端
bash deploy.sh build
bash deploy.sh restart
```

---

## 数据持久化

Docker 容器删除后，数据会保留在数据卷中：

```bash
# 查看数据卷
docker volume ls

# 查看数据卷详情
docker volume inspect ruoyi-react_mysql_data

# 数据卷位置
# mysql_data   -> MySQL 数据库文件
# redis_data   -> Redis 持久化文件
# upload_data  -> 上传的文件
```

### 备份数据

```bash
# 备份 MySQL 数据库
docker exec ruoyi-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} ry-vue > backup.sql

# 备份上传文件
docker cp ruoyi-java:/home/ruoyi/uploadPath ./upload_backup
```

### 恢复数据

```bash
# 恢复 MySQL 数据库
docker exec -i ruoyi-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ry-vue < backup.sql

# 恢复上传文件
docker cp ./upload_backup ruoyi-java:/home/ruoyi/uploadPath
```

---

## 常见问题

### 1. 端口被占用

**错误信息：**
```
Error: bind: address already in use
```

**解决方案：**
```bash
# 查看端口占用
sudo lsof -i :80
sudo lsof -i :8080

# 停止占用端口的进程
sudo kill -9 <PID>

# 或者修改 docker-compose.yml 中的端口映射
```

### 2. 内存不足

**错误信息：**
```
Error: Java heap space
```

**解决方案：**

修改 `docker-compose.yml` 中 Java 服务的内存限制：
```yaml
java-backend:
  environment:
    JAVA_OPTS: -Xms128m -Xmx256m  # 降低内存使用
```

### 3. MySQL 连接失败

**错误信息：**
```
Communications link failure
```

**解决方案：**
```bash
# 检查 MySQL 是否启动
docker ps | grep mysql

# 查看 MySQL 日志
docker logs ruoyi-mysql

# 重启 MySQL
docker restart ruoyi-mysql
```

### 4. 前端页面空白

**解决方案：**
```bash
# 检查前端容器日志
docker logs ruoyi-frontend

# 检查 Nginx 配置
docker exec ruoyi-frontend cat /etc/nginx/conf.d/app.conf

# 重新构建前端
bash deploy.sh build
```

### 5. CopilotKit 连接失败

**解决方案：**
```bash
# 检查 CopilotKit 服务状态
docker logs ruoyi-copilotkit

# 测试 CopilotKit 端点
curl http://localhost:4000/health

# 检查 API Key 配置
docker exec ruoyi-copilotkit env | grep ANTHROPIC
```

### 6. 无法访问服务器

**检查防火墙：**
```bash
# 查看防火墙状态
sudo ufw status

# 开放端口
sudo ufw allow 80
sudo ufw allow 8080
sudo ufw allow 443
```

**检查云服务商安全组：**

确保在云服务器控制台的「安全组」中开放以下端口：
- 80 (HTTP)
- 443 (HTTPS)
- 8080 (后端 API，可选)

---

## 架构图

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                      Docker 容器网络                         │
                    │                                                             │
用户浏览器 ────────>│   ruoyi-frontend (Nginx:80)                                │
                    │       │                                                     │
                    │       ├── /              ──> 静态文件                       │
                    │       ├── /api/          ──> ruoyi-java:8080               │
                    │       └── /copilotkit/  ──> ruoyi-copilotkit:4000          │
                    │                                                             │
                    │   ┌─────────────────────────────────────────────────────┐   │
                    │   │                                                     │   │
                    │   │   ruoyi-java (Spring Boot:8080)                     │   │
                    │   │       ├── 连接 MySQL                                │   │
                    │   │       └── 连接 Redis                                │   │
                    │   │                                                     │   │
                    │   │   ruoyi-copilotkit (Node.js:4000)                   │   │
                    │   │       └── 调用 Anthropic API                        │   │
                    │   │                                                     │   │
                    │   │   ruoyi-mysql (MySQL:3306)                          │   │
                    │   │       └── 数据持久化: mysql_data                    │   │
                    │   │                                                     │   │
                    │   │   ruoyi-redis (Redis:6379)                          │   │
                    │   │       └── 数据持久化: redis_data                    │   │
                    │   │                                                     │   │
                    │   └─────────────────────────────────────────────────────┘   │
                    │                                                             │
                    └─────────────────────────────────────────────────────────────┘
```

---

## 更新部署

当代码更新后，执行以下步骤：

```bash
# 1. 进入项目目录
cd /opt/ruoyi-react

# 2. 拉取最新代码（如果使用 Git）
git pull

# 3. 重新构建并启动
cd docker
bash deploy.sh build
bash deploy.sh restart
```

---

## 完全卸载

```bash
# 停止并删除所有容器
cd /opt/ruoyi-react/docker
docker-compose down -v

# 删除项目目录
rm -rf /opt/ruoyi-react

# 删除 Docker 镜像
docker rmi $(docker images 'ruoyi*' -q)

# 卸载 Docker（可选）
sudo apt remove docker docker-compose
sudo apt autoremove
```
