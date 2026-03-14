#!/bin/bash
# 启动内网穿透服务，让手机可以访问本地 HTML 页面

echo "============================================================"
echo "🚀 启动内网穿透服务"
echo "============================================================"
echo ""

# 检查本地服务器是否运行
if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "⚠️  本地服务器 (localhost:8080) 未运行，正在启动..."
    cd "$(dirname "$0")"
    nohup python3 -m http.server 8080 > /tmp/http_server.log 2>&1 &
    sleep 2
    echo "✅ 本地服务器已启动"
    echo ""
fi

echo "📱 选择内网穿透方式："
echo ""
echo "【方式 1】localhost.run (推荐，稳定)"
echo "   地址格式：https://xxxxx.lhr.life"
echo ""
echo "【方式 2】serveo.net (备选)"
echo "   地址格式：https://xxxxx.serveo.net"
echo ""
echo "============================================================"
echo ""

# 使用 localhost.run 创建隧道
echo "正在启动 localhost.run 内网穿透..."
echo "请等待几秒钟，会显示公网访问地址..."
echo ""
echo "提示："
echo "  - 分配的公网地址会在下方显示"
echo "  - 在手机上访问该地址即可"
echo "  - 按 Ctrl+C 停止服务"
echo ""
echo "============================================================"
echo ""

ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 ssh.localhost.run
