#!/usr/bin/env python3
"""
H5 活动页面静态文件服务器
提供 index.html、activity-center.html 等静态文件服务
"""
from flask import Flask, send_from_directory, request, Response
import os
import urllib.request
import urllib.error

app = Flask(__name__)

# 获取当前目录作为静态文件根目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://10.0.33.63:8080").rstrip("/")

@app.route("/api/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def proxy_api(path):
    """
    反向代理：让前端从同源（web 的 8848）调用后端 API，避免浏览器 CORS 拦截。
    """
    if request.method == "OPTIONS":
        # 预检请求兜底（同源场景通常不会触发，但保持健壮）
        resp = Response(status=204)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"
        return resp

    target_url = f"{BACKEND_BASE_URL}/api/{path}"
    qs = request.query_string.decode("utf-8") if request.query_string else ""
    if qs:
        target_url = f"{target_url}?{qs}"

    # 过滤掉可能导致代理失败的跳转头
    hop_by_hop = {"host", "connection", "content-length", "transfer-encoding"}
    headers = {}
    for k, v in request.headers.items():
        if k.lower() in hop_by_hop:
            continue
        headers[k] = v

    body = request.get_data() or None
    req = urllib.request.Request(
        target_url,
        data=body,
        headers=headers,
        method=request.method,
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as upstream_resp:
            resp_body = upstream_resp.read()
            # 直接透传状态码与内容类型
            content_type = upstream_resp.headers.get("Content-Type", "application/octet-stream")
            resp = Response(resp_body, status=upstream_resp.status, content_type=content_type)
    except urllib.error.HTTPError as e:
        resp_body = e.read() if hasattr(e, "read") else b""
        content_type = e.headers.get("Content-Type", "application/octet-stream") if e.headers else "application/octet-stream"
        resp = Response(resp_body, status=e.code, content_type=content_type)
    except Exception:
        resp = Response(b"Proxy error", status=502, content_type="text/plain")

    # 即使同源场景通常不需要 CORS，这里仍补上，避免不同访问方式导致的问题
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"
    return resp

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
    
    # 运行在本地，端口 8848
    app.run(host='0.0.0.0', port=8848, debug=True)
