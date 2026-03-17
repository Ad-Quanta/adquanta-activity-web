# AdQuanta 活动平台 H5

本仓库为 **AdQuanta 活动平台** 的 H5 前端，包含活动首页、活动中心、金币兑换等页面。

- 技术栈：**HTML + JS + CSS**，通过 `ActivityBridgeHelper` 与 Native 及活动后端协作
- 页面加载后执行 JS，完成：初始化（URL 参数 `code`/`token`）、事件上报、任务与资产展示

## 页面列表

### 1. 活动首页 (`index.html`)

活动首页，展示用户积分与快速导航。

### 2. 活动中心页面 (`activity-center.html`)

活动中心仅包含两类任务：

- **签到任务**：每日签到领金币，签到成功后可选「看视频」获取额外金币
- **看视频任务**：每日观看激励视频，看完可领取金币（每日次数与奖励由后端配置）

**核心功能**：
- **我的资产**：展示当前金币，入口跳转金币兑换页
- App 通过 URL 传递 `code`/`token`；页面加载后请求后端基础信息接口获取资产与任务数据
- **激励视频**：两处展位——① 每日看视频任务（Watch Now / Claim）② 签到成功弹框内「看视频领额外金币」
- 实时更新资产与任务状态

### 3. 金币兑换页面 (`gold-coins-exchange.html`)

用户使用金币兑换话费充值等权益。

**核心功能**：
- 展示当前金币余额
- 话费面额与所需金币来自接口 `/api/v1/ops/activity/charges`
- 兑换记录来自基础信息接口 `data.records`（仅展示兑换类型）

## 使用方法

### 1. 直接打开

双击打开对应 HTML 文件即可访问。

App 透传需携带的 URL 参数：

- `activityId`：活动 ID
- `code`：一次性 code
- `token`：短期 token
- `channelTag`：渠道标识

**活动首页**：`index.html?activityId=activity_home_202512&code=abc123&channelTag=app`

**活动中心**：`activity-center.html?activityId=activity_center_202512&code=abc123&channelTag=app`

**积分兑换**：`gold-coins-exchange.html?activityId=points_exchange_202512&code=abc123&channelTag=app`

### 2. 本地服务运行

在项目目录下执行：

```bash
python3 -m http.server 5173
```

或使用项目自带的 Flask 服务（端口 8848）：

```bash
python3 app.py
# 或：.venv/bin/python app.py
```

访问：`http://localhost:8848`，首页 `/index.html`，活动中心 `/activity-center.html`，积分兑换 `/gold-coins-exchange.html`。

## 活动中心使用说明

### 签到流程

1. 点击「Check-in Now」执行签到，成功后弹出签到成功弹框
2. 可选择「Claim base reward only」仅领基础金币，或「Get Nx Extra Coins (Watch Video)」先关弹框再播激励视频领额外金币
3. 签到看视频完成后会请求 `/api/v1/ops/activity/video` 领奖并刷新页面

### 每日看视频流程

1. 在「Daily Video Task」卡片点击「Watch Now」播激励视频
2. 播完后按钮变为「Claim」，点击领取金币
3. 每日次数与单次奖励由后端基础信息接口的 `tasks[type=video]` 配置

### 注意事项

- 广告未完整播放即关闭时无法领取奖励
- 两处广告展位（签到看视频、每日看视频）均由 Native 按 `taskId` 区分，H5 不传广告位 ID

---




