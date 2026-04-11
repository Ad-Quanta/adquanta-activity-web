/**
 * ActivityBridgeHelper for Web 辅助库
 * 基于事件系统的统一接口设计
 * 版本：2.0.0
 *
 * 设计理念：
 * - 每个活动对应一个 activityId
 * - 一个活动对应一个 H5 页面
 * - 活动下有各种事件类型（激励视频、签到等）
 * - 不同 H5 页面可以自由组合使用这些事件
 */
(function(window) {
    'use strict';

    // 检测当前平台
    function detectPlatform() {
        if (window.Android) {
            return 'android';
        }
        if (window.webkit && window.webkit.messageHandlers) {
            return 'ios';
        }
        if (window.ios) {
            return 'ios';
        }
        return 'unknown';
    }

    // 统一的 ActivityBridgeHelper 对象
    window.ActivityBridgeHelper = window.ActivityBridgeHelper || {};

    // ========== 基础接口 ==========

    // 获取平台信息
    if (!window.ActivityBridgeHelper.getPlatform) {
        window.ActivityBridgeHelper.getPlatform = function() {
            return detectPlatform();
        };
    }

    // 检查 SDK 是否可用
    window.ActivityBridgeHelper.isAvailable = function() {
        return detectPlatform() !== 'unknown';
    };

    // 获取 SDK 版本
    if (!window.ActivityBridgeHelper.getVersion) {
        window.ActivityBridgeHelper.getVersion = function() {
            return '2.0.0';  // Web SDK 版本
        };
    }

    // ========== 活动业务接口 ==========

    /**
     * 初始化活动会话
     * @param {String} activityId - 活动ID
     * @param {String} code - 一次性code（可选）
     * @param {String} token - 用户token（可选）
     * @param {String} channelTag - 渠道标识（可选）
     * @returns {Promise<Object>} 会话信息
     */
    window.ActivityBridgeHelper.initActivity = function(activityId, code, token, channelTag) {
        return new Promise(function(resolve, reject) {
            try {
                code = code || '';
                token = token || '';
                channelTag = channelTag || '';

                var result = window.ActivityBridgeHelper.initActivity(activityId, code, token, channelTag);
                var session = typeof result === 'string' ? JSON.parse(result) : result;
                resolve(session);
            } catch (e) {
                console.error('[ActivityWeb] ActivityBridgeHelper.initActivity 调用失败:', e);
                reject(e);
            }
        });
    };

    /**
     * 追踪事件（用于数据统计）
     * @param {String} eventType - 事件类型
     * @param {Object} eventData - 事件数据
     * @returns {Promise<Object>} 追踪结果
     */
    window.ActivityBridgeHelper.trackEvent = function(eventType, eventData) {
        return new Promise(function(resolve, reject) {
            try {
                var eventDataStr = typeof eventData === 'string' ? eventData : JSON.stringify(eventData || {});
                var result = window.ActivityBridgeHelper.trackEvent(eventType, eventDataStr);
                var response = typeof result === 'string' ? JSON.parse(result) : result;
                resolve(response);
            } catch (e) {
                console.error('[ActivityWeb] ActivityBridgeHelper.trackEvent 调用失败:', e);
                reject(e);
            }
        });
    };

    /**
     * 获取会话信息
     * @returns {Object} 会话信息
     */
    window.ActivityBridgeHelper.getSession = function() {
        try {
            var result = window.ActivityBridgeHelper.getSession();
            return typeof result === 'string' ? JSON.parse(result) : result;
        } catch (e) {
            console.error('[ActivityWeb] ActivityBridgeHelper.getSession 调用失败:', e);
            return null;
        }
    };

    // ========== 统一事件系统（核心接口）==========

    /**
     * 活动事件类型常量（SDK 和 H5 端的约定）
     */
    window.ActivityBridgeHelper.EventType = {
        REWARD_AD: 'reward_ad'  // 激励视频广告
    };

    /**
     * 统一的事件触发接口（核心方法）
     *
     * 使用方式：
     * ActivityBridgeHelper.triggerEvent(ActivityBridgeHelper.EventType.REWARD_AD, { taskId: 'xxx' })
     *
     * @param {String} eventType - 事件类型（使用 ActivityBridgeHelper.EventType 常量）
     * @param {Object} eventData - 事件数据（可选）
     * @returns {Promise<Object>} 触发结果
     */
    window.ActivityBridgeHelper.triggerEvent = function(eventType, eventData) {
        return new Promise(function(resolve, reject) {
            try {
                var eventDataStr = typeof eventData === 'string' ? eventData : JSON.stringify(eventData || {});
                var result = window.ActivityBridgeHelper.triggerEvent(eventType, eventDataStr);
                var response = typeof result === 'string' ? JSON.parse(result) : result;
                resolve(response);
            } catch (e) {
                console.error('[ActivityWeb] ActivityBridgeHelper.triggerEvent 调用失败:', e);
                reject(e);
            }
        });
    };

    /**
     * 监听活动事件完成回调（统一的事件完成回调）
     * @param {Function} callback - 回调函数
     */
    window.ActivityBridgeHelper.onActivityEventCompleted = function(callback) {
        if (typeof callback === 'function') {
            var originalCallback = window.onActivityEventCompleted;
            window.onActivityEventCompleted = function(data) {
                if (originalCallback) {
                    originalCallback(data);
                }
                callback(data);
            };
        }
    };

})(window);
