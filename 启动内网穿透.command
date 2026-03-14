#!/bin/bash
# macOS 双击运行的脚本，启动内网穿透

cd "$(dirname "$0")"

# 打开新的终端窗口并运行内网穿透
osascript <<EOF
tell application "Terminal"
    do script "cd '$(pwd)' && echo '============================================================' && echo '🚀 启动内网穿透服务' && echo '============================================================' && echo '' && echo '✅ 本地服务器: http://localhost:8080' && echo '🌐 正在连接 localhost.run...' && echo '' && echo '💡 提示：' && echo '   - 等待几秒钟，会显示公网访问地址（格式：https://xxxxx.lhr.life）' && echo '   - 在手机上访问该地址即可（任何网络）' && echo '   - 按 Ctrl+C 停止服务' && echo '' && echo '============================================================' && echo '' && ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:8080 ssh.localhost.run"
    activate
end tell
EOF
