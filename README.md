# AdQuanta 活动平台 H5

本仓库为 **AdQuanta 活动平台** 的 H5 前端，包含活动首页、活动中心、积分兑换等页面。

- 技术栈：**HTML + JS + CSS**，通过 `ActivityRuntimeSDK` 与活动平台后端协作
- 页面加载后执行 JS，完成：
  - 初始化（读取 URL 里的 `code/token`，换取 `sessionContext`）
  - 事件上报
  - 抽奖（对接抽奖引擎）
  - 领奖（发奖任务状态机）

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
- 广告观看：点击”去完成”播放广告，观看完成后可领取积分
- 实时更新资产和任务状态

### 3. 积分兑换页面 (`gold-coins-exchange.html`)

积分兑换页面，用户可使用积分兑换商品。

**核心功能**：
- 展示用户当前积分
- 可兑换商品列表
- 积分兑换下单

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

## 活动中心页面使用说明

### 广告观看流程

1. 点击「看广告赚积分」任务中的「去完成」按钮
2. 弹出广告播放界面，显示播放进度
3. 广告播放完成后，按钮变为「领取」状态（高亮）
4. 点击「领取」获得积分奖励

### 注意事项

- 广告未播放完成即关闭时，无法领取奖励
- 播放完成后按钮会自动变为可领取状态

---




