## CDN 部署文件清单（前端需提供给后端）

将下列文件和目录按原有层级上传到 CDN 源站（保持路径不变），即可在 CDN 上运行当前 H5 工程。

### 入口页面 HTML

- `index.html`
- `activity-center.html`
- `gold-coins-exchange.html`

### 业务脚本 JS

- `activity-center-ui.js`
- `activity-center-adapter.js`
- `activity-center-business.js`
- `activity-api.js`
- `gold-coins-exchange.js`
- `ActivityBridgeHelper.js`
- `activity-logger.js`

> 说明：以上 JS 都是通过页面入口直接或间接引用的逻辑代码，需一并上传。

### 样式文件 CSS

- `activity-center.css`
- `gold-coins-exchange.css`

### 静态资源

- `icons/database.svg`
- `icons/home.svg`
- `icons/card_giftcard.svg`
- `icons/stars.svg`
- `icons/play_circle.svg`
- `icons/fitness_center.svg`
- `icons/task_alt.svg`
- `icons/verified.svg`
- `icons/phone_iphone.svg`
- `icons/play_arrow.svg`
- `icons/watch.svg`
- `icons/person.svg`
- `icons/check.svg`
- `icons/calendar_today.svg`

### 不需要上传到 CDN / 后端的内容

以下内容只用于本地开发或文档说明，不需要给后端部署到 CDN：

- `.venv/` 虚拟环境目录
- `app.py` 本地 Flask 开发服务器
- `.git/` 版本控制目录
- `原型图/`、`*.md` 文档（如 `README.md`、`ARCHITECTURE.md`、`迁移指南.md` 等）
- 任何 IDE / 编辑器配置（如 `.vscode/`、`.cursor/` 等，如果存在）

### 部署约定

- CDN 域名形如：`https://<your-cdn-domain>/`
  - 活动首页：`https://<your-cdn-domain>/index.html`
  - 活动中心：`https://<your-cdn-domain>/activity-center.html`
  - 金币兑换：`https://<your-cdn-domain>/gold-coins-exchange.html`
- 后端 API 域名通过 URL 中的 `apiBaseUrl` 参数或前端默认配置传入，后端需要确保该域名支持跨域访问（CORS）以允许 H5 页面调用。

