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
      btnSpinEntry: document.getElementById("btn-spin-entry"),
      adOverlay: document.getElementById("adOverlay"),
      adProgress: document.getElementById("adProgress"),
      adProgressText: document.getElementById("adProgressText"),
      adCloseBtn: document.getElementById("adCloseBtn"),
      spinWheelModal: document.getElementById("spinWheelModal"),
      spinWheelClose: document.getElementById("spinWheelClose"),
      spinWheelDisk: document.getElementById("spinWheelDisk"),
      spinWheelSpinBtn: document.getElementById("spinWheelSpinBtn"),
      spinWheelSubtitle: document.getElementById("spinWheelSubtitle"),
      spinRewardModal: document.getElementById("spinRewardModal"),
      spinRewardClose: document.getElementById("spinRewardClose"),
      spinRewardCoins: document.getElementById("spinRewardCoins"),
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
      onSpinWheelOpen: config.onSpinWheelOpen || (() => {}),
      onSpinRequest: config.onSpinRequest || (async () => ({ ok: false })),
      onClaimAdClick: config.onClaimAdClick || (() => {}),
      onAdCloseClick: config.onAdCloseClick || (() => {}),
      onWithdrawClick: config.onWithdrawClick || (() => {}),
      onSigninClick: config.onSigninClick || (() => {}),
      onSigninWatchVideoClick: config.onSigninWatchVideoClick || (() => {}),
      ...config,
    };

    this.adWatchProgress = 0;
    this.adWatchInterval = null;
    this.dailySpinLimit = 5;
    this.spinPrizePool = [10, 20, 30, 50, 100, 150, 200, 10];
    this.currentSpinAvailable = this.loadSpinAvailableState();
    // Avoid showing a "0 / 0" placeholder flicker before the first updateTasks() run.
    const progressVideos = document.getElementById("ad-progress-videos");
    if (progressVideos) progressVideos.textContent = "0 Spins";
    // Turntable bottom-button state machine:
    // - needsWatch=true  => show "Watch to Spin/Watch to Spin Again"
    // - needsWatch=false => show "Spin Now" and allow wheel spin
    this._turntableNeedsWatch = true;
    this.spinRotation = 0;
    this._spinInFlight = false;
    this._waitingAdForSpin = false;
  }

  /** 将展示金额映射到转盘扇区（优先精确匹配，找不到再取最近） */
  _sectorIndexForPrize(prize) {
    const p = Number(prize);
    if (!Number.isFinite(p)) return 0;
    const pool = this.spinPrizePool;
    const exact = pool.findIndex((v) => Number(v) === p);
    if (exact >= 0) return exact;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < pool.length; i++) {
      const d = Math.abs(Number(pool[i]) - p);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  getTodaySpinAvailableKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `activity_turntable_available_${y}${m}${day}`;
  }

  getTodayTurntableDailyFirstShownKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `activity_turntable_daily_first_shown_${y}${m}${day}`;
  }

  isTodayTurntableDailyFirstShown() {
    try {
      return localStorage.getItem(this.getTodayTurntableDailyFirstShownKey()) === "1";
    } catch (_) {
      return false;
    }
  }

  markTodayTurntableDailyFirstShown() {
    try {
      localStorage.setItem(this.getTodayTurntableDailyFirstShownKey(), "1");
    } catch (_) {}
  }

  loadSpinAvailableState() {
    try {
      const raw = localStorage.getItem(this.getTodaySpinAvailableKey()) || "0";
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    } catch (_) {
      return 0;
    }
  }

  saveSpinAvailableState() {
    try {
      localStorage.setItem(this.getTodaySpinAvailableKey(), String(this.currentSpinAvailable));
    } catch (_) {}
  }

  clampSpinCountByLimit() {
    const limit = Number(this.dailySpinLimit || 0);
    if (limit >= 0) {
      this.currentSpinAvailable = Math.min(this.currentSpinAvailable, limit);
    }
    this.currentSpinAvailable = Math.max(0, Math.floor(this.currentSpinAvailable));
    this.saveSpinAvailableState();
  }

  addSpinChance(delta = 1) {
    const inc = Number(delta);
    if (!Number.isFinite(inc) || inc <= 0) return;
    this.currentSpinAvailable += Math.floor(inc);
    this.clampSpinCountByLimit();
  }

  consumeSpinChance(delta = 1) {
    const dec = Number(delta);
    if (!Number.isFinite(dec) || dec <= 0) return;
    this.currentSpinAvailable = Math.max(0, this.currentSpinAvailable - Math.floor(dec));
    this.saveSpinAvailableState();
  }

  renderTurntableFromCoins(rouletteCoins = []) {
    const list = Array.isArray(rouletteCoins) ? rouletteCoins.slice(0, 8) : [];
    while (list.length < 8) list.push(0);
    this.spinPrizePool = list.map((v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    });
    for (let i = 0; i < 8; i += 1) {
      const el = document.querySelector(`.tc-spin-label-${i + 1}`);
      if (el) el.textContent = String(this.spinPrizePool[i] ?? 0);
    }
  }

  syncTurntableFromTask(task) {
    if (!task) return;
    const limit = Number(task.daily_limit ?? this.dailySpinLimit);
    if (Number.isFinite(limit) && limit > 0) this.dailySpinLimit = limit;
    const coins = task?.roulette?.roulette_coins;
    this.renderTurntableFromCoins(coins);
    this.clampSpinCountByLimit();
  }

  isWaitingAdForSpin() {
    return this._waitingAdForSpin === true;
  }

  async handleRewardAdCompletedForSpin() {
    if (!this._waitingAdForSpin) return;
    this._waitingAdForSpin = false;
    this.addSpinChance(1);
    // After watching ad successfully, user must click Spin Now manually.
    this._turntableNeedsWatch = false;
    if (this.elements.spinWheelSpinBtn) {
      this.elements.spinWheelSpinBtn.disabled = false;
      this.elements.spinWheelSpinBtn.textContent = "Spin Now";
    }
    if (this.elements.spinWheelSubtitle) {
      this.elements.spinWheelSubtitle.textContent = "Tap Spin Now to spin your reward!";
    }
  }

  /**
   * Bottom button (tc-spin-now-btn) click handler:
   * - Watch mode: trigger reward ad and wait for SDK callback
   * - Spin mode: execute wheel rotation (consume 1 spin chance)
   */
  handleSpinWheelBottomClick() {
    const btn = this.elements.spinWheelSpinBtn;
    if (btn && btn.disabled) return;

    if (this._turntableNeedsWatch) {
      if (this._waitingAdForSpin) return;
      this._waitingAdForSpin = true;
      if (btn) btn.disabled = true;
      this.config.onWatchAdClick();
      return;
    }

    if (btn) btn.disabled = true;
    // Execute wheel rotation and consume 1 spin chance.
    this.spinWheel();
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
   * 更新日常视频任务 UI（type === 'video' 的 task.detail：today_watched, daily_limit, remain_count, coin, roulette）
   */
  updateTasks(tasks) {
    if (tasks.watchAd) {
      const task = tasks.watchAd;
      const completed = task.completed ?? 0;
      const r = task.roulette;
      const totalPool = r != null && typeof r.total_coins === "number" ? r.total_coins : 0;
      const earnedPool = r != null && typeof r.earned_coins === "number" ? r.earned_coins : null;
      const nextCoin = r != null && typeof r.next_coin === "number" ? r.next_coin : null;

      // `spinCount` 来自前端本地维护；但每个机会都必须由后端的 `today_watched`（completed）产生。
      // 例如你清空 DB 但本地缓存还在时，会出现本地 spinCount>0 而 completed=0 的情况。
      // 此处强制把本地 spinCount 上限钳制到 completed，确保默认显示正确。
      this.syncTurntableFromTask(task);
      this.currentSpinAvailable = Math.min(this.currentSpinAvailable, completed);
      this.saveSpinAvailableState();

      const rewardDisplay =
        nextCoin != null ? String(nextCoin) : String(task.reward ?? 0);
      if (this.elements.adRewardAmount) {
        this.elements.adRewardAmount.textContent = rewardDisplay;
      }
      if (this.elements.adTaskDesc) {
        const poolHint = totalPool > 0 && earnedPool != null ? ` Roulette pool: ${earnedPool} coins.` : "";
        // Daily limit is no longer fixed on the UI; show a generic description instead.
        this.elements.adTaskDesc.textContent = `Watch videos for spin chances(each video grants one spin).${poolHint}`;
      }
      const spunCount = Math.max(0, Number(completed) - Number(this.currentSpinAvailable || 0));
      const progressVideos = document.getElementById("ad-progress-videos");
      if (progressVideos) {
        progressVideos.textContent = `${spunCount} Spins`;
      }
      const earnedText = document.getElementById("ad-earned-text");
      if (earnedText) {
        const earnedCoins =
          earnedPool != null ? earnedPool : completed * (task.reward ?? 0);
        earnedText.textContent = `${earnedCoins} Coins`;
      }
      // Progress bar removed: we show actual "Spins Spun" instead.
      // Card bottom button: always opens the spin modal (no daily-limit "Completed" lockout).
      if (this.elements.btnWatchAd) {
        this.elements.btnWatchAd.classList.remove("can-claim", "is-completed");
        this.elements.btnWatchAd.textContent = "Watch & Spin";
        this.elements.btnWatchAd.disabled = false;
      }
      if (this.elements.btnSpinEntry) {
        // Entry button stays clickable; availability is enforced on "Spin Now".
        this.elements.btnSpinEntry.disabled = false;
        this.elements.btnSpinEntry.classList.remove("is-completed");
      }
    }
  }

  async showSpinWheel() {
    // Daily-first behavior: force "Watch to Spin" on the first modal open each day.
    const forceDailyFirst = !this.isTodayTurntableDailyFirstShown();
    if (forceDailyFirst) {
      this.markTodayTurntableDailyFirstShown();
      this._turntableNeedsWatch = true;
    }

    if (this.elements.spinWheelSpinBtn) {
      this.elements.spinWheelSpinBtn.disabled = false;
      this.elements.spinWheelSpinBtn.textContent = forceDailyFirst
        ? "Watch to Spin"
        : this._turntableNeedsWatch
          ? "Watch to Spin Again"
          : "Spin Now";
    }

    try {
      await this.config.onSpinWheelOpen();
    } catch (_) {}

    if (this.elements.spinWheelSubtitle) {
      this.elements.spinWheelSubtitle.textContent = this._turntableNeedsWatch
        ? "Tap Watch to Spin to watch a video and earn a spin chance."
        : "Tap Spin Now to spin your reward!";
    }

    if (this.elements.spinWheelModal) {
      this.elements.spinWheelModal.style.display = "flex";
    }
  }

  hideSpinWheel() {
    if (this.elements.spinWheelModal) {
      this.elements.spinWheelModal.style.display = "none";
    }
  }

  async spinWheel() {
    if (this._spinInFlight) return;
    if (this.currentSpinAvailable <= 0) {
      // Safety fallback: no spin chances locally, go back to watch mode.
      this._turntableNeedsWatch = true;
      this._waitingAdForSpin = true;
      if (this.elements.spinWheelSpinBtn) {
        this.elements.spinWheelSpinBtn.disabled = true;
        this.elements.spinWheelSpinBtn.textContent = "Watch to Spin Again";
      }
      this.config.onWatchAdClick();
      return;
    }
    this._spinInFlight = true;
    if (this.elements.spinWheelSpinBtn) {
      this.elements.spinWheelSpinBtn.disabled = true;
    }
    let prize = 0;
    try {
      const result = await this.config.onSpinRequest();
      if (!result?.ok) {
        this._spinInFlight = false;
        return;
      }
      prize = Number(result.coin ?? 0);
    } catch (_) {
      this._spinInFlight = false;
      return;
    }
    this.consumeSpinChance(1);
    const idx = this._sectorIndexForPrize(prize);
    const sectorDeg = 360 / this.spinPrizePool.length;
    // Always stop inside a sector (never on separator lines).
    const safeMarginDeg = 4;
    const maxOffsetDeg = Math.max(0, sectorDeg / 2 - safeMarginDeg);
    const randomOffsetDeg = (Math.random() * 2 - 1) * maxOffsetDeg;
    const targetDeg = 360 - (idx * sectorDeg + sectorDeg / 2 + randomOffsetDeg);
    this.spinRotation += 1800 + targetDeg;
    if (this.elements.spinWheelDisk) {
      this.elements.spinWheelDisk.style.transform = `rotate(${this.spinRotation}deg)`;
    }

    if (this.elements.btnSpinEntry) {
      this.elements.btnSpinEntry.disabled = false;
      this.elements.btnSpinEntry.classList.remove("is-completed");
    }
    const disk = this.elements.spinWheelDisk;
    let finished = false;
    const startAt = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    const minRewardMs = 1550; // Must be after wheel started; aligns with CSS 1.6s transition.
    let rewardTimer = null;
    const finish = () => {
      if (finished) return;
      const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      const elapsed = now - startAt;
      if (elapsed < minRewardMs) {
        const remaining = minRewardMs - elapsed;
        if (rewardTimer) return;
        rewardTimer = setTimeout(() => {
          rewardTimer = null;
          finish();
        }, remaining);
        return;
      }
      finished = true;
      this.showSpinRewardDialog(prize);
      this._spinInFlight = false;
    };

    // Prefer transitionend so reward modal is shown after wheel animation completes.
    if (disk && typeof disk.addEventListener === "function") {
      const onEnd = (e) => {
        // Only handle transform transition completion.
        if (!e || e.propertyName !== "transform") return;
        disk.removeEventListener("transitionend", onEnd);
        finish();
      };
      disk.addEventListener("transitionend", onEnd);
      // Fallback in case transitionend doesn't fire in some WebViews.
      setTimeout(() => {
        disk.removeEventListener("transitionend", onEnd);
        finish();
      }, 1850);
    } else {
      finish();
    }
  }

  showSpinRewardDialog(prize) {
    if (this.elements.spinRewardCoins) {
      this.elements.spinRewardCoins.textContent = `+${Number(prize || 0)}`;
    }
    if (this.elements.spinRewardModal) {
      this.elements.spinRewardModal.style.display = "flex";
    }
  }

  hideSpinRewardDialog() {
    if (this.elements.spinRewardModal) {
      this.elements.spinRewardModal.style.display = "none";
    }
  }

  handleSpinRewardDialogClosed() {
    // After the reward dialog is dismissed, user must watch ad again.
    this._turntableNeedsWatch = true;
    if (this.elements.spinWheelSpinBtn) {
      this.elements.spinWheelSpinBtn.disabled = false;
      this.elements.spinWheelSpinBtn.textContent = "Watch to Spin Again";
    }
    if (this.elements.spinWheelSubtitle) {
      this.elements.spinWheelSubtitle.textContent = "Tap Watch to Spin Again to watch a video and earn a spin chance.";
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
          ? `<div class="tc-checkin-dot tc-checkin-dot--super"><img src="/icons/card_giftcard.svg" alt="gift" class="tc-checkin-super-icon-img"><span class="tc-checkin-super-reward">+0</span></div>`
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
            <img src="/icons/card_giftcard.svg" alt="gift" class="tc-checkin-super-icon-img">
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
        this.showSpinWheel();
      });
    }
    // Intentionally disable the "play" entry click.
    // Only "Watch & Spin" should open the spin wheel modal.
    if (this.elements.btnSpinEntry) {
      this.elements.btnSpinEntry.style.pointerEvents = "none";
    }
    if (this.elements.spinWheelClose) {
      this.elements.spinWheelClose.addEventListener("click", () => this.hideSpinWheel());
    }
    if (this.elements.spinWheelModal) {
      this.elements.spinWheelModal.addEventListener("click", (e) => {
        if (e.target === this.elements.spinWheelModal) this.hideSpinWheel();
      });
    }
    if (this.elements.spinWheelSpinBtn) {
      this.elements.spinWheelSpinBtn.addEventListener("click", () => this.handleSpinWheelBottomClick());
    }
    if (this.elements.spinRewardClose) {
      this.elements.spinRewardClose.addEventListener("click", () => {
        this.hideSpinRewardDialog();
        this.handleSpinRewardDialogClosed();
      });
    }
    if (this.elements.spinRewardModal) {
      this.elements.spinRewardModal.addEventListener("click", (e) => {
        if (e.target === this.elements.spinRewardModal) {
          this.hideSpinRewardDialog();
          this.handleSpinRewardDialogClosed();
        }
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
