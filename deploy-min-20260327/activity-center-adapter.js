/**
 * H5-SDK 适配器层
 * 负责：H5 页面与 SDK 之间的协商和桥接
 * 包括：SDK 初始化、事件处理、回调注册
 */
import * as logger from "/activity-logger.js";

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
   * 初始化 SDK（等待原生注入）
   */
  async init() {
    // 等待原生 SDK 注入
    await this.waitForSDK();

    // SDK 就绪后再次确保事件回调已注册（避免注入时序导致回调未挂上）
    this.setupEventCallback();

    // 初始化活动会话
    if (window.ActivityBridgeHelper && window.ActivityBridgeHelper.initActivity) {
      try {
        const session = await window.ActivityBridgeHelper.initActivity(
          this.config.activityId,
          this.config.code,
          this.config.token,
          this.config.channelTag
        );
        logger.log("SDK init 成功:", session);

        // 追踪页面浏览事件
        await window.ActivityBridgeHelper.trackEvent("page_view", {
          url: window.location.href,
        });

        this.isSDKReady = true;
        this.config.onSDKReady(session);
        return session;
      } catch (error) {
        logger.error("SDK init failed", error);
        throw error;
      }
    } else {
      logger.error("ActivityBridgeHelper 未注入，请确保原生 SDK 已正确加载");
      this.isSDKReady = false;
      this.config.onSDKReady(null);
      return null;
    }
  }

  /**
   * 等待 SDK 加载完成（原生注入）
   */
  async waitForSDK() {
    return new Promise((resolve) => {
      // 检查 SDK 是否已注入
      if (
        typeof window.ActivityBridgeHelper !== "undefined" &&
        window.ActivityBridgeHelper.isAvailable &&
        window.ActivityBridgeHelper.isAvailable()
      ) {
        resolve();
        return;
      }

      // 等待原生注入，最多 3 秒
      let checkCount = 0;
      const checkInterval = setInterval(() => {
        checkCount++;
        if (
          typeof window.ActivityBridgeHelper !== "undefined" &&
          window.ActivityBridgeHelper.isAvailable &&
          window.ActivityBridgeHelper.isAvailable()
        ) {
          clearInterval(checkInterval);
          resolve();
        } else if (checkCount >= 30) {
          // 3秒超时
          clearInterval(checkInterval);
          logger.warn("ActivityBridgeHelper 加载超时，请确保原生 SDK 已正确注入");
          resolve(); // 仍然继续，不阻塞页面初始化
        }
      }, 100);
    });
  }

  /**
   * 设置事件完成回调
   */
  setupEventCallback() {
    if (
      typeof window.ActivityBridgeHelper !== "undefined" &&
      typeof window.ActivityBridgeHelper.onActivityEventCompleted === "function"
    ) {
      window.ActivityBridgeHelper.onActivityEventCompleted((result) => {
        this.config.onEventCompleted(result);
      });
    }
  }

  /**
   * 触发插页式激励广告（task_watch_ad 每日看视频）
   * 对应 Native: RewardedInterstitialAd，需要用户看完才算完成。
   */
  async triggerRewardAd(eventData = {}) {
    if (!window.ActivityBridgeHelper?.triggerEvent) {
      throw new Error("ActivityBridgeHelper 未注入");
    }

    const defaultEventData = {
      taskId: "task_watch_ad",
      ...eventData,
    };

    const payload = JSON.stringify(defaultEventData);
    logger.log("[SDK] triggerRewardAd payload:", defaultEventData);

    return window.ActivityBridgeHelper.triggerEvent(
      window.ActivityBridgeHelper.EventType.REWARD_AD,
      payload
    );
  }

  /**
   * 触发插页式广告（task_checkin 签到弹框看视频）
   * 对应 Native: InterstitialAd，广告关闭即视为完成。
   */
  async triggerInterstitialAd(eventData = {}) {
    if (!window.ActivityBridgeHelper?.triggerEvent) {
      throw new Error("ActivityBridgeHelper 未注入");
    }

    const defaultEventData = {
      taskId: "task_checkin",
      ...eventData,
    };

    const payload = JSON.stringify(defaultEventData);
    logger.log("[SDK] triggerInterstitialAd payload:", defaultEventData);

    return window.ActivityBridgeHelper.triggerEvent(
      window.ActivityBridgeHelper.EventType.INTERSTITIAL_AD,
      payload
    );
  }

  /**
   * 追踪事件
   */
  async trackEvent(eventType, eventData = {}) {
    if (!window.ActivityBridgeHelper?.trackEvent) {
      logger.warn("ActivityBridgeHelper 未注入，无法追踪事件");
      return;
    }

    return window.ActivityBridgeHelper.trackEvent(eventType, eventData);
  }

  /**
   * 获取平台信息
   */
  getPlatform() {
    return window.ActivityBridgeHelper?.getPlatform?.() || "unknown";
  }

  /**
   * 获取 SDK 版本
   */
  getVersion() {
    return window.ActivityBridgeHelper?.getVersion?.() || "unknown";
  }

  /**
   * 检查 SDK 是否可用
   */
  isAvailable() {
    return this.isSDKReady && window.ActivityBridgeHelper?.isAvailable?.();
  }
}
