import { getCharges } from "./activity-api.js";

/**
 * 金币兑换页面
 */
export class GoldCoinsExchange {
  constructor(config = {}) {
    this.config = {
      onExchangeSuccess: config.onExchangeSuccess || (() => {}),
      onExchangeFailed: config.onExchangeFailed || (() => {}),
      apiOptions: config.apiOptions || {},
    };

    // 当前用户金币（mock，可由活动接口同步）
    this.userGoldCoins = 750;

    // 话费选项（来自 /api/v1/ops/activity/charges，未加载则为 null）
    this.chargesOptions = null;

    // 兑换状态
    this.state = {
      mobile: "",
      operator: "China Mobile",
      amount: null,
      selectedCharge: null, // 接口返回的选项 { charges_id, amount, amount_text, spend_points, description }
    };

    // 无接口时的默认比例（1 元 = 100 金币）
    this.goldCoinsPerYuan = 100;

    // DOM 引用
    this.$ = {
      userGoldCoins: document.getElementById("userGoldCoins"),
      inputMobile: document.getElementById("inputMobile"),
      operatorGrid: document.getElementById("operatorGrid"),
      amountGrid: document.getElementById("amountGrid"),
      btnRedeem: document.getElementById("btnRedeem"),
      redeemSummary: document.getElementById("redeemSummary"),
      historyList: document.getElementById("historyList"),
    };
  }

  /**
   * 初始化页面
   */
  async init() {
    this.updateUserGoldCoinsView();
    this.initHistory();
    this.bindEvents();
    await this.loadCharges();
  }

  /**
   * 加载话费选项（/api/v1/ops/activity/charges），成功则用接口数据渲染面额
   */
  async loadCharges() {
    try {
      const res = await getCharges(this.config.apiOptions);
      if (res.code === 200 && res.data && Array.isArray(res.data.options) && res.data.options.length > 0) {
        this.chargesOptions = res.data.options;
        this.renderAmountGrid(res.data.options);
        console.log("[话费接口] 使用话费选项\n" + JSON.stringify(res.data, null, 2));
      }
    } catch (e) {
      console.warn("[话费接口] 请求失败，使用默认面额", e?.message || e);
    }
  }

  /**
   * 用接口返回的 options 渲染面额按钮
   */
  renderAmountGrid(options) {
    if (!this.$.amountGrid) return;
    this.$.amountGrid.innerHTML = options
      .map(
        (o) =>
          `<button class="redeem-amount-btn" data-amount="${o.amount}" data-points="${o.spend_points}" data-charges-id="${o.charges_id}">${o.amount_text}</button>`
      )
      .join("");
    this.state.amount = null;
    this.state.selectedCharge = null;
    this.updateRedeemState();
  }

  /**
   * 更新金币显示
   */
  updateUserGoldCoinsView() {
    if (this.$.userGoldCoins) {
      this.$.userGoldCoins.textContent = this.userGoldCoins;
    }
  }

  /**
   * 初始化 mock 兑换记录（可选）
   */
  initHistory() {
    if (!this.$.historyList) return;
    this.$.historyList.innerHTML = "";
  }

  /**
   * 计算本次所需金币（优先用接口选项的 spend_points，否则用金额×比例）
   */
  getRequiredGoldCoins() {
    if (this.state.selectedCharge && typeof this.state.selectedCharge.spend_points === "number") {
      return this.state.selectedCharge.spend_points;
    }
    if (!this.state.amount) return 0;
    return this.state.amount * this.goldCoinsPerYuan;
  }

  /**
   * 更新兑换按钮与摘要
   */
  updateRedeemState() {
    if (!this.$.btnRedeem || !this.$.redeemSummary) return;

    const goldCoins = this.getRequiredGoldCoins();
    const validMobile = this.state.mobile && this.state.mobile.length === 11;
    const hasAmount = !!this.state.amount;
    const canAfford = goldCoins > 0 && this.userGoldCoins >= goldCoins;

    if (validMobile && hasAmount) {
      const label = this.state.selectedCharge?.amount_text || `¥${this.state.amount}`;
      this.$.redeemSummary.textContent = `将使用 ${goldCoins} 金币，为 ${this.state.mobile} 充值 ${label}`;
    } else {
      this.$.redeemSummary.textContent = "请输入手机号并选择充值面额";
    }

    const canRedeem = validMobile && hasAmount && canAfford;
    this.$.btnRedeem.disabled = !canRedeem;
    if (canRedeem) {
      this.$.btnRedeem.classList.remove("redeem-primary-btn--disabled");
    } else {
      this.$.btnRedeem.classList.add("redeem-primary-btn--disabled");
    }
  }

  /**
   * 显示兑换确认弹窗
   */
  showExchangeModal() {
    const coins = this.getRequiredGoldCoins();
    if (!coins) return;

    const label = this.state.selectedCharge?.amount_text || `¥${this.state.amount}`;
    const product = {
      name: `话费充值 ${label}`,
      icon: "📱",
      points: coins,
      mobile: this.state.mobile,
      operator: this.state.operator,
    };

    this.selectedProduct = product;

    document.getElementById("previewIcon").textContent = product.icon;
    document.getElementById("previewName").textContent = product.name;
    document.getElementById("previewPoints").textContent = `需要 ${product.points} 积分`;
    document.getElementById("confirmPoints").textContent = product.points;
    document.getElementById("confirmName").textContent = `${product.mobile}`;

    document.getElementById("exchangeModal").style.display = "flex";
  }

  /**
   * 隐藏兑换确认弹窗
   */
  hideExchangeModal() {
    document.getElementById("exchangeModal").style.display = "none";
    this.selectedProduct = null;
  }

  /**
   * 执行兑换
   */
  async performExchange() {
    if (!this.selectedProduct) return;

    const product = this.selectedProduct;
    const coins = product.points;

    // 检查金币是否足够
    if (this.userGoldCoins < coins) {
      this.config.onExchangeFailed("金币不足，无法兑换");
      return;
    }

    try {
      await this.mockRedeemTopup(product);

      // 更新金币
      this.userGoldCoins -= coins;
      this.updateUserGoldCoinsView();

      // 写入历史记录（前端 mock）
      this.appendHistoryItem(product);

      // 隐藏弹窗
      this.hideExchangeModal();

      // 回调成功
      this.config.onExchangeSuccess(product);

      // 更新兑换按钮状态
      this.updateRedeemState();
    } catch (error) {
      this.config.onExchangeFailed("兑换失败，请重试");
    }
  }

  /**
   * 模拟话费充值 API
   */
  async mockRedeemTopup(product) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }

  /**
   * 追加一条兑换记录（前端）
   */
  appendHistoryItem(product) {
    if (!this.$.historyList) return;

    const item = document.createElement("div");
    item.className = "redeem-history-item";
    const now = new Date();
    const timeStr = now.toLocaleString();

    item.innerHTML = `
      <div class="redeem-history-icon">✓</div>
      <div class="redeem-history-main">
        <div class="redeem-history-title">话费充值 ${product.mobile}</div>
        <div class="redeem-history-subtitle">${timeStr}</div>
      </div>
      <div class="redeem-history-amount">
        -¥${this.state.amount}
        <div class="redeem-history-coins">${product.points} Coins</div>
      </div>
    `;

    this.$.historyList.prepend(item);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 关闭弹窗按钮
    document.getElementById("modalCloseBtn").addEventListener("click", () => {
      this.hideExchangeModal();
    });

    // 取消按钮
    document.getElementById("cancelBtn").addEventListener("click", () => {
      this.hideExchangeModal();
    });

    // 确认兑换按钮
    document.getElementById("confirmBtn").addEventListener("click", () => {
      this.performExchange();
    });

    // 点击弹窗外部关闭
    document.getElementById("exchangeModal").addEventListener("click", (e) => {
      if (e.target.id === "exchangeModal") {
        this.hideExchangeModal();
      }
    });

    // 手机号输入
    if (this.$.inputMobile) {
      this.$.inputMobile.addEventListener("input", (e) => {
        this.state.mobile = e.target.value.trim();
        this.updateRedeemState();
      });
    }

    // 运营商选择
    if (this.$.operatorGrid) {
      this.$.operatorGrid.addEventListener("click", (e) => {
        const btn = e.target.closest(".redeem-operator-btn");
        if (!btn) return;
        const operator = btn.getAttribute("data-operator");
        this.state.operator = operator;

        this.$.operatorGrid
          .querySelectorAll(".redeem-operator-btn")
          .forEach((el) => el.classList.remove("redeem-operator-btn--active"));
        btn.classList.add("redeem-operator-btn--active");

        this.updateRedeemState();
      });
    }

    // 面额选择
    if (this.$.amountGrid) {
      this.$.amountGrid.addEventListener("click", (e) => {
        const btn = e.target.closest(".redeem-amount-btn");
        if (!btn) return;
        const amount = Number(btn.getAttribute("data-amount"));
        const points = Number(btn.getAttribute("data-points"));
        const chargesId = btn.getAttribute("data-charges-id");
        this.state.amount = amount;
        this.state.selectedCharge =
          this.chargesOptions && chargesId
            ? this.chargesOptions.find((o) => o.charges_id === chargesId) || null
            : null;
        if (!this.state.selectedCharge && points) {
          this.state.selectedCharge = { amount, spend_points: points, amount_text: `¥${amount}` };
        }

        this.$.amountGrid
          .querySelectorAll(".redeem-amount-btn")
          .forEach((el) => el.classList.remove("redeem-amount-btn--active"));
        btn.classList.add("redeem-amount-btn--active");

        this.updateRedeemState();
      });
    }

    // 立即兑换按钮
    if (this.$.btnRedeem) {
      this.$.btnRedeem.addEventListener("click", () => {
        this.showExchangeModal();
      });
    }
  }
}
