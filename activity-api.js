/**
 * 活动中心后端 API
 * 用于前后端联调：请求基础数据接口
 * 日志带 [ActivityWeb] 前缀，便于在 Android WebView 的 Logcat 中查看
 */
import * as logger from "./activity-logger.js";

const DEFAULT_BASE_URL = "http://10.0.33.63:8080";
const DEFAULT_APP_ID = "asdfjjshdsafj23h2";
const DEFAULT_APP_SECRET = "qerqwershdsafj23h2sdfaasdf";

function buildAuthHeaders(options = {}) {
  const token = options.token ?? "";
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function maskAuthHeaders(headers = {}) {
  const out = { ...headers };
  for (const k of Object.keys(out)) {
    if (k.toLowerCase() === "authorization" && typeof out[k] === "string") {
      const v = String(out[k]);
      out[k] = v.length > 18 ? `${v.slice(0, 12)}***${v.slice(-4)}` : "***";
    }
  }
  return out;
}

async function safeReadResponseBody(response) {
  // Clone so we can try json then fallback to text without consuming original
  const cloned = response.clone();
  const json = await cloned.json().catch(() => null);
  if (json !== null) return { kind: "json", value: json };
  const text = await response.clone().text().catch(() => "");
  return { kind: "text", value: text };
}

async function loggedFetch(apiName, url, init = {}) {
  const requestId = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const startedAt = Date.now();

  const headers = init.headers ? { ...init.headers } : {};
  const reqLog = {
    requestId,
    api: apiName,
    method: init.method || "GET",
    url,
    headers: maskAuthHeaders(headers),
    body: typeof init.body === "string" ? init.body : init.body ?? null,
  };
  logger.log(`[API] Request ${apiName}\n` + JSON.stringify(reqLog, null, 2));

  let response;
  try {
    response = await fetch(url, init);
  } catch (e) {
    const elapsedMs = Date.now() - startedAt;
    logger.error(`[API] Network error ${apiName} (${elapsedMs}ms)\n` + JSON.stringify({ requestId, message: e?.message || String(e) }, null, 2));
    throw e;
  }

  const elapsedMs = Date.now() - startedAt;
  const body = await safeReadResponseBody(response);
  const resLog = {
    requestId,
    api: apiName,
    elapsedMs,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    responseBody: body.value,
  };
  logger.log(`[API] Response ${apiName}\n` + JSON.stringify(resLog, null, 2));

  if (!response.ok) {
    const message = (body.kind === "json" && body.value && body.value.message) ? body.value.message : `HTTP ${response.status}`;
    throw new Error(message);
  }

  // Return json if possible; otherwise return { code: response.status, message: text }
  if (body.kind === "json") return body.value;
  return { code: response.status, message: body.value };
}

/**
 * 通过 code 换取 access_token（Web 端鉴权）
 * POST /api/v1/public/activity/auth/token
 * @param {Object} options - { baseUrl? }
 * @param {{ code: string }} body
 * @returns {Promise<{ code: number, data?: { success?: boolean, message?: string, access_token?: string, token_type?: string, expires_at?: number, expires_in?: number } }>}
 */
export async function postAuthToken(options = {}, body = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/public/activity/auth/token`;
  return loggedFetch("postAuthToken", url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: body.code ?? "" }),
  });
}

/**
 * 获取活动基础数据
 * @param {Object} options
 * @param {string} [options.baseUrl] - 接口 base URL，默认 http://10.0.33.63:8080
 * @param {string} [options.app_id]
 * @param {string} [options.app_secret]
 * @returns {Promise<{ code: number, data?: Object }>}
 */
export async function getActivityInfo(options = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const appId = options.app_id ?? DEFAULT_APP_ID;
  const appSecret = options.app_secret ?? DEFAULT_APP_SECRET;

  const url = `${baseUrl}/api/v1/ops/activity/info?app_id=${encodeURIComponent(appId)}&app_secret=${encodeURIComponent(appSecret)}`;
  return loggedFetch("getActivityInfo", url, { method: "GET", headers: { ...buildAuthHeaders(options) } });
}

/**
 * 签到
 * POST /api/v1/ops/activity/checkin
 * @param {Object} options - { baseUrl?, app_id?, app_secret? }
 * @param {{ type?: "base" | "triple" }} body
 * @returns {Promise<{ code: number, data?: Object, message?: string }>}
 */
export async function postCheckin(options = {}, body = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const appId = options.app_id ?? DEFAULT_APP_ID;
  const appSecret = options.app_secret ?? DEFAULT_APP_SECRET;

  const url = `${baseUrl}/api/v1/ops/activity/checkin?app_id=${encodeURIComponent(appId)}&app_secret=${encodeURIComponent(appSecret)}`;
  return loggedFetch("postCheckin", url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildAuthHeaders(options) },
    body: JSON.stringify({
      type: body.type ?? "base",
    }),
  });
}

/**
 * 签到看视频成功领取奖励
 * POST /api/v1/ops/activity/video（不传 app_id / app_secret）
 * @param {Object} options - { baseUrl? }
 * @param {{ video_id: string }} body - 看完视频后的视频 id
 * @returns {Promise<{ code: number, data?: { success: boolean, coin: number, total_coin: number, message: string, today_watched: number, remain_count: number }, message?: string }>}
 */
export async function postCheckinVideo(options = {}, body = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/ops/activity/video`;
  return loggedFetch("postCheckinVideo", url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildAuthHeaders(options) },
    body: JSON.stringify({ video_id: body.video_id ?? "" }),
  });
}

/**
 * 获取话费充值选项
 * GET /api/v1/ops/activity/charges
 * @param {Object} options - { baseUrl?, app_id?, app_secret? }
 * @returns {Promise<{ code: number, data?: { region, currency, options } }>}
 */
export async function getCharges(options = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const appId = options.app_id ?? DEFAULT_APP_ID;
  const appSecret = options.app_secret ?? DEFAULT_APP_SECRET;

  const url = `${baseUrl}/api/v1/ops/activity/charges?app_id=${encodeURIComponent(appId)}&app_secret=${encodeURIComponent(appSecret)}`;
  return loggedFetch("getCharges", url, { method: "GET", headers: { ...buildAuthHeaders(options) } });
}

/**
 * 充值下单（兑换话费）
 * POST /api/v1/ops/activity/charges
 * @param {Object} options - { baseUrl?, token? }
 * @param {{ charges_id: string, phone_number: string }} body
 * @returns {Promise<{ code: number, data?: any, message?: string }>}
 */
export async function postChargeRedeem(options = {}, body = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/ops/activity/charges`;
  return loggedFetch("postChargeRedeem", url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildAuthHeaders(options) },
    body: JSON.stringify({
      charges_id: body.charges_id ?? "",
      phone_number: body.phone_number ?? "",
    }),
  });
}

/**
 * 获取兑换记录
 * GET /api/v1/ops/activity/records
 * @param {Object} options - { baseUrl?, token? }
 * @returns {Promise<{ code: number, data?: Array }>}
 */
export async function getActivityRecords(options = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/ops/activity/records`;
  return loggedFetch("getActivityRecords", url, { method: "GET", headers: { ...buildAuthHeaders(options) } });
}
