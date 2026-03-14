# H5 活动页 Demo（可直接在浏览器打开）

这个目录是一个**自包含**的 H5 活动页示例，用来演示：

- “AI 生成的页面”本质是 **HTML + JS + CSS**
- 页面加载后执行 JS，通过 `ActivityRuntimeSDK` 完成：
  - 初始化（读取 URL 里的 `code/token`，换取 `sessionContext`）
  - 事件上报（本地 mock）
  - 抽奖（本地 mock，模拟调用 Rust 抽奖引擎的结果）
  - 领奖（本地 mock，模拟发奖任务状态机）

## 页面列表

### 1. 活动首页 (`index.html`)

活动首页，展示用户的积分和快速导航到各个活动页面。

### 2. 活动中心页面 (`activity-center.html`)

完整的活动中心页面，包含：

- **我的资产区域**：显示用户的积分，支持积分兑换功能
- **任务列表**：
  - 看广告赚积分：观看完整广告后可领取积分奖励
  - 签到：每日签到功能

**核心功能**：
- App 跳转时通过 URL 参数传递用户信息（`code`/`token`）
- 页面加载后自动调用后端接口获取用户资产和任务数据
- 广告观看功能：点击”去完成”按钮后播放广告（模拟），观看完成后才能领取积分
- 实时更新资产和任务状态

### 3. 积分兑换页面 (`points-exchange.html`)

积分兑换页面，用户可以用积分兑换商品。

**核心功能**：
- 展示用户当前的积分
- 显示可兑换的商品列表
- 支持积分兑换商品功能（模拟）

## 使用方法

### 1. 直接打开（最简单）

双击打开对应的 HTML 文件即可使用。

建议加上 URL 参数来模拟 App 透传信息：

- `activityId`：活动 ID
- `code`：一次性 code（示例用）
- `token`：短期 token（示例用）
- `channelTag`：渠道标识（示例用）

**活动首页示例**：

- `index.html?activityId=activity_home_202512&code=abc123&channelTag=app`

**活动中心页面示例**：

- `activity-center.html?activityId=activity_center_202512&code=abc123&channelTag=app`

**积分兑换页面示例**：

- `points-exchange.html?activityId=points_exchange_202512&code=abc123&channelTag=app`

### 2. 用本地静态服务器打开（更接近线上）

在该目录下运行（任选一种）：

```bash
python3 -m http.server 5173
```

然后访问：

- 活动首页：`http://127.0.0.1:5173/index.html?activityId=activity_home_202512&code=abc123&channelTag=app`
- 活动中心：`http://127.0.0.1:5173/activity-center.html?activityId=activity_center_202512&code=abc123&channelTag=app`
- 积分兑换：`http://127.0.0.1:5173/points-exchange.html?activityId=points_exchange_202512&code=abc123&channelTag=app`

## 活动中心页面使用说明

### 广告观看流程

1. 点击"看广告赚积分"任务中的"去完成"按钮
2. 弹出广告播放界面，显示播放进度
3. 等待广告播放完成（约 5 秒，模拟）
4. 播放完成后，按钮变为"领取"状态（黄色高亮）
5. 点击"领取"按钮即可获得积分奖励

### 注意事项

- 广告未播放完成时关闭，无法领取奖励
- 广告播放完成后，按钮会自动变为可领取状态
- 所有数据目前为本地 mock，实际使用时需要对接真实后端接口

---

## App 使用活动平台服务（内网穿透）

目标是让 App 通过**活动平台服务**打开 H5 活动页，而不是在 App 里写死本机 IP。流程如下：

1. **启动活动平台服务并做内网穿透**（在本目录执行）：
   ```bash
   ./start_all.sh
   ```
   脚本会先起本地静态服务（端口 8080），再起内网穿透（如 localhost.run），终端里会打印**公网访问地址**（如 `https://xxxx.lhr.life`）。

2. **把“最终域名”填到 App**：
   - 打开工程 `dafit-android`，在 `module-classes` 的 `ClassesFragment.java` 中找到 `activityPlatformBaseUrl`。
   - 将 `https://YOUR_ACTIVITY_PLATFORM_URL` 替换为内网穿透得到的**根地址**（含 `https://`，不含路径），例如：
     - `https://xxxx.lhr.life`（localhost.run）
     - 或你使用的其他 tunnel / 正式环境域名。
   - 保存后重新编译运行 App，在课程里点击「最近完成」即可通过该活动平台 URL 打开 H5 页。

3. **说明**：
   - App 只使用这一个“活动平台服务”的根 URL，路径和参数由 App 拼好（如 `/welfare-center.html?activityId=...`）。
   - 正式环境时，把同一处改为线上活动平台域名即可，无需改其他逻辑。


