# AdQuanta Activity Web

这是一个源码直出的 H5 工程，包含活动中心、金币兑换和充值结果页。

## 页面入口

- `activity-center.html`：活动中心主页面
- `gold-coins-exchange.html`：金币兑换页面
- `topup-status.html`：充值状态页
- `index.html`：仅做入口跳转，默认跳到 `activity-center.html`

## 本地开发

如果只需要查看静态页面，可以直接启动静态服务：

```bash
python3 -m http.server 5173
```

如果需要联调接口，使用项目内的 Flask 本地服务：

```bash
python3 app.py
```

默认访问地址：

- `http://127.0.0.1:8848/activity-center.html`
- `http://127.0.0.1:8848/gold-coins-exchange.html`
- `http://127.0.0.1:8848/topup-status.html`

`app.py` 会同时提供静态文件服务和 `/api/*` 反向代理，便于本地避免 CORS 问题。

## 部署说明

当前仓库保留的是可直接部署到静态存储或 CDN 的源码文件。

后续建议通过 GitHub Actions 自动发布到 OSS/CDN，不再维护手工部署目录或发布快照。

## GitHub Actions 自动部署

仓库已提供 `master` 分支自动部署工作流：

- 工作流文件：`.github/workflows/deploy-to-tos.yml`
- 上传脚本：`scripts/deploy_to_tos.py`
- 触发条件：代码 `push` 到 `master` 后自动执行

### 需要配置的 GitHub Secrets

- `TOS_ACCESS_KEY_ID`
- `TOS_SECRET_ACCESS_KEY`
- `TOS_ENDPOINT`
- `TOS_REGION`
- `TOS_BUCKET`
- `TOS_KEY_PREFIX`
- `TOS_CDN_DOMAIN`

其中典型值示例：

- `TOS_ENDPOINT`: `https://tos-s3-cn-guangzhou.volces.com`
- `TOS_REGION`: `cn-guangzhou`
- `TOS_BUCKET`: `ad-quanta`
- `TOS_KEY_PREFIX`: 可留空，或填如 `activity-web`
- `TOS_CDN_DOMAIN`: `https://ad-quanta-cdn.moyoung.com`

### 实现细节

上传脚本按火山引擎 TOS 的 S3 兼容方式实现：

- 使用 `boto3`
- 显式指定 `signature_version='s3v4'`
- 使用 `s3={'addressing_style': 'virtual'}`

默认会自动扫描仓库中的站点资源并上传，不再写死文件列表。

上传排除规则由根目录的 `.tosignore` 控制。

当前 `.tosignore` 已排除这类内容：

- `.github/`、`scripts/`、虚拟环境、构建目录
- `README.md`、`app.py`
- `*.md`、`*.py`、日志和常见临时文件

也就是说，后续你新增或删除 HTML、CSS、JS、图片、SVG 等静态资源，通常不需要再改部署脚本；如果只想调整部署范围，直接修改 `.tosignore` 即可。
