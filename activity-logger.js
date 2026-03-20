/**
 * 统一 H5 日志，便于在 Android WebView 中通过 onConsoleMessage 在 Logcat 查看
 * 所有输出带 [ADActivityWeb] 前缀，可在 Android Studio 中按该关键字过滤
 */
const TAG = "[ADActivityWeb]";

function formatMessage(args) {
  if (args.length === 0) return TAG;
  if (args.length === 1 && typeof args[0] === "string") return TAG + " " + args[0];
  return TAG + " " + args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ");
}

function forwardToNative(level, msg) {
  if (typeof window === "undefined") return;

  const bridge = window.ActivityBridgeHelper;
  if (bridge && typeof bridge.log === "function") {
    try {
      bridge.log(level, msg);
    } catch (_) {}
  }
}

export function log(...args) {
  const msg = formatMessage(args);
  console.log(msg);
  forwardToNative("log", msg);
}

export function warn(...args) {
  const msg = formatMessage(args);
  console.warn(msg);
  forwardToNative("warn", msg);
}

export function error(...args) {
  const msg = formatMessage(args);
  console.error(msg);
  forwardToNative("error", msg);
}
