import { getActivityInfo } from "./activity-api.js";

/**
 * 活动中心业务逻辑层
 * 负责：用户资产管理、任务状态管理、业务流程处理
 * 不依赖 DOM，只处理数据和业务逻辑
 */
export class WelfareCenterBusiness {
  constructor(config = {}) {
    // 用户资产
    this.userAssets = {
      goldCoins: 750,
    };

    // 广告任务状态（completed/daily_limit 用于进度展示）
    this.adTaskStatus = {
      completed: 0,
      daily_limit: 5,
      reward: 196,
      canClaim: false,
    };

    // 广告播放进度
    this.adWatchProgress = 0;
    this.adWatchInterval = null;

    // 配置
    this.config = {
      onAssetsUpdate: config.onAssetsUpdate || (() => {}),
      onTaskUpdate: config.onTaskUpdate || (() => {}),
      onAdProgressUpdate: config.onAdProgressUpdate || (() => {}),
      onToast: config.onToast || (() => {}),
      ...config,
    };
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
        const useData = {
          wallet_balance: d.wallet_info?.balance,
          video_task: d.video_task_info,
          user_id: d.user_info?.user_id,
          checkin: d.checkin_info,
        };
        console.log("[活动接口] 使用接口数据\n" + JSON.stringify(useData, null, 2));
        if (d.wallet_info != null && typeof d.wallet_info.balance === "number") {
          this.userAssets.goldCoins = d.wallet_info.balance;
          this.config.onAssetsUpdate(this.userAssets);
        }
        if (d.video_task_info != null) {
          const v = d.video_task_info;
          this.adTaskStatus = {
            completed: v.today_watched ?? 0,
            daily_limit: v.daily_limit ?? 5,
            reward: v.single_points ?? 20,
            canClaim: false,
          };
          this.config.onTaskUpdate({ watchAd: this.adTaskStatus });
        }
        return { ok: true, data: res.data };
      }
      console.warn("[活动接口] 返回码异常\n" + JSON.stringify({ code: res.code, res }, null, 2));
      throw new Error(res.message || "接口返回异常");
    } catch (error) {
      console.warn("[活动接口] 请求失败，使用 mock 数据", error?.message ?? error);
      await this.loadUserAssets();
      await this.loadTasks();
      return { ok: false, error };
    }
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
      console.error("Load assets failed", error);
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
      console.error("Load tasks failed", error);
      throw error;
    }
  }

  /**
   * 领取广告奖励
   */
  async claimAdReward() {
    if (!this.adTaskStatus.canClaim) {
      this.config.onToast("请先观看完整广告", "warning");
      return { ok: false, message: "请先观看完整广告" };
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
        this.config.onToast(`成功领取${this.adTaskStatus.reward}金币！`, "success");
      } else {
        this.config.onToast(response.message || "领取失败", "error");
      }
      return response;
    } catch (error) {
      console.error("Claim reward failed", error);
      this.config.onToast("领取失败，请重试", "error");
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
        goldCoins: 750,
      },
    };
  }

  async mockFetchTasks() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      ok: true,
      data: {
        watchAd: {
          completed: 0,
          daily_limit: 5,
          reward: 196,
          canClaim: false,
        },
      },
    };
  }

  async mockClaimReward(taskId, reward) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      ok: true,
      message: "领取成功",
    };
  }
}
