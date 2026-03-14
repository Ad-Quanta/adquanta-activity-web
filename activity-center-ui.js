/**
 * UI 绑定层
 * 负责：DOM 操作、UI 更新、事件绑定
 * 只处理 UI 相关的逻辑，不包含业务逻辑
 */
export class WelfareCenterUI {
  constructor(config = {}) {
    this.elements = {
      goldCoins: document.getElementById("goldCoins"),
      adRewardAmount: document.getElementById("ad-reward-amount"),
      adTaskDesc: document.getElementById("ad-task-desc"),
      btnWatchAd: document.getElementById("btn-watch-ad"),
      adOverlay: document.getElementById("adOverlay"),
      adProgress: document.getElementById("adProgress"),
      adProgressText: document.getElementById("adProgressText"),
      adCloseBtn: document.getElementById("adCloseBtn"),
      userGreeting: document.getElementById("userGreeting"),
      toast: document.getElementById("toast"),
      // 兑换入口按钮（命名上复用 withdrawBtn，实际对应金币兑换）
      exchangeBtn: document.getElementById("exchangeBtn"),
      withdrawBtn: document.getElementById("exchangeBtn"),
      signinTimerBtn: document.getElementById("signin-timer-btn"),
      signinDialog: document.getElementById("signinDialog"),
      signinDialogReward: document.getElementById("signinDialogReward"),
      signinDialogWatchBtn: document.getElementById("signinDialogWatchBtn"),
      signinDialogCloseBtn: document.getElementById("signinDialogCloseBtn"),
    };

    this.config = {
      onWatchAdClick: config.onWatchAdClick || (() => {}),
      onClaimAdClick: config.onClaimAdClick || (() => {}),
      onAdCloseClick: config.onAdCloseClick || (() => {}),
      onWithdrawClick: config.onWithdrawClick || (() => {}),
      onRedPacketClick: config.onRedPacketClick || (() => {}),
      onSigninClick: config.onSigninClick || (() => {}),
      ...config,
    };

    this.adWatchProgress = 0;
    this.adWatchInterval = null;
  }

  /**
   * 更新资产显示
   */
  updateAssets(assets) {
    if (this.elements.goldCoins) {
      this.elements.goldCoins.textContent = assets.goldCoins;
    }
  }

  /**
   * 更新任务显示
   */
  updateTasks(tasks) {
    if (tasks.watchAd) {
      const task = tasks.watchAd;
      const limit = task.daily_limit ?? 5;
      if (this.elements.adRewardAmount) {
        this.elements.adRewardAmount.textContent = task.reward;
      }
      if (this.elements.adTaskDesc) {
        this.elements.adTaskDesc.textContent = `本次得${task.reward}金币,已完成${task.completed}次`;
      }
      const progressVideos = document.getElementById("ad-progress-videos");
      if (progressVideos) {
        progressVideos.textContent = `${task.completed} / ${limit} Videos`;
      }
      const progressFill = document.querySelector(".tc-video-progress-fill");
      if (progressFill && limit > 0) {
        progressFill.style.width = `${Math.min(100, (100 * task.completed) / limit)}%`;
      }
      if (this.elements.btnWatchAd) {
        if (task.canClaim) {
          this.elements.btnWatchAd.textContent = "领取";
          this.elements.btnWatchAd.classList.add("can-claim");
        } else {
          this.elements.btnWatchAd.textContent = "去完成";
          this.elements.btnWatchAd.classList.remove("can-claim");
        }
      }
    }
  }

  /**
   * 更新用户问候语
   */
  updateUserGreeting(name, email) {
    if (!this.elements.userGreeting) return;

    if (!name && !email) {
      this.elements.userGreeting.textContent = "";
      return;
    }

    if (name && email) {
      this.elements.userGreeting.textContent = `${name}（${email}），欢迎你`;
    } else {
      this.elements.userGreeting.textContent = `${name || email}，欢迎你`;
    }
  }

  /**
   * 显示 Toast
   */
  showToast(message, type = "info") {
    if (!this.elements.toast) return;

    this.elements.toast.textContent = message;
    this.elements.toast.className = `toast ${type}`;
    this.elements.toast.style.display = "block";
    setTimeout(() => {
      this.elements.toast.style.display = "none";
    }, 2000);
  }

  /**
   * 显示广告播放界面
   */
  showAdOverlay() {
    if (this.elements.adOverlay) {
      this.elements.adOverlay.style.display = "flex";
    }
    if (this.elements.adProgress) {
      this.elements.adProgress.style.width = "0%";
    }
    if (this.elements.adProgressText) {
      this.elements.adProgressText.textContent = "广告播放中... 0%";
    }
    this.adWatchProgress = 0;
  }

  /**
   * 更新广告播放进度
   */
  updateAdProgress(progress) {
    this.adWatchProgress = progress;
    if (this.elements.adProgress) {
      this.elements.adProgress.style.width = `${progress}%`;
    }
    if (this.elements.adProgressText) {
      if (progress >= 100) {
        this.elements.adProgressText.textContent = "广告播放完成！";
      } else {
        this.elements.adProgressText.textContent = `广告播放中... ${progress}%`;
      }
    }
  }

  /**
   * 隐藏广告播放界面
   */
  hideAdOverlay() {
    if (this.elements.adOverlay) {
      this.elements.adOverlay.style.display = "none";
    }
    this.adWatchProgress = 0;
  }

  /**
   * 显示签到成功弹框
   * @param {number} reward 本次基础奖励，用于展示 3 倍金币
   */
  showSigninDialog(reward) {
    if (this.elements.signinDialogReward && typeof reward === "number") {
      this.elements.signinDialogReward.textContent = reward * 3;
    }
    if (this.elements.signinDialog) {
      this.elements.signinDialog.style.display = "flex";
    }
  }

  /**
   * 隐藏签到成功弹框
   */
  hideSigninDialog() {
    if (this.elements.signinDialog) {
      this.elements.signinDialog.style.display = "none";
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 看广告/领取按钮
    if (this.elements.btnWatchAd) {
      this.elements.btnWatchAd.addEventListener("click", () => {
        const isCanClaim = this.elements.btnWatchAd.classList.contains("can-claim");
        if (isCanClaim) {
          this.config.onClaimAdClick();
        } else {
          this.config.onWatchAdClick();
        }
      });
    }

    // 关闭广告按钮
    if (this.elements.adCloseBtn) {
      this.elements.adCloseBtn.addEventListener("click", () => {
        if (this.adWatchProgress < 100) {
          if (confirm("确定要关闭广告吗？未观看完整广告无法领取金币。")) {
            this.config.onAdCloseClick();
          }
        } else {
          this.config.onAdCloseClick();
        }
      });
    }

    // 提现按钮
    if (this.elements.withdrawBtn) {
      this.elements.withdrawBtn.addEventListener("click", () => {
        this.config.onWithdrawClick();
      });
    }

    // 红包雨按钮
    if (this.elements.btnRedPacket) {
      this.elements.btnRedPacket.addEventListener("click", () => {
        this.config.onRedPacketClick();
      });
    }

    // 签到按钮
    if (this.elements.signinTimerBtn) {
      this.elements.signinTimerBtn.addEventListener("click", () => {
        this.config.onSigninClick();
      });
    }

    // 签到成功弹框 - 关闭
    if (this.elements.signinDialogCloseBtn) {
      this.elements.signinDialogCloseBtn.addEventListener("click", () => {
        this.hideSigninDialog();
      });
    }

    // 签到成功弹框 - 看视频领三倍
    if (this.elements.signinDialogWatchBtn) {
      this.elements.signinDialogWatchBtn.addEventListener("click", () => {
        this.hideSigninDialog();
        // 复用看广告视频逻辑
        this.config.onWatchAdClick();
      });
    }
  }
}
