#!/usr/bin/env python3
"""
内网穿透脚本 - 使用 pyngrok 将本地服务暴露到公网
"""
from pyngrok import ngrok
import time
import sys

def start_tunnel(port=8080):
    """启动内网穿透"""
    print("=" * 60)
    print("正在启动内网穿透...")
    print("=" * 60)
    
    try:
        # 创建 HTTP 隧道
        public_url = ngrok.connect(port, "http")
        
        print(f"✅ 内网穿透成功！")
        print("=" * 60)
        print(f"🌐 公网访问地址：{public_url}")
        print(f"📱 手机访问地址：{public_url}")
        print("=" * 60)
        print(f"本地服务地址：http://localhost:{port}")
        print("=" * 60)
        print("\n提示：")
        print("  - 在手机上打开浏览器，访问上面的公网地址即可")
        print("  - 按 Ctrl+C 停止服务")
        print("=" * 60)
        
        # 保持运行
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n正在关闭隧道...")
            ngrok.kill()
            print("✅ 隧道已关闭")
            
    except Exception as e:
        print(f"❌ 启动失败：{e}")
        print("\n提示：如果遇到 authtoken 错误，请访问 https://dashboard.ngrok.com/get-started/your-authtoken")
        print("获取 authtoken 后运行：ngrok config add-authtoken YOUR_TOKEN")
        sys.exit(1)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    start_tunnel(port)
