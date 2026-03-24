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
      signinDialogCelebration: document.getElementById("signinDialogCelebration"),
      signinDialogTitle: document.getElementById("signinDialogTitle"),
      signinDialogBaseCoinsWrap: document.getElementById("signinDialogBaseCoinsWrap"),
      signinDialogBaseCoins: document.getElementById("signinDialogBaseCoins"),
      signinDialogVideoCoin: document.getElementById("signinDialogVideoCoin"),
      signinDialogMultiplier: document.getElementById("signinDialogMultiplier"),
      signinDialogWatchBtn: document.getElementById("signinDialogWatchBtn"),
      signinDialogClaimBaseOnly: document.getElementById("signinDialogClaimBaseOnly"),
    };

    this.config = {
      onWatchAdClick: config.onWatchAdClick || (() => {}),
      onClaimAdClick: config.onClaimAdClick || (() => {}),
      onAdCloseClick: config.onAdCloseClick || (() => {}),
      onWithdrawClick: config.onWithdrawClick || (() => {}),
      onSigninClick: config.onSigninClick || (() => {}),
      onSigninWatchVideoClick: config.onSigninWatchVideoClick || (() => {}),
      ...config,
    };

    this.adWatchProgress = 0;
    this.adWatchInterval = null;
  }

  /**
   * 更新资产显示（未获取到数据前缺省 0）
   */
  updateAssets(assets) {
    if (this.elements.goldCoins) {
      const v = assets && typeof assets.goldCoins === "number" ? assets.goldCoins : 0;
      this.elements.goldCoins.textContent = v;
    }
  }

  /**
   * 更新日常视频任务 UI（type === 'video' 的 task.detail：today_watched, daily_limit, remain_count, coin）
   * 6 处数字均随服务端：本次得 coin 金币、已完成 today_watched 次、Earned: earned/total Gold Coins、today_watched/daily_limit Videos
   */
  updateTasks(tasks) {
    if (tasks.watchAd) {
      const task = tasks.watchAd;
      const limit = task.daily_limit ?? 5;
      const completed = task.completed ?? 0;
      const reward = task.reward ?? 0;
      const earned = completed * reward;
      const total = limit * reward;
      const isAllDone = limit !== 0 && completed >= limit;

      if (this.elements.adRewardAmount) {
        this.elements.adRewardAmount.textContent = reward;
      }
      if (this.elements.adTaskDesc) {
        this.elements.adTaskDesc.textContent = `Earn ${reward} coins per video, ${completed} completed`;
      }
      const earnedText = document.getElementById("ad-earned-text");
      if (earnedText) {
        earnedText.textContent = `Earned: ${earned} / ${total} Gold Coins`;
      }
      const progressVideos = document.getElementById("ad-progress-videos");
      if (progressVideos) {
        progressVideos.textContent = `${completed} / ${limit} Videos`;
      }
      const progressFill = document.querySelector(".tc-video-progress-fill");
      if (progressFill) {
        progressFill.style.width = limit > 0 ? `${Math.min(100, (100 * completed) / limit)}%` : "0%";
      }
      if (this.elements.btnWatchAd) {
        this.elements.btnWatchAd.classList.remove("can-claim");
        if (isAllDone) {
          this.elements.btnWatchAd.textContent = "Completed";
          this.elements.btnWatchAd.disabled = true;
          this.elements.btnWatchAd.classList.add("is-completed");
        } else {
          this.elements.btnWatchAd.textContent = "Watch Now";
          this.elements.btnWatchAd.disabled = false;
          this.elements.btnWatchAd.classList.remove("is-completed");
        }
      }
    }
  }

  /**
   * 更新用户问候语（兼容 name/email 或仅 user_id）
   */
  updateUserGreeting(name, email) {
    if (!this.elements.userGreeting) return;

    if (!name && !email) {
      this.elements.userGreeting.textContent = "";
      return;
    }

    if (name && email) {
      this.elements.userGreeting.textContent = `Welcome, ${name} (${email})`;
    } else {
      this.elements.userGreeting.textContent = `Welcome, ${name || email}`;
    }
  }

  /**
   * 用 user_info.user_id 渲染到 Gold Member 上方
   */
  updateUserDisplay(userId) {
    if (!this.elements.userGreeting) return;
    this.elements.userGreeting.textContent = userId != null && userId !== "" ? String(userId) : "";
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
      this.elements.adProgressText.textContent = "Playing ad... 0%";
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
        this.elements.adProgressText.textContent = "Ad completed!";
      } else {
        this.elements.adProgressText.textContent = `Playing ad... ${progress}%`;
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
   * 显示签到成功弹框（三处数据来自服务端）
   * 1. + N Coins：checkin 接口返回的 coinFromCheckin
   * 2. get N extra coins：info 今日签到项的 video_coin
   * 3. Get Nx Extra Coins：今日 video_coin/coin 取整倍数
   * @param {{ coinFromCheckin?: number, video_coin?: number, multiplier?: number, coin?: number, compactMode?: boolean, alreadyChecked?: boolean }} reward
   */
  showSigninDialog(reward) {
    const coinFromCheckin = reward?.coinFromCheckin ?? reward?.coin ?? 0;
    const video_coin = reward?.video_coin ?? 0;
    const multiplier = reward?.multiplier ?? 0;
    const alreadyChecked = !!reward?.alreadyChecked;

    if (this.elements.signinDialogCelebration) {
      this.elements.signinDialogCelebration.style.display = "";
    }
    if (this.elements.signinDialogTitle) {
      this.elements.signinDialogTitle.style.display = "";
      this.elements.signinDialogTitle.classList.toggle("signin-dialog-title--muted", alreadyChecked);
      this.elements.signinDialogTitle.textContent = alreadyChecked ? "You have checked in" : "Check-in Successful!";
    }
    if (this.elements.signinDialogBaseCoinsWrap) {
      this.elements.signinDialogBaseCoinsWrap.style.display = "";
    }

    if (this.elements.signinDialogBaseCoins) {
      this.elements.signinDialogBaseCoins.textContent = alreadyChecked
        ? `You have earned ${coinFromCheckin} Coins`
        : `+${coinFromCheckin} Coins`;
      this.elements.signinDialogBaseCoins.classList.toggle("signin-dialog-base-coins--muted", alreadyChecked);
    }
    if (this.elements.signinDialogVideoCoin) {
      this.elements.signinDialogVideoCoin.textContent = `${video_coin}`;
    }
    if (this.elements.signinDialogMultiplier) {
      this.elements.signinDialogMultiplier.textContent = `${multiplier}`;
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
   * 根据后端签到 detail 渲染 7 天签到卡片
   * 未获取到数据时天数、金币均用缺省值 0；已签到展示与 pill 按 continuous_days
   * @param {{ continuous_days: number, super_reward_day?: number, days: Array<{ day: number, coin: number, video_coin: number, current: boolean, received: boolean, video_received: boolean }> }} detail
   */
  updateCheckin(detail) {
    const continuousDays = (detail && typeof detail.continuous_days === "number") ? detail.continuous_days : 0;
    const pill = document.getElementById("tc-checkin-pill");
    if (pill) {
      pill.textContent = `${continuousDays}/7 Days`;
    }

    const container = document.getElementById("tc-checkin-days-container");
    if (!container) return;

    if (!detail || !Array.isArray(detail.days) || detail.days.length === 0) {
      container.innerHTML = [1, 2, 3, 4, 5, 6, 7].map((day) => {
        const isDay7 = day === 7;
        const dayClass = isDay7 ? "tc-checkin-day tc-checkin-day--super" : "tc-checkin-day";
        const labelClass = isDay7 ? "tc-checkin-label tc-checkin-label--super" : "tc-checkin-label";
        const dotContent = isDay7
          ? `<div class="tc-checkin-dot tc-checkin-dot--super"><img src="./icons/card_giftcard.svg" alt="gift" class="tc-checkin-super-icon-img"><span class="tc-checkin-super-reward">+0</span></div>`
          : `<div class="tc-checkin-dot tc-checkin-dot--reward">+0</div>`;
        return `<div class="${dayClass}" data-day="${day}">${dotContent}<span class="${labelClass}">Day ${day}</span></div>`;
      }).join("");
      if (this.elements.signinTimerBtn) {
        this.elements.signinTimerBtn.disabled = true;
        this.elements.signinTimerBtn.classList.remove("tc-secondary-btn", "is-completed");
        const span = this.elements.signinTimerBtn.querySelector("span");
        if (span) span.textContent = "Check-in Now";
      }
      return;
    }

    const superReward = detail.days[6]?.coin ?? 0;
    const daysList = detail.days.slice(0, 7);

    container.innerHTML = daysList
      .map((d, idx) => {
        const isDay7 = d.day === 7 || idx === 6;
        const isDone = d.day <= continuousDays;
        let dotContent = "";
        let dayClass = "tc-checkin-day";
        let labelClass = "tc-checkin-label";

        if (isDay7) {
          dayClass += " tc-checkin-day--super";
          labelClass += " tc-checkin-label--super";
          const amount = isDone ? d.coin : superReward;
          dotContent = `<div class="tc-checkin-dot tc-checkin-dot--super">
            <img src="./icons/card_giftcard.svg" alt="gift" class="tc-checkin-super-icon-img">
            <span class="tc-checkin-super-reward">+${amount}</span>
          </div>`;
        } else if (isDone) {
          dayClass += " tc-checkin-day--done";
          dotContent = `<div class="tc-checkin-dot"><span>✓</span><span>+${d.coin}</span></div>`;
        } else {
          dotContent = `<div class="tc-checkin-dot tc-checkin-dot--reward">+${d.coin}</div>`;
        }

        return `<div class="${dayClass}" data-day="${d.day}">${dotContent}<span class="${labelClass}">Day ${d.day}</span></div>`;
      })
      .join("");

    const signinBtn = this.elements.signinTimerBtn;
    if (signinBtn) {
      const today = daysList.find((d) => d.current === true);
      const received = !!today?.received;
      const videoReceived = !!today?.video_received;
      const allCompleted = received && videoReceived;
      const canCheckin = !allCompleted;
      signinBtn.disabled = !canCheckin;
      if (allCompleted) {
        // Use the exact same completed style as daily video task button
        signinBtn.classList.add("tc-secondary-btn", "is-completed");
      } else {
        signinBtn.classList.remove("tc-secondary-btn", "is-completed");
      }
      const span = signinBtn.querySelector("span");
      if (span) span.textContent = canCheckin ? "Check-in Now" : "Completed";
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 看广告/领取按钮
    if (this.elements.btnWatchAd) {
      this.elements.btnWatchAd.addEventListener("click", () => {
        if (this.elements.btnWatchAd.disabled) return;
        this.config.onWatchAdClick();
      });
    }

    // 关闭广告按钮
    if (this.elements.adCloseBtn) {
      this.elements.adCloseBtn.addEventListener("click", () => {
        if (this.adWatchProgress < 100) {
          if (confirm("Close ad? You won't get coins if the ad isn't finished.")) {
            this.config.onAdCloseClick();
          }
        } else {
          this.config.onAdCloseClick();
        }
      });
    }

    // 提现/兑换按钮
    if (this.elements.withdrawBtn) {
      this.elements.withdrawBtn.addEventListener("click", () => {
        this.config.onWithdrawClick();
      });
    }

    // 签到按钮
    if (this.elements.signinTimerBtn) {
      this.elements.signinTimerBtn.addEventListener("click", () => {
        if (this.elements.signinTimerBtn.disabled) return;
        this.config.onSigninClick();
      });
    }

    // 签到成功弹框 - 仅领取基础奖励（关闭弹框）
    if (this.elements.signinDialogClaimBaseOnly) {
      this.elements.signinDialogClaimBaseOnly.addEventListener("click", () => {
        this.hideSigninDialog();
      });
    }

    // 签到成功弹框 - 看视频获取额外金币
    if (this.elements.signinDialogWatchBtn) {
      this.elements.signinDialogWatchBtn.addEventListener("click", () => {
        if (this.elements.signinDialogWatchBtn.disabled) return;
        this.hideSigninDialog();
        this.config.onSigninWatchVideoClick();
      });
    }
  }

  /**
   * 设置签到弹框“看视频”按钮 loading/禁用状态（防连点）
   */
  setSigninWatchLoading(loading) {
    if (!this.elements.signinDialogWatchBtn) return;
    this.elements.signinDialogWatchBtn.disabled = !!loading;
    if (loading) {
      this.elements.signinDialogWatchBtn.classList.add("tc-signin-watch-loading");
    } else {
      this.elements.signinDialogWatchBtn.classList.remove("tc-signin-watch-loading");
    }
  }
}
