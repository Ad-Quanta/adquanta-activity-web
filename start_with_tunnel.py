#!/usr/bin/env python3
"""
启动 Web 服务并显示访问方式
"""
import subprocess
import socket
import sys
import time
import threading

def get_local_ip():
    """获取本机局域网 IP"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def print_access_info(port=8080):
    """打印访问信息"""
    local_ip = get_local_ip()
    
    print("\n" + "=" * 70)
    print("✅ Web 服务已启动！")
    print("=" * 70)
    print("\n📱 手机访问方式：")
    print("\n【方式 1】同一 WiFi 网络（推荐，最简单）")
    print(f"   在手机浏览器访问：")
    print(f"   http://{local_ip}:{port}/index.html")
    print(f"   http://{local_ip}:{port}/activity-center.html")
    print(f"\n   示例 URL：")
    print(f"   http://{local_ip}:{port}/index.html?activityId=act_202512&code=abc123&channelTag=weibo")
    
    print("\n【方式 2】内网穿透（跨网络访问）")
    print("   如果需要从外网访问，请在新终端运行：")
    print("   ./tunnel_localhost.sh")
    print("   或")
    print("   ./tunnel_serveo.sh")
    
    print("\n" + "=" * 70)
    print(f"💻 本地访问：http://localhost:{port}")
    print("=" * 70)
    print("\n按 Ctrl+C 停止服务\n")

def start_flask_app(port=8080):
    """启动 Flask 应用"""
    try:
        from app import app
        app.run(host='0.0.0.0', port=port, debug=False)
    except KeyboardInterrupt:
        print("\n\n服务已停止")
    except Exception as e:
        print(f"启动失败：{e}")
        sys.exit(1)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    
    # 打印访问信息
    print_access_info(port)
    
    # 启动 Flask 应用
    start_flask_app(port)
