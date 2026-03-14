/**
 * H5-SDK 适配器层
 * 负责：H5 页面与 SDK 之间的协商和桥接
 * 包括：SDK 初始化、事件处理、回调注册
 */
export class WelfareCenterAdapter {
  constructor(config = {}) {
    this.config = {
      activityId: config.activityId || "",
      code: config.code || "",
      token: config.token || "",
      channelTag: config.channelTag || "",
      onSDKReady: config.onSDKReady || (() => {}),
      onEventCompleted: config.onEventCompleted || (() => {}),
      ...config,
    };

    this.sdk = null;
    this.isSDKReady = false;
  }

  /**
   * 初始化 SDK（等待原生 SDK 注入或加载 Web SDK）
   */
  async init() {
    // 等待 SDK 加载
    await this.waitForSDK();

    // 初始化活动会话
    if (window.ADActivitySDK && window.ADActivitySDK.initActivity) {
      try {
        const session = await window.ADActivitySDK.initActivity(
          this.config.activityId,
          this.config.code,
          this.config.token,
          this.config.channelTag
        );
        console.log("活动会话初始化成功:", session);

        // 追踪页面浏览事件
        await window.ADActivitySDK.trackEvent("page_view", {
          url: window.location.href,
        });

        this.isSDKReady = true;
        this.config.onSDKReady(session);
        return session;
      } catch (error) {
        console.error("SDK init failed", error);
        throw error;
      }
    } else {
      console.warn("ADActivitySDK 不可用，使用降级方案");
      this.isSDKReady = false;
      this.config.onSDKReady(null);
      return null;
    }
  }

  /**
   * 等待 SDK 加载完成
   */
  async waitForSDK() {
    return new Promise((resolve) => {
      // 检查 SDK 是否已加载
      if (
        typeof window.ADActivitySDK !== "undefined" &&
        window.ADActivitySDK.isAvailable &&
        window.ADActivitySDK.isAvailable()
      ) {
        resolve();
        return;
      }

      // 尝试加载 Web SDK（降级方案）
      this.loadWebSDK();

      // 等待最多 3 秒
      let checkCount = 0;
      const checkInterval = setInterval(() => {
        checkCount++;
        if (
          typeof window.ADActivitySDK !== "undefined" &&
          window.ADActivitySDK.isAvailable &&
          window.ADActivitySDK.isAvailable()
        ) {
          clearInterval(checkInterval);
          resolve();
        } else if (checkCount >= 30) {
          // 3秒超时
          clearInterval(checkInterval);
          console.warn(
            "ADActivitySDK 加载超时，可能原生未注入或 CDN 加载失败"
          );
          resolve(); // 仍然继续，不阻塞页面初始化
        }
      }, 100);
    });
  }

  /**
   * 加载 Web SDK（降级方案）
   */
  loadWebSDK() {
    if (typeof window.ADActivitySDK !== "undefined") {
      return;
    }

    // 尝试从本地加载
    const script = document.createElement("script");
    script.src = "./ad_activity_sdk_for_webview.js";
    script.onerror = () => {
      console.warn("无法从本地加载 Web SDK，尝试从 CDN 加载");
      // 从 CDN 加载
      const cdnScript = document.createElement("script");
      cdnScript.src = "https://your-cdn.com/js/ad_activity_sdk_for_webview.js";
      cdnScript.onerror = () => {
        console.warn(
          "无法从 CDN 加载 Web SDK，请确保原生 SDK 已注入或提供正确的 CDN 地址"
        );
      };
      document.head.appendChild(cdnScript);
    };
    script.onload = () => {
      console.log("ADActivitySDK: Web SDK 辅助库已从本地加载");
    };
    document.head.appendChild(script);
  }

  /**
   * 设置事件完成回调
   */
  setupEventCallback() {
    if (
      typeof window.ADActivitySDK !== "undefined" &&
      typeof window.ADActivitySDK.onActivityEventCompleted === "function"
    ) {
      window.ADActivitySDK.onActivityEventCompleted((result) => {
        this.config.onEventCompleted(result);
      });
    } else {
      // 降级方案：直接监听 window.onActivityEventCompleted
      window.onActivityEventCompleted = (result) => {
        this.config.onEventCompleted(result);
      };
    }
  }

  /**
   * 触发激励视频广告
   */
  async triggerRewardAd(eventData = {}) {
    if (!window.ADActivitySDK || !window.ADActivitySDK.triggerEvent) {
      throw new Error("ADActivitySDK 不可用");
    }

    const defaultEventData = {
      taskId: "task_watch_ad",
      ...eventData,
    };

    return window.ADActivitySDK.triggerEvent(
      window.ADActivitySDK.EventType.REWARD_AD,
      defaultEventData
    );
  }

  /**
   * 追踪事件
   */
  async trackEvent(eventType, eventData = {}) {
    if (!window.ADActivitySDK || !window.ADActivitySDK.trackEvent) {
      console.warn("ADActivitySDK.trackEvent 不可用");
      return;
    }

    return window.ADActivitySDK.trackEvent(eventType, eventData);
  }

  /**
   * 获取平台信息
   */
  getPlatform() {
    if (window.ADActivitySDK && window.ADActivitySDK.getPlatform) {
      return window.ADActivitySDK.getPlatform();
    }
    return "unknown";
  }

  /**
   * 获取 SDK 版本
   */
  getVersion() {
    if (window.ADActivitySDK && window.ADActivitySDK.getVersion) {
      return window.ADActivitySDK.getVersion();
    }
    return "unknown";
  }

  /**
   * 检查 SDK 是否可用
   */
  isAvailable() {
    return this.isSDKReady && window.ADActivitySDK && window.ADActivitySDK.isAvailable && window.ADActivitySDK.isAvailable();
  }
}
