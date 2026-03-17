/**
 * 统一 H5 日志，便于在 Android WebView 中通过 onConsoleMessage 在 Logcat 查看
 * 所有输出带 [ActivityWeb] 前缀，可在 Android Studio 中按该关键字过滤
 */
const TAG = "[ActivityWeb]";

function formatMessage(args) {
  if (args.length === 0) return TAG;
  if (args.length === 1 && typeof args[0] === "string") return TAG + " " + args[0];
  return TAG + " " + args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ");
}

export function log(...args) {
  const msg = formatMessage(args);
  console.log(msg);
  if (typeof window !== "undefined" && window.ActivityBridgeHelper && typeof window.ActivityBridgeHelper.log === "function") {
    try {
      window.ActivityBridgeHelper.log("log", msg);
    } catch (_) {}
  }
}

export function warn(...args) {
  const msg = formatMessage(args);
  console.warn(msg);
  if (typeof window !== "undefined" && window.ActivityBridgeHelper && typeof window.ActivityBridgeHelper.log === "function") {
    try {
      window.ActivityBridgeHelper.log("warn", msg);
    } catch (_) {}
  }
}

export function error(...args) {
  const msg = formatMessage(args);
  console.error(msg);
  if (typeof window !== "undefined" && window.ActivityBridgeHelper && typeof window.ActivityBridgeHelper.log === "function") {
    try {
      window.ActivityBridgeHelper.log("error", msg);
    } catch (_) {}
  }
}
