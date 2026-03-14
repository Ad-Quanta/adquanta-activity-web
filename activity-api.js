/**
 * 活动中心后端 API
 * 用于前后端联调：请求基础数据接口
 */
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
  console.log("[活动接口] 请求\n" + JSON.stringify(reqInfo, null, 2));

  const response = await fetch(url, { method: "GET" });
  const json = await response.json().catch(() => ({}));

  const resInfo = {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    body: json,
  };
  console.log("[活动接口] 响应\n" + JSON.stringify(resInfo, null, 2));

  if (!response.ok) {
    throw new Error(json.message || `HTTP ${response.status}`);
  }

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

  const reqInfo = {
    method: "GET",
    url,
    app_id: appId,
    app_secret: appSecret ? `${appSecret.slice(0, 4)}***` : "(未传)",
  };
  console.log("[话费接口] 请求\n" + JSON.stringify(reqInfo, null, 2));

  const response = await fetch(url, { method: "GET" });
  const json = await response.json().catch(() => ({}));

  const resInfo = {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    body: json,
  };
  console.log("[话费接口] 响应\n" + JSON.stringify(resInfo, null, 2));

  if (!response.ok) {
    throw new Error(json.message || `HTTP ${response.status}`);
  }

  return json;
}
