import { getActivityInfo, postCheckin, postCheckinVideo } from "./activity-api.js";
import * as logger from "./activity-logger.js";

/**
 * 活动中心业务逻辑层
 * 负责：用户资产管理、任务状态管理、业务流程处理
 * 不依赖 DOM，只处理数据和业务逻辑
 */
export class WelfareCenterBusiness {
  constructor(config = {}) {
    // 用户资产（未获取到服务端数据前缺省 0）
    this.userAssets = {
      goldCoins: 0,
    };

    // 广告任务状态（未获取到服务端数据前缺省 0）
    this.adTaskStatus = {
      completed: 0,
      daily_limit: 0,
      reward: 0,
      canClaim: false,
    };

    // 签到任务详情（来自 tasks[] 中 type === 'checkin' 的 task.detail）
    this.checkinDetail = null;

    // 当前用户 ID（来自 user_info.user_id）
    this.userId = null;

    // 配置
    this.config = {
      onAssetsUpdate: config.onAssetsUpdate || (() => {}),
      onTaskUpdate: config.onTaskUpdate || (() => {}),
      onCheckinUpdate: config.onCheckinUpdate || (() => {}),
      onUserInfoUpdate: config.onUserInfoUpdate || (() => {}),
      onAdProgressUpdate: config.onAdProgressUpdate || (() => {}),
      onToast: config.onToast || (() => {}),
      ...config,
    };
  }

  /**
   * 获取当前签到任务详情（含 days、continuous_days、super_reward_day）
   */
  getCheckinDetail() {
    return this.checkinDetail ? { ...this.checkinDetail } : null;
  }

  /**
   * 获取今日签到项（detail.days 中 current === true 的那一项）
   */
  getTodayCheckinDay() {
    if (!this.checkinDetail || !Array.isArray(this.checkinDetail.days)) return null;
    return this.checkinDetail.days.find((d) => d.current === true) || null;
  }

  /**
   * 加载活动基础数据（后端接口 /api/v1/ops/activity/info）
   * 成功则用接口数据更新资产与任务；失败则回退到 mock 数据
   * @param {Object} [apiOptions] - { baseUrl?, app_id?, app_secret? }
   */
  async loadActivityInfo(apiOptions = {}) {
    try {
      const res = await getActivityInfo(apiOptions);
      if (res.code === 200 && res.data) {
        const d = res.data;
        // 新结构：user_info.user_id
        if (d.user_info != null && d.user_info.user_id != null) {
          this.userId = d.user_info.user_id;
          this.config.onUserInfoUpdate({ user_id: this.userId });
        }
        // 新结构：wallet_info.coin
        if (d.wallet_info != null && typeof d.wallet_info.coin === "number") {
          this.userAssets.goldCoins = d.wallet_info.coin;
          this.config.onAssetsUpdate(this.userAssets);
        }
        // 新结构：tasks[]，按 type 区分 checkin / video
        const tasks = Array.isArray(d.tasks) ? d.tasks : [];
        for (const task of tasks) {
          if (task.type === "checkin" && task.detail != null) {
            this.checkinDetail = task.detail;
            this.config.onCheckinUpdate(task.detail);
          }
          if (task.type === "video" && task.detail != null) {
            const v = task.detail;
            this.adTaskStatus = {
              completed: v.today_watched ?? 0,
              daily_limit: v.daily_limit ?? 0,
              reward: v.coin ?? 0,
              canClaim: this.adTaskStatus.canClaim,
            };
            this.config.onTaskUpdate({ watchAd: this.adTaskStatus });
          }
        }
        logger.log("[活动接口] 使用接口数据\n", {
          user_id: this.userId,
          goldCoins: this.userAssets.goldCoins,
          checkin: this.checkinDetail != null,
          watchAd: this.adTaskStatus,
        });
        return { ok: true, data: res.data };
      }
      logger.warn("[活动接口] 返回码异常\n" + JSON.stringify({ code: res.code, res }, null, 2));
      throw new Error(res.message || "API returned an error");
    } catch (error) {
      logger.warn("[活动接口] 请求失败，使用 mock 数据", error?.message ?? error);
      await this.loadUserAssets();
      await this.loadTasks();
      return { ok: false, error };
    }
  }

  /**
   * 执行签到（调用后端 /api/v1/ops/activity/checkin），成功后刷新 activity info，返回弹框三处数据：coinFromCheckin、video_coin、multiplier
   * @param {Object} [apiOptions] - { baseUrl?, app_id?, app_secret? }
   * @returns {Promise<{ ok: boolean, coinFromCheckin?: number, video_coin?: number, multiplier?: number }>}
   */
  async doCheckin(apiOptions = {}) {
    try {
      const res = await postCheckin(apiOptions);
      if (res.code !== 200) {
        this.config.onToast(res.message || "Check-in failed", "error");
        return { ok: false };
      }
      const coinFromCheckin = res.data?.coin ?? res.coin ?? 0;
      await this.loadActivityInfo(apiOptions);
      const today = this.getTodayCheckinDay();
      const video_coin = today?.video_coin ?? 0;
      const multiplier = (today?.coin > 0) ? Math.floor((today.video_coin ?? 0) / today.coin) : 0;
      return { ok: true, coinFromCheckin, video_coin, multiplier };
    } catch (error) {
      logger.error("Do checkin failed", error);
      this.config.onToast(error?.message || "Check-in failed, please try again", "error");
      return { ok: false };
    }
  }

  /**
   * 签到看视频成功领取奖励：调用 /api/v1/ops/activity/video，然后 tip message，再刷新基础信息
   * @param {Object} [apiOptions] - { baseUrl?, app_id?, app_secret? }
   * @param {string} [video_id] - 看完视频后得到的视频 id（来自 SDK 回调）
   * @returns {Promise<{ ok: boolean }>}
   */
  async claimCheckinVideoReward(apiOptions = {}, video_id = "") {
    logger.log("[签到看视频领奖] 调用 /api/v1/ops/activity/video video_id=" + video_id);
    try {
      const res = await postCheckinVideo(apiOptions, { video_id });
      const msg = res.data?.message ?? res.message ?? "";
      if (res.code === 200 && res.data?.success) {
        this.config.onToast(msg || "Video completed! Coins rewarded.", "success");
      } else {
        this.config.onToast(msg || "Claim failed", "error");
      }
    } catch (error) {
      logger.error("Claim checkin video reward failed", error);
      this.config.onToast(error?.message || "Claim failed, please try again", "error");
    }
    await this.loadActivityInfo(apiOptions);
    return { ok: true };
  }

  /**
   * 加载用户资产
   */
  async loadUserAssets() {
    try {
      const response = await this.mockFetchUserAssets();
      if (response.ok) {
        this.userAssets = response.data;
        this.config.onAssetsUpdate(this.userAssets);
      }
      return response;
    } catch (error) {
      logger.error("Load assets failed", error);
      throw error;
    }
  }

  /**
   * 加载任务列表
   */
  async loadTasks() {
    try {
      const response = await this.mockFetchTasks();
      if (response.ok) {
        const tasks = response.data;
        if (tasks.watchAd) {
          this.adTaskStatus = tasks.watchAd;
          this.config.onTaskUpdate({ watchAd: this.adTaskStatus });
        }
      }
      return response;
    } catch (error) {
      logger.error("Load tasks failed", error);
      throw error;
    }
  }

  /**
   * 领取广告奖励
   */
  async claimAdReward() {
    if (!this.adTaskStatus.canClaim) {
      this.config.onToast("Please watch the full ad first", "warning");
      return { ok: false, message: "Please watch the full ad first" };
    }

    try {
      const response = await this.mockClaimReward("task_watch_ad", this.adTaskStatus.reward);
      if (response.ok) {
        // 更新资产
        this.userAssets.goldCoins += this.adTaskStatus.reward;
        this.adTaskStatus.completed += 1;
        this.adTaskStatus.canClaim = false;

        // 通知更新
        this.config.onAssetsUpdate(this.userAssets);
        this.config.onTaskUpdate({ watchAd: this.adTaskStatus });
        this.config.onToast(`Successfully claimed ${this.adTaskStatus.reward} coins!`, "success");
      } else {
        this.config.onToast(response.message || "Claim failed", "error");
      }
      return response;
    } catch (error) {
      logger.error("Claim reward failed", error);
      this.config.onToast("Claim failed, please try again", "error");
      throw error;
    }
  }

  /**
   * 标记广告可领取
   */
  markAdCanClaim() {
    this.adTaskStatus.canClaim = true;
    this.config.onTaskUpdate({ watchAd: this.adTaskStatus });
  }

  /**
   * 获取用户资产
   */
  getUserAssets() {
    return { ...this.userAssets };
  }

  /**
   * 获取广告任务状态
   */
  getAdTaskStatus() {
    return { ...this.adTaskStatus };
  }

  /**
   * 更新广告任务奖励
   */
  updateAdTaskReward(reward) {
    this.adTaskStatus.reward = reward;
    this.config.onTaskUpdate({ watchAd: this.adTaskStatus });
  }

  // ==================== Mock API ====================

  async mockFetchUserAssets() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      ok: true,
      data: {
        goldCoins: 0,
      },
    };
  }

  async mockFetchTasks() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const mockCheckinDetail = {
      continuous_days: 3,
      next_day_coin: 100,
      super_reward_day: 7,
      days: [
        { day: 1, coin: 50, video_coin: 100, current: false, received: true, video_received: false },
        { day: 2, coin: 60, video_coin: 120, current: false, received: true, video_received: false },
        { day: 3, coin: 80, video_coin: 160, current: false, received: true, video_received: false },
        { day: 4, coin: 100, video_coin: 200, current: true, received: false, video_received: false },
        { day: 5, coin: 120, video_coin: 240, current: false, received: false, video_received: false },
        { day: 6, coin: 150, video_coin: 300, current: false, received: false, video_received: false },
        { day: 7, coin: 500, video_coin: 1000, current: false, received: false, video_received: false },
      ],
    };
    this.checkinDetail = mockCheckinDetail;
    this.config.onCheckinUpdate(mockCheckinDetail);
    return {
      ok: true,
      data: {
        watchAd: {
          completed: 0,
          daily_limit: 0,
          reward: 0,
          canClaim: false,
        },
      },
    };
  }

  async mockDoCheckin() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!this.checkinDetail || !Array.isArray(this.checkinDetail.days)) {
      return { ok: false, message: "No check-in data" };
    }
    const todayIdx = this.checkinDetail.days.findIndex((d) => d.current === true);
    if (todayIdx < 0) return { ok: false, message: "Already checked in today or not check-in day" };
    this.checkinDetail.days[todayIdx].received = true;
    this.config.onCheckinUpdate(this.checkinDetail);
    const today = this.checkinDetail.days[todayIdx];
    return { ok: true, coin: today.coin, video_coin: today.video_coin };
  }

  async mockClaimReward(taskId, reward) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      ok: true,
      message: "Claim successful",
    };
  }
}
