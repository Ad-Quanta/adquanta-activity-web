#!/bin/bash
# 使用 serveo.net 进行内网穿透（更稳定）

cd "$(dirname "$0")"

osascript <<EOF
tell application "Terminal"
    do script "cd '$(pwd)' && echo '============================================================' && echo '🚀 启动内网穿透服务（serveo.net）' && echo '============================================================' && echo '' && echo '✅ 本地服务器: http://localhost:8080' && echo '🌐 正在连接 serveo.net...' && echo '' && echo '💡 提示：' && echo '   - 等待几秒钟，会显示公网访问地址（格式：https://xxxxx.serveo.net）' && echo '   - 在手机上访问该地址即可（任何网络）' && echo '   - 按 Ctrl+C 停止服务' && echo '' && echo '============================================================' && echo '' && ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -R 80:localhost:8080 serveo.net"
    activate
end tell
EOF
