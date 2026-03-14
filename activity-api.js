/**
 * 活动中心后端 API
 * 用于前后端联调：请求基础数据接口
 * 日志带 [ActivityWeb] 前缀，便于在 Android WebView 的 Logcat 中查看
 */
import * as logger from "./activity-logger.js";

const DEFAULT_BASE_URL = "http://10.0.33.63:8080";
const DEFAULT_APP_ID = "asdfjjshdsafj23h2";
const DEFAULT_APP_SECRET = "qerqwershdsafj23h2sdfaasdf";

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

  const reqInfo = {
    method: "GET",
    url,
    app_id: appId,
    app_secret: appSecret ? `${appSecret.slice(0, 4)}***` : "(未传)",
  };
  logger.log("[活动接口] 请求\n" + JSON.stringify(reqInfo, null, 2));

  const response = await fetch(url, { method: "GET" });
  const json = await response.json().catch(() => ({}));

  const resInfo = {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    body: json,
  };
  logger.log("[活动接口] 响应\n" + JSON.stringify(resInfo, null, 2));

  if (!response.ok) {
    throw new Error(json.message || `HTTP ${response.status}`);
  }

  return json;
}

/**
 * 签到
 * POST /api/v1/ops/activity/checkin
 * @param {Object} options - { baseUrl?, app_id?, app_secret? }
 * @returns {Promise<{ code: number, data?: Object, message?: string }>}
 */
export async function postCheckin(options = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const appId = options.app_id ?? DEFAULT_APP_ID;
  const appSecret = options.app_secret ?? DEFAULT_APP_SECRET;

  const url = `${baseUrl}/api/v1/ops/activity/checkin?app_id=${encodeURIComponent(appId)}&app_secret=${encodeURIComponent(appSecret)}`;

  const reqLog = {
    url,
    method: "POST",
    params: {
      app_id: appId,
      app_secret: appSecret ? `${String(appSecret).slice(0, 4)}***` : "(未传)",
    },
  };
  logger.log("[签到接口] 请求\n" + JSON.stringify(reqLog, null, 2));

  const response = await fetch(url, { method: "POST" });
  const json = await response.json().catch(() => ({}));

  const resLog = {
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    返回值: json,
  };
  logger.log("[签到接口] 返回值\n" + JSON.stringify(resLog, null, 2));

  if (!response.ok) {
    throw new Error(json.message || `HTTP ${response.status}`);
  }

  return json;
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

  const reqLog = { url, method: "POST", body: { video_id: body.video_id } };
  logger.log("[签到看视频接口] 请求\n" + JSON.stringify(reqLog, null, 2));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_id: body.video_id ?? "" }),
  });
  const json = await response.json().catch(() => ({}));

  const resLog = { url, status: response.status, statusText: response.statusText, ok: response.ok, 返回值: json };
  logger.log("[签到看视频接口] 返回值\n" + JSON.stringify(resLog, null, 2));

  return json;
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

  const reqLog = {
    method: "GET",
    url,
    params: { app_id: appId, app_secret: appSecret ? `${String(appSecret).slice(0, 4)}***` : "(未传)" },
  };
  logger.log("[获取充值信息接口] 请求\n" + JSON.stringify(reqLog, null, 2));

  const response = await fetch(url, { method: "GET" });
  const json = await response.json().catch(() => ({}));

  const resLog = {
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    返回值: json,
  };
  logger.log("[获取充值信息接口] 返回值\n" + JSON.stringify(resLog, null, 2));

  if (!response.ok) {
    throw new Error(json.message || `HTTP ${response.status}`);
  }

  return json;
}
