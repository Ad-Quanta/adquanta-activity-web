#!/bin/bash
# 显示内网穿透的公网地址

echo "============================================================"
echo "🌐 获取内网穿透公网地址"
echo "============================================================"
echo ""

# 尝试通过 SSH 连接获取地址
echo "正在连接 localhost.run..."
echo ""

# 使用 timeout 获取初始连接信息
timeout 8 ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:8080 ssh.localhost.run 2>&1 | tee /tmp/tunnel_output.log &
SSH_PID=$!

# 等待连接建立
sleep 5

# 从日志中提取地址
if [ -f /tmp/tunnel_output.log ]; then
    TUNNEL_URL=$(grep -o "https://[a-zA-Z0-9.-]*\.lhr\.life" /tmp/tunnel_output.log | head -1)
    
    if [ -n "$TUNNEL_URL" ]; then
        echo ""
        echo "✅ 内网穿透成功！"
        echo "============================================================"
        echo "📱 手机访问地址："
        echo "   $TUNNEL_URL"
        echo ""
        echo "福利中心页面："
        echo "   $TUNNEL_URL/welfare-center.html?activityId=welfare_center_202512&code=abc123&channelTag=app"
        echo ""
        echo "示例页面："
        echo "   $TUNNEL_URL/index.html?activityId=act_202512&code=abc123&channelTag=weibo"
        echo "============================================================"
        echo ""
        echo "💡 提示："
        echo "   - 在手机浏览器打开上述地址即可"
        echo "   - 该地址可以在任何网络环境下访问"
        echo "   - 按 Ctrl+C 停止内网穿透服务"
        echo ""
        
        # 保持连接
        wait $SSH_PID
    else
        echo "⚠️  正在建立连接，请稍候..."
        echo "   如果连接成功，地址会显示在上方"
        echo ""
        echo "手动检查方式："
        echo "   查看终端输出，寻找类似 'https://xxxxx.lhr.life' 的地址"
        wait $SSH_PID
    fi
else
    echo "❌ 无法获取连接信息"
    kill $SSH_PID 2>/dev/null
    exit 1
fi
