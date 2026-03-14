#!/bin/bash
# 使用 localhost.run 进行内网穿透（无需安装，使用 SSH）

echo "============================================================"
echo "正在启动 localhost.run 内网穿透..."
echo "============================================================"
echo ""
echo "提示："
echo "  - localhost.run 会为您分配一个公网地址"
echo "  - 地址格式类似：https://xxxxx.lhr.life"
echo "  - 在手机上访问该地址即可"
echo "  - 按 Ctrl+C 停止"
echo ""
echo "============================================================"
echo ""

# 使用 localhost.run 创建隧道
ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 ssh.localhost.run
