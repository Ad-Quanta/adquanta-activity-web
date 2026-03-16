import { getActivityInfo, getCharges } from "./activity-api.js";
import * as logger from "./activity-logger.js";

function escapeHtml(s) {
  if (s == null) return "";
  const t = String(s);
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

    // 当前用户金币（未获取到服务端数据前缺省 0）
    this.userGoldCoins = 0;

    // 话费选项（来自 /api/v1/ops/activity/charges，未加载则为 null）
    this.chargesOptions = null;

    // 基础信息接口返回的 records（用于兑换记录列表与「查看全部」）
    this.records = [];
    this.showAllRecords = false;

    // 兑换状态
    this.state = {
      mobile: "",
      operator: "China Mobile",
      amount: null,
      selectedCharge: null, // 接口返回的选项 { charges_id, amount, amount_text, spend_coin, description }
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
      viewAllRecordsBtn: document.getElementById("viewAllRecords"),
    };
  }

  /**
   * 初始化页面
   */
  async init() {
    this.updateUserGoldCoinsView();
    this.initHistory();
    this.bindEvents();
    await this.loadActivityInfo();
    await this.loadCharges();
  }

  /**
   * 加载活动基础数据：wallet_info.coin 更新金币，data.records 渲染兑换记录
   */
  async loadActivityInfo() {
    try {
      const res = await getActivityInfo(this.config.apiOptions);
      if (res.code !== 200 || !res.data) return;

      const d = res.data;
      if (d.wallet_info != null && typeof d.wallet_info.coin === "number") {
        this.userGoldCoins = d.wallet_info.coin;
        this.updateUserGoldCoinsView();
      }
      if (Array.isArray(d.records) && d.records.length > 0) {
        this.records = d.records;
        this.renderRecords(this.records, this.showAllRecords);
      }
    } catch (e) {
      logger.warn("[活动接口] 兑换页拉取失败，使用默认", e?.message || e);
    }
  }

  /**
   * 格式化记录时间用于展示，如 "Mar 14, 2025 • 08:30"
   */
  formatRecordDate(isoStr) {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[m]} ${d}, ${y} • ${h}:${min}`;
  }

  /**
   * 用基础信息接口返回的 records 渲染兑换记录（仅兑换类型）
   * 默认只展示 2 条；点击「查看全部」后展示全部兑换数据，按钮变为「收起」
   * @param {Array} records - 接口 data.records
   * @param {boolean} [showAll=false] - true 时展示全部兑换记录，false 时只展示前 2 条
   */
  renderRecords(records, showAll = false) {
    if (!this.$.historyList) return;
    const redeemOnly = (records || []).filter(
      (r) => r.type === "spend" && r.business_type === "redeem"
    );
    const sorted = redeemOnly.slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const list = showAll ? sorted : sorted.slice(0, 2);

    this.$.historyList.innerHTML = list
      .map((r) => {
        const coinNum = Math.abs(Number(r.coin) || 0);
        return `
        <div class="redeem-history-item">
          <div class="redeem-history-icon">✓</div>
          <div class="redeem-history-main">
            <div class="redeem-history-title">${escapeHtml(r.description || "Redeem")}</div>
            <div class="redeem-history-subtitle">${escapeHtml(this.formatRecordDate(r.created_at))}</div>
          </div>
          <div class="redeem-history-amount">
            -${coinNum}
            <div class="redeem-history-coins">${coinNum} Coins</div>
          </div>
        </div>
      `;
      })
      .join("");

    if (this.$.viewAllRecordsBtn) {
      this.$.viewAllRecordsBtn.textContent = showAll ? "Collapse" : "View All";
      this.$.viewAllRecordsBtn.style.visibility = redeemOnly.length > 2 ? "visible" : "hidden";
    }
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
        logger.log("[获取充值信息] 使用接口数据渲染面额\n" + JSON.stringify(res.data, null, 2));
      }
    } catch (e) {
      logger.warn("[获取充值信息] 请求失败，使用默认面额", e?.message || e);
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
          `<button class="redeem-amount-btn" data-amount="${o.amount}" data-spend-coin="${o.spend_coin}" data-charges-id="${o.charges_id}">${o.amount_text}</button>`
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
   * 清空兑换记录列表（加载前占位，实际数据由 loadActivityInfo 拉取 data.records 后 renderRecords 渲染）
   */
  initHistory() {
    if (!this.$.historyList) return;
    this.$.historyList.innerHTML = "";
  }

  /**
   * 计算本次所需金币（优先用接口选项的 spend_coin，否则用金额×比例）
   */
  getRequiredGoldCoins() {
    if (this.state.selectedCharge && typeof this.state.selectedCharge.spend_coin === "number") {
      return this.state.selectedCharge.spend_coin;
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
      this.$.redeemSummary.textContent = `Use ${goldCoins} coins to top up ${label} for ${this.state.mobile}`;
    } else {
      this.$.redeemSummary.textContent = "Enter mobile number and select amount";
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
      name: `Top-up ${label}`,
      icon: "📱",
      points: coins,
      mobile: this.state.mobile,
      operator: this.state.operator,
    };

    this.selectedProduct = product;

    document.getElementById("previewIcon").textContent = product.icon;
    document.getElementById("previewName").textContent = product.name;
    document.getElementById("previewPoints").textContent = `${product.points} Coins required`;
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
      this.config.onExchangeFailed("Not enough coins to redeem");
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
      this.config.onExchangeFailed("Redemption failed, please try again");
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
        <div class="redeem-history-title">Top-up ${product.mobile}</div>
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
    // 查看全部 / 收起（仅兑换类型：默认 2 条，展开后全部）
    if (this.$.viewAllRecordsBtn) {
      this.$.viewAllRecordsBtn.addEventListener("click", () => {
        this.showAllRecords = !this.showAllRecords;
        this.renderRecords(this.records, this.showAllRecords);
      });
    }

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
        const spendCoin = Number(btn.getAttribute("data-spend-coin"));
        const chargesId = btn.getAttribute("data-charges-id");
        this.state.amount = amount;
        this.state.selectedCharge =
          this.chargesOptions && chargesId
            ? this.chargesOptions.find((o) => o.charges_id === chargesId) || null
            : null;
        if (!this.state.selectedCharge && spendCoin) {
          this.state.selectedCharge = { amount, spend_coin: spendCoin, amount_text: `$${amount}` };
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
