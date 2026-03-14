/**
 * ADActivitySDK for Web 辅助库
 * 基于事件系统的统一接口设计
 * 版本：2.0.0
 * 
 * 设计理念：
 * - 每个活动对应一个 activityId
 * - 一个活动对应一个 H5 页面
 * - 活动下有各种事件类型（激励视频、红包雨、签到等）
 * - 不同 H5 页面可以自由组合使用这些事件
 */
(function(window) {
    'use strict';
    
    // 检测当前平台
    function detectPlatform() {
        if (window.ADActivitySDK && typeof window.ADActivitySDK.getPlatform === 'function') {
            return window.ADActivitySDK.getPlatform();
        }
        if (window.Android || (window.ADActivitySDK && window.ADActivitySDK.triggerEvent)) {
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
    
    // 统一的 ADActivitySDK 对象
    window.ADActivitySDK = window.ADActivitySDK || {};
    
    // ========== 基础接口 ==========
    
    // 获取平台信息
    if (!window.ADActivitySDK.getPlatform) {
        window.ADActivitySDK.getPlatform = function() {
            return detectPlatform();
        };
    }
    
    // 检查 SDK 是否可用
    window.ADActivitySDK.isAvailable = function() {
        return detectPlatform() !== 'unknown';
    };
    
    // 获取 SDK 版本
    if (!window.ADActivitySDK.getVersion) {
        window.ADActivitySDK.getVersion = function() {
            if (window.ADActivitySDK && typeof window.ADActivitySDK.getVersion === 'function') {
                return window.ADActivitySDK.getVersion();
            }
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
    window.ADActivitySDK.initActivity = function(activityId, code, token, channelTag) {
        return new Promise(function(resolve, reject) {
            if (!window.ADActivitySDK || typeof window.ADActivitySDK.initActivity !== 'function') {
                reject(new Error('ADActivitySDK.initActivity 不可用'));
                return;
            }
            
            try {
                code = code || '';
                token = token || '';
                channelTag = channelTag || '';
                
                var result = window.ADActivitySDK.initActivity(activityId, code, token, channelTag);
                var session = typeof result === 'string' ? JSON.parse(result) : result;
                resolve(session);
            } catch (e) {
                console.error('[ActivityWeb] ADActivitySDK.initActivity 调用失败:', e);
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
    window.ADActivitySDK.trackEvent = function(eventType, eventData) {
        return new Promise(function(resolve, reject) {
            if (!window.ADActivitySDK || typeof window.ADActivitySDK.trackEvent !== 'function') {
                reject(new Error('ADActivitySDK.trackEvent 不可用'));
                return;
            }
            
            try {
                var eventDataStr = typeof eventData === 'string' ? eventData : JSON.stringify(eventData || {});
                var result = window.ADActivitySDK.trackEvent(eventType, eventDataStr);
                var response = typeof result === 'string' ? JSON.parse(result) : result;
                resolve(response);
            } catch (e) {
                console.error('[ActivityWeb] ADActivitySDK.trackEvent 调用失败:', e);
                reject(e);
            }
        });
    };
    
    /**
     * 获取会话信息
     * @returns {Object} 会话信息
     */
    window.ADActivitySDK.getSession = function() {
        if (!window.ADActivitySDK || typeof window.ADActivitySDK.getSession !== 'function') {
            return null;
        }
        
        try {
            var result = window.ADActivitySDK.getSession();
            return typeof result === 'string' ? JSON.parse(result) : result;
        } catch (e) {
            console.error('[ActivityWeb] ADActivitySDK.getSession 调用失败:', e);
            return null;
        }
    };
    
    // ========== 统一事件系统（核心接口）==========
    
    /**
     * 活动事件类型常量（SDK 和 H5 端的约定）
     */
    window.ADActivitySDK.EventType = {
        REWARD_AD: 'reward_ad',        // 激励视频广告
        AD_CLOSED: 'ad_closed',        // 广告被关闭（未看完）
        RED_PACKET: 'red_packet',      // 红包雨
        SIGN_IN: 'sign_in',            // 签到
        LOTTERY_DRAW: 'lottery_draw',  // 抽奖
        CARD_FLIP: 'card_flip',        // 翻卡游戏
        TASK_COMPLETE: 'task_complete', // 任务完成
        CLAIM_REWARD: 'claim_reward'    // 领取奖励
    };
    
    /**
     * 统一的事件触发接口（核心方法）
     * 
     * 使用方式：
     * ADActivitySDK.triggerEvent(ADActivitySDK.EventType.REWARD_AD, { taskId: 'xxx' })
     * 
     * @param {String} eventType - 事件类型（使用 ADActivitySDK.EventType 常量）
     * @param {Object} eventData - 事件数据（可选）
     * @returns {Promise<Object>} 触发结果
     */
    window.ADActivitySDK.triggerEvent = function(eventType, eventData) {
        return new Promise(function(resolve, reject) {
            if (!window.ADActivitySDK || typeof window.ADActivitySDK.triggerEvent !== 'function') {
                reject(new Error('ADActivitySDK.triggerEvent 不可用'));
                return;
            }
            
            try {
                var eventDataStr = typeof eventData === 'string' ? eventData : JSON.stringify(eventData || {});
                var result = window.ADActivitySDK.triggerEvent(eventType, eventDataStr);
                var response = typeof result === 'string' ? JSON.parse(result) : result;
                resolve(response);
            } catch (e) {
                console.error('[ActivityWeb] ADActivitySDK.triggerEvent 调用失败:', e);
                reject(e);
            }
        });
    };
    
    /**
     * 监听活动事件完成回调（统一的事件完成回调）
     * @param {Function} callback - 回调函数
     */
    window.ADActivitySDK.onActivityEventCompleted = function(callback) {
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
    
    // SDK 初始化完成事件
    window.ADActivitySDK.ready = function(callback) {
        if (typeof callback === 'function') {
            if (window.ADActivitySDK.isAvailable()) {
                callback();
            } else {
                var checkInterval = setInterval(function() {
                    if (window.ADActivitySDK.isAvailable()) {
                        clearInterval(checkInterval);
                        callback();
                    }
                }, 100);
                
                setTimeout(function() {
                    clearInterval(checkInterval);
                    if (!window.ADActivitySDK.isAvailable()) {
                        console.warn('[ActivityWeb] ADActivitySDK: SDK 加载超时');
                    }
                }, 5000);
            }
        }
    };
    
    // 日志输出（可选，调试模式）
    window.ADActivitySDK.debug = false;
    window.ADActivitySDK.log = function() {
        if (window.ADActivitySDK.debug) {
            console.log.apply(console, ['[ActivityWeb]'].concat(Array.prototype.slice.call(arguments)));
        }
    };
    
})(window);
