#!/bin/bash

# ========================================
# 若依项目 Docker 一键部署脚本
# ========================================
# 使用方法: bash deploy.sh [命令]
# 命令:
#   start   - 启动所有服务
#   stop    - 停止所有服务
#   restart - 重启所有服务
#   build   - 构建所有镜像
#   logs    - 查看日志
#   status  - 查看服务状态
#   clean   - 清理无用镜像和容器
# ========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "若依项目 Docker 部署脚本"
    echo ""
    echo "使用方法: bash deploy.sh [命令]"
    echo ""
    echo "可用命令:"
    echo "  start     启动所有服务"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  build     构建所有镜像"
    echo "  rebuild   重新构建所有镜像（不使用缓存）"
    echo "  logs      查看所有服务日志"
    echo "  status    查看服务状态"
    echo "  clean     清理无用的 Docker 镜像和容器"
    echo "  help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  bash deploy.sh start"
    echo "  bash deploy.sh logs java-backend"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    print_success "Docker 环境检查通过"
}

# 检查 .env 文件
check_env() {
    if [ ! -f ".env" ]; then
        print_warning ".env 文件不存在，正在从 .env.example 复制..."
        cp .env.example .env
        print_info "请编辑 .env 文件配置您的参数"
    fi
}

# 启动服务
start_services() {
    print_info "正在启动服务..."
    check_env
    docker-compose up -d
    print_success "服务启动完成"
    show_status
}

# 停止服务
stop_services() {
    print_info "正在停止服务..."
    docker-compose down
    print_success "服务已停止"
}

# 重启服务
restart_services() {
    print_info "正在重启服务..."
    docker-compose restart
    print_success "服务重启完成"
    show_status
}

# 构建镜像
build_images() {
    print_info "正在构建镜像..."
    check_env
    docker-compose build
    print_success "镜像构建完成"
}

# 重新构建镜像（不使用缓存）
rebuild_images() {
    print_info "正在重新构建镜像（不使用缓存）..."
    check_env
    docker-compose build --no-cache
    print_success "镜像重新构建完成"
}

# 查看日志
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        docker-compose logs -f --tail=100
    else
        docker-compose logs -f --tail=100 "$service"
    fi
}

# 查看状态
show_status() {
    echo ""
    print_info "服务状态:"
    docker-compose ps
    echo ""
    print_info "访问地址:"
    echo "  前端:        http://localhost"
    echo "  后端 API:    http://localhost:8080"
    echo "  Druid 监控:  http://localhost:8080/druid (ruoyi/123456)"
    echo "  CopilotKit:  http://localhost:4000/health"
    echo ""
}

# 清理无用镜像和容器
clean_docker() {
    print_info "正在清理无用镜像和容器..."
    docker system prune -f
    print_success "清理完成"
}

# 主逻辑
case "$1" in
    start)
        check_docker
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    build)
        check_docker
        build_images
        ;;
    rebuild)
        check_docker
        rebuild_images
        ;;
    logs)
        show_logs "$2"
        ;;
    status)
        show_status
        ;;
    clean)
        clean_docker
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            show_help
        else
            print_error "未知命令: $1"
            show_help
            exit 1
        fi
        ;;
esac
