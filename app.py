#!/usr/bin/env python3
"""
H5 活动页面静态文件服务器
提供 index.html、activity-center.html 等静态文件服务
"""
from flask import Flask, send_from_directory
import os

app = Flask(__name__)

# 获取当前目录作为静态文件根目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route('/')
@app.route('/index.html')
def index():
    """提供首页"""
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """提供静态文件服务"""
    # 安全处理：只允许访问当前目录下的文件
    if '..' in filename or filename.startswith('/'):
        return "Forbidden", 403
    
    # 检查文件是否存在
    file_path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        return "File not found", 404
    
    # 发送文件
    return send_from_directory(BASE_DIR, filename)

if __name__ == '__main__':
    print("=" * 60)
    print("H5 活动页面服务器启动中...")
    print("=" * 60)
    print(f"访问地址：http://localhost:8848")
    print(f"首页：http://localhost:8848/index.html")
    print(f"活动中心：http://localhost:8848/activity-center.html")
    print("=" * 60)
    print("示例 URL（带参数）：")
    print("  http://localhost:8848/index.html?activityId=act_202512&code=abc123&channelTag=weibo")
    print("  http://localhost:8848/activity-center.html?activityId=activity_center_202512&code=abc123&channelTag=app")
    print("=" * 60)
    
    # 运行在本地，端口 8848
    app.run(host='0.0.0.0', port=8848, debug=True)
