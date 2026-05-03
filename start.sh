#!/bin/bash
# ==========================================
# Rotatepattern 全自动部署启动脚本
# 包含 Node.js 环境自动安装
# ==========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 项目目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 日志函数
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Rotatepattern 全自动部署启动${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 1. 自动安装 Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    log_warn "未检测到 Node.js，开始自动安装环境..."
    
    # 安装 NVM
    log_info "正在安装 NVM (Node Version Manager)..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash > /dev/null 2>&1
    
    # 加载 NVM 环境变量
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # 安装 Node.js LTS
    log_info "正在安装 Node.js LTS 版本..."
    nvm install --lts > /dev/null 2>&1
    nvm use --lts > /dev/null 2>&1
    
    log_info "Node.js 安装完成: $(node -v)"
else
    log_info "Node.js 环境已就绪: $(node -v)"
fi

# 确保 npm 可用
if ! command -v npm &> /dev/null; then
    log_error "npm 仍然不可用，安装可能失败"
    exit 1
fi

# 2. 进入项目目录
log_info "进入项目目录: $PROJECT_DIR"
cd "$PROJECT_DIR" || { log_error "无法进入目录"; exit 1; }

# 3. 自动安装依赖
if [ ! -d "node_modules" ]; then
    log_info "正在安装项目依赖 (npm install)..."
    npm install
else
    log_info "项目依赖已存在，跳过安装"
fi

# 4. 启动服务
echo ""
log_info "========================================"
log_info "正在启动 Rotatepattern 服务..."
log_info "========================================"
echo ""

# 智能启动策略
if [ -f "server.js" ]; then
    node server.js
elif grep -q '"start"' package.json; then
    npm start
elif grep -q '"dev"' package.json; then
    npm run dev
else
    log_error "找不到启动方式 (server.js 或 package.json 脚本)"
    exit 1
fi
