#!/bin/bash
# 一键启动：本地服务器 + 内网穿透

echo "============================================================"
echo "🚀 一键启动本地服务器 + 内网穿透"
echo "============================================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 停止已有的服务器
echo "🔧 清理已有服务..."
kill $(lsof -ti:8080) 2>/dev/null || true
sleep 1

# 启动本地服务器
echo "📡 启动本地服务器 (端口 8080)..."
nohup python3 -m http.server 8080 > /tmp/http_server.log 2>&1 &
SERVER_PID=$!
sleep 2

# 检查服务器是否启动成功
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ 本地服务器启动成功"
    echo ""
    
    # 获取本地 IP
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "127.0.0.1")
    fi
    
    echo "============================================================"
    echo "💻 本地访问地址："
    echo "   http://localhost:8080/welfare-center.html"
    echo "   http://$LOCAL_IP:8080/welfare-center.html (同一 WiFi)"
    echo ""
    echo "📱 手机访问地址（同一 WiFi 网络）："
    echo "   http://$LOCAL_IP:8080/welfare-center.html?activityId=welfare_center_202512&code=abc123&channelTag=app"
    echo "============================================================"
    echo ""
    echo "🌐 正在启动内网穿透（公网访问）..."
    echo "   等待几秒钟，会显示公网访问地址..."
    echo ""
    echo "提示："
    echo "  - 公网地址会在下方显示"
    echo "  - 在手机上访问该地址即可（任何网络）"
    echo "  - 按 Ctrl+C 停止服务"
    echo ""
    echo "============================================================"
    echo ""
    
    # 启动内网穿透
    ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 ssh.localhost.run
    
    # 清理：停止本地服务器
    echo ""
    echo "正在停止本地服务器..."
    kill $SERVER_PID 2>/dev/null || true
    echo "✅ 服务已停止"
else
    echo "❌ 本地服务器启动失败，请检查端口 8080 是否被占用"
    exit 1
fi
