# 福利中心架构说明

## 架构设计原则

将业务逻辑从 H5 页面中抽离，降低对 H5 的侵入性。H5 页面只负责：
1. **UI 绑定**：DOM 操作、事件绑定
2. **协商接口**：与 SDK 的交互协议、参数传递、回调处理

## 分层架构

```
┌─────────────────────────────────────────┐
│         welfare-center.html              │
│  (H5 页面 - 只包含 UI 绑定和协商接口)      │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────────┐
│  UI Layer   │  │  Adapter Layer   │
│  (UI绑定层)  │  │  (H5-SDK协商层)   │
└──────┬──────┘  └──────┬──────────┘
       │                │
       │         ┌──────▼──────────┐
       │         │   SDK (原生/Web) │
       │         └──────────────────┘
       │
┌──────▼──────────────┐
│  Business Layer     │
│  (业务逻辑层)         │
└─────────────────────┘
```

## 各层职责

### 1. H5 页面层 (`welfare-center.html`)

**职责：**
- URL 参数解析（`activityId`, `code`, `token`, `channelTag`）
- JWT token 解析（如果需要从 token 中提取用户信息）
- 初始化各层并连接它们
- 定义 H5-SDK 协商接口（事件处理、回调注册）

**不包含：**
- ❌ 业务逻辑（用户资产管理、任务状态管理）
- ❌ SDK 调用细节（SDK 加载、初始化细节）
- ❌ UI 更新逻辑（DOM 操作细节）

### 2. UI 绑定层 (`welfare-center-ui.js`)

**职责：**
- DOM 元素选择和管理
- UI 更新（资产显示、任务显示、Toast 提示）
- 事件绑定（按钮点击、用户交互）

**不包含：**
- ❌ 业务逻辑判断（是否可以领取、奖励计算）
- ❌ SDK 调用

### 3. 适配器层 (`welfare-center-adapter.js`)

**职责：**
- SDK 加载和初始化（等待原生注入或加载 Web SDK）
- SDK 事件触发（触发广告、追踪事件）
- SDK 回调注册（事件完成回调）
- H5 与 SDK 之间的协议转换

**协商接口：**
- `init()`: 初始化 SDK
- `triggerRewardAd()`: 触发激励视频广告
- `trackEvent()`: 追踪事件
- `setupEventCallback()`: 设置事件回调
- `onEventCompleted()`: 事件完成回调处理

**不包含：**
- ❌ 业务逻辑（奖励发放、状态管理）
- ❌ UI 更新

### 4. 业务逻辑层 (`welfare-center-business.js`)

**职责：**
- 用户资产管理（金币、现金）
- 任务状态管理（广告任务状态、完成次数）
- 业务流程处理（领取奖励、加载数据）
- 数据转换和格式化

**不包含：**
- ❌ DOM 操作
- ❌ SDK 调用
- ❌ UI 更新（通过回调通知 UI 层）

## H5-SDK 协商接口

### 1. 参数传递

H5 从 URL 获取参数并传递给适配器：

```javascript
const qp = new URLSearchParams(window.location.search);
const activityId = qp.get("activityId");
const code = qp.get("code");
const token = qp.get("token");
const channelTag = qp.get("channelTag");
```

### 2. 事件类型协商

H5 需要知道 SDK 支持哪些事件类型：

```javascript
// SDK 事件类型（活动中心使用）
window.ADActivitySDK.EventType.REWARD_AD  // 激励视频广告（每日看视频任务、签到看视频）
```

### 3. 回调协议协商

H5 需要知道如何注册和处理 SDK 回调：

```javascript
// 注册事件完成回调
adapter.setupEventCallback();

// 处理事件完成
function handleSDKEventCompleted(result) {
  const eventType = result.eventType;
  const success = result.success;
  // H5 需要知道如何处理不同的事件类型
}
```

### 4. 错误处理协商

H5 需要知道 SDK 的错误回调格式：

```javascript
window.onRewardedAdError = function (error) {
  // H5 需要知道如何处理错误
};
```

## 使用示例

### 添加新功能

如果要在 H5 中添加新功能（如"签到"），只需要：

1. **在 H5 中定义协商接口**（如何调用、如何处理回调）
2. **在适配器层添加 SDK 调用方法**
3. **在业务逻辑层添加业务处理**
4. **在 UI 层添加 UI 更新**

### 修改业务逻辑

如果业务逻辑需要修改（如奖励计算规则），只需要修改 `welfare-center-business.js`，不需要修改 H5 页面。

### 更换 SDK

如果 SDK 接口发生变化，只需要修改适配器层，业务逻辑和 UI 层不需要改动。

## 文件结构

```
demo_h5_activity_page/
├── welfare-center.html          # H5 页面（UI 绑定 + 协商接口）
├── welfare-center-ui.js         # UI 绑定层
├── welfare-center-adapter.js     # H5-SDK 适配器层
├── welfare-center-business.js    # 业务逻辑层
└── welfare-center.css            # 样式文件
```

## 优势

1. **低侵入性**：H5 页面代码量大幅减少，只保留必要的协商接口
2. **易维护**：业务逻辑、UI、SDK 调用分离，修改互不影响
3. **易扩展**：添加新功能只需在对应层添加代码
4. **易测试**：各层可以独立测试
5. **易复用**：业务逻辑层和适配器层可以在其他页面复用
