/**
 * Created by liangliang on 2016/11/20.
 */


function do_reply(parentid) {
    console.log(parentid);
    $("#id_parent_comment_id").val(parentid)
    $("#commentform").appendTo($("#div-comment-" + parentid));
    $("#reply-title").hide();
    $("#cancel_comment").show();
}

function cancel_reply() {
    $("#reply-title").show();
    $("#cancel_comment").hide();
    $("#id_parent_comment_id").val('')
    $("#commentform").appendTo($("#respond"));
}

NProgress.start();
NProgress.set(0.4);
//Increment
var interval = setInterval(function () {
    NProgress.inc();
}, 1000);
$(document).ready(function () {
    NProgress.done();
    clearInterval(interval);
});


/** 侧边栏回到顶部 */
var rocket = $('#rocket');

$(window).on('scroll', debounce(slideTopSet, 300));

function debounce(func, wait) {
    var timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    };
}

function slideTopSet() {
    var top = $(document).scrollTop();

    if (top > 200) {
        rocket.addClass('show');
    } else {
        rocket.removeClass('show');
    }
}

$(document).on('click', '#rocket', function (event) {
    rocket.addClass('move');
    $('body, html').animate({
        scrollTop: 0
    }, 800);
});
$(document).on('animationEnd', function () {
    setTimeout(function () {
        rocket.removeClass('move');
    }, 400);

});
$(document).on('webkitAnimationEnd', function () {
    setTimeout(function () {
        rocket.removeClass('move');
    }, 400);
});


window.onload = function () {
  var replyLinks = document.querySelectorAll(".comment-reply-link");
  for (var i = 0; i < replyLinks.length; i++) {
    replyLinks[i].onclick = function () {
      var pk = this.getAttribute("data-pk");
      do_reply(pk);
    };
  }
};

// $(document).ready(function () {
//     var form = $('#i18n-form');
//     var selector = $('.i18n-select');
//     selector.on('change', function () {
//         form.submit();
//     });
// });

// 鼠标星星聚集效果 - 优化版
$(document).ready(function() {
    // 优化配置参数，使星星跟随效果更自然流畅
    const config = {
        maxStars: 130,        // 适当减少总数，提高响应速度
        spawnRate: 0.9,       // 提高生成率，使星星跟随更密集
        starsPerMove: 3,      // 基础生成数量
        minDuration: 600,     // 更短的最小动画时间
        maxDuration: 800,     // 更短的最大动画时间
        moveThreshold: 1,     // 降低阈值，提高敏感度
        accelerationFactor: 0.8 // 鼠标加速时的星星生成因子
    };
    
    // 流星特效配置参数
    const meteorConfig = {
        maxMeteors: 5,         // 最大同时存在的流星数量
        minSpawnInterval: 500, // 最小生成间隔(毫秒)
        maxSpawnInterval: 15000, // 最大生成间隔(毫秒)
        minSpeed: 100,         // 最小速度(像素/秒)
        maxSpeed: 250,         // 最大速度(像素/秒)
        minLength: 10,         // 最小长度(像素)
        maxLength: 70,         // 最大长度(像素)
        minOpacity: 0.3,       // 最小透明度
        maxOpacity: 0.8,       // 最大透明度
        tailOpacityFactor: 0.5 // 尾部透明度衰减因子
    };
    
    // 从CSS变量中获取星星颜色，保持主题一致性
    function getComputedStyleProperty(propertyName, defaultValue) {
        return getComputedStyle(document.documentElement).getPropertyValue(propertyName) || defaultValue;
    }
    
    // 创建星星容器
    const starContainer = document.createElement('div');
    starContainer.id = 'mouse-stars';
    document.body.appendChild(starContainer);
    
    // 使用主题中定义的星星颜色，确保视觉一致性
    const starColors = [
        getComputedStyleProperty('--star-color-1', '#ffffff'),
        getComputedStyleProperty('--star-color-2', '#f5f5f5'),
        getComputedStyleProperty('--star-color-3', '#b0b0ff'),
        getComputedStyleProperty('--star-color-4', '#ffd700')
    ].map(color => color.trim());
    
    // 预创建星星池，避免实时DOM操作
    let starPool = [];
    let activeStars = 0;
    let animationFrameId = null;
    let starsToUpdate = [];
    let isPageVisible = true;
    
    // 流星相关变量
    let meteorPool = [];
    let activeMeteors = 0;
    let meteorAnimationFrameId = null;
    let meteorsToUpdate = [];
    let meteorSpawnTimer = null;
    
    // 批量创建星星元素，使用DocumentFragment优化DOM操作
    function initStarPool() {
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < config.maxStars; i++) {
            const star = document.createElement('div');
            star.className = 'mouse-star';
            star.style.position = 'fixed';
            star.style.borderRadius = '50%';
            star.style.pointerEvents = 'none';
            star.style.zIndex = '9999';
            star.style.opacity = '0';
            // 启用硬件加速
            star.style.willChange = 'transform, opacity';
            star.style.display = 'none';
            fragment.appendChild(star);
            starPool.push({
                element: star,
                available: true
            });
        }
        
        // 一次性添加到DOM，减少重排
        starContainer.appendChild(fragment);
    }
    
    // 初始化流星池
    function initMeteorPool() {
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < meteorConfig.maxMeteors; i++) {
            const meteor = document.createElement('div');
            meteor.className = 'meteor';
            meteor.style.position = 'fixed';
            meteor.style.pointerEvents = 'none';
            meteor.style.zIndex = '9997'; // 流星在星星下方，确保不会遮挡星星效果
            meteor.style.opacity = '0';
            meteor.style.display = 'none';
            meteor.style.willChange = 'transform, opacity'; // 启用硬件加速
            fragment.appendChild(meteor);
            meteorPool.push({
                element: meteor,
                available: true
            });
        }
        
        // 一次性添加到DOM，减少重排
        starContainer.appendChild(fragment);
    }
    
    // 初始化星星池
    initStarPool();
    
    // 初始化流星池
    initMeteorPool();
    
    // 从对象池获取星星（优化查找效率）
    function getStar() {
        // 使用数组索引而非pop/push，减少数组操作开销
        for (let i = 0; i < starPool.length; i++) {
            if (starPool[i].available) {
                starPool[i].available = false;
                starPool[i].element.style.display = 'block';
                activeStars++;
                return starPool[i].element;
            }
        }
        return null;
    }
    
    // 回收星星到对象池
    function recycleStar(star) {
        // 找到对应的星星对象并标记为可用
        for (let i = 0; i < starPool.length; i++) {
            if (starPool[i].element === star) {
                star.style.display = 'none';
                starPool[i].available = true;
                // 使用requestAnimationFrame更新activeStars，避免在动画帧中修改
                requestAnimationFrame(() => {
                    activeStars = Math.max(0, activeStars - 1);
                });
                break;
            }
        }
    }
    
    // 从对象池获取流星
    function getMeteor() {
        for (let i = 0; i < meteorPool.length; i++) {
            if (meteorPool[i].available) {
                meteorPool[i].available = false;
                meteorPool[i].element.style.display = 'block';
                activeMeteors++;
                return meteorPool[i].element;
            }
        }
        return null;
    }
    
    // 回收流星到对象池
    function recycleMeteor(meteor) {
        for (let i = 0; i < meteorPool.length; i++) {
            if (meteorPool[i].element === meteor) {
                meteor.style.display = 'none';
                meteorPool[i].available = true;
                requestAnimationFrame(() => {
                    activeMeteors = Math.max(0, activeMeteors - 1);
                });
                break;
            }
        }
    }
    
    // 流星动画函数
    function animateMeteor(meteor, startX, startY, angle, speed, length, opacity, duration) {
        // 计算流星运动的终点
        const travelDistance = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight) * 1.5;
        const endX = startX + Math.cos(angle) * travelDistance;
        const endY = startY + Math.sin(angle) * travelDistance;
        
        // 随机选择流星颜色，增加变化
        const colors = [
            { head: 'rgba(255, 255, 255, 1)', glow: 'rgba(255, 255, 255, 0.5)' },
            { head: 'rgba(255, 240, 200, 1)', glow: 'rgba(255, 240, 200, 0.5)' },
            { head: 'rgba(220, 240, 255, 1)', glow: 'rgba(220, 240, 255, 0.5)' }
        ];
        const colorChoice = colors[Math.floor(Math.random() * colors.length)];
        
        // 随机宽度，使流星大小有变化
        const width = Math.max(1, Math.random() * 2 + 1);
        
        // 计算旋转角度（将流星方向与运动方向对齐）
        const rotation = (angle * 180 / Math.PI) - 90; // 转换为CSS旋转角度
        
        // 改进的渐变效果，更自然的流星尾部
        const gradient = `linear-gradient(90deg, ${colorChoice.head} 0%, rgba(255,255,255,${opacity * 0.5}) 50%, rgba(255,255,255,${opacity * meteorConfig.tailOpacityFactor}) 70%, rgba(255,255,255,0) 100%)`;
        
        meteor.style.width = length + 'px';
        meteor.style.height = width + 'px'; // 随机厚度，使流星更自然
        meteor.style.background = gradient;
        meteor.style.borderRadius = '0 50% 50% 0'; // 改进的形状
        meteor.style.transform = `translate(${startX}px, ${startY}px) rotate(${rotation}deg)`;
        meteor.style.opacity = '1';
        
        // 添加发光效果，使流星更显眼
        meteor.style.boxShadow = `0 0 8px 2px ${colorChoice.glow}`;
        
        // 添加微小的闪烁效果（使用动画）
        meteor.style.animation = `meteor-flicker ${Math.random() * 0.3 + 0.2}s infinite alternate`;
        
        // 确保CSS动画存在
        if (!document.getElementById('meteor-css')) {
            const style = document.createElement('style');
            style.id = 'meteor-css';
            style.textContent = `
                @keyframes meteor-flicker {
                    0% { opacity: ${opacity * 0.9}; }
                    100% { opacity: ${opacity}; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 添加到动画队列
        meteorsToUpdate.push({
            meteor,
            startX,
            startY,
            endX,
            endY,
            opacity,
            startTime: performance.now(),
            duration
        });
        
        // 如果没有正在运行的动画循环，启动它
        if (!meteorAnimationFrameId && isPageVisible) {
            animateMeteorsBatch();
        }
    }
    
    // 批量处理流星动画 - 性能优化版本
    function animateMeteorsBatch() {
        if (!isPageVisible) {
            meteorAnimationFrameId = null;
            return;
        }
        
        // 如果没有流星需要更新，退出函数
        if (meteorsToUpdate.length === 0) {
            meteorAnimationFrameId = null;
            return;
        }
        
        const currentTime = performance.now();
        const meteorsToKeep = [];
        
        for (let i = 0; i < meteorsToUpdate.length; i++) {
            const meteorData = meteorsToUpdate[i];
            const meteor = meteorData.meteor;
            const timeElapsed = currentTime - meteorData.startTime;
            const progress = Math.min(timeElapsed / meteorData.duration, 1);
            
            if (progress < 1) {
                // 使用缓动函数使动画更自然
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                
                // 计算当前位置
                const currentX = meteorData.startX + (meteorData.endX - meteorData.startX) * easedProgress;
                const currentY = meteorData.startY + (meteorData.endY - meteorData.startY) * easedProgress;
                
                // 流星的透明度变化：开始较亮，结束时逐渐消失
                let currentOpacity;
                if (progress < 0.1) {
                    // 开始时淡入
                    currentOpacity = meteorData.opacity * (progress / 0.1);
                } else if (progress > 0.8) {
                    // 结束时淡出
                    currentOpacity = meteorData.opacity * ((1 - progress) / 0.2);
                } else {
                    // 中间保持亮度
                    currentOpacity = meteorData.opacity;
                }
                
                // 优化：只在必要时更新DOM（添加位置和透明度的变化阈值检查）
                const needsUpdate = !meteorData.lastX || 
                                  Math.abs(meteorData.lastX - currentX) > 0.5 || 
                                  Math.abs(meteorData.lastY - currentY) > 0.5 || 
                                  Math.abs((meteorData.lastOpacity || meteorData.opacity) - currentOpacity) > 0.01;
                
                if (needsUpdate) {
                    // 更新渐变背景
                    const gradient = `linear-gradient(90deg, rgba(255,255,255,${currentOpacity}) 0%, rgba(255,255,255,${currentOpacity * meteorConfig.tailOpacityFactor}) 70%, rgba(255,255,255,0) 100%)`;
                    
                    // 保存旋转角度，避免字符串解析
                    if (!meteorData.rotation) {
                        const transform = meteor.style.transform;
                        meteorData.rotation = transform.includes('rotate') ? 
                                             transform.split('rotate(')[1].split(')')[0] : 
                                             '0deg';
                    }
                    
                    // 批量更新样式，减少重绘
                    meteor.style.background = gradient;
                    meteor.style.opacity = currentOpacity.toString();
                    meteor.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${meteorData.rotation})`;
                    
                    // 记录最后位置和透明度，用于下一次比较
                    meteorData.lastX = currentX;
                    meteorData.lastY = currentY;
                    meteorData.lastOpacity = currentOpacity;
                }
                
                meteorsToKeep.push(meteorData);
            } else {
                // 动画完成，回收流星
                recycleMeteor(meteor);
            }
        }
        
        // 更新需要继续动画的流星列表
        meteorsToUpdate = meteorsToKeep;
        
        // 继续批量动画
        if (meteorsToUpdate.length > 0 && isPageVisible) {
            meteorAnimationFrameId = requestAnimationFrame(animateMeteorsBatch);
        } else {
            meteorAnimationFrameId = null;
        }
    }
    
    // 优化的缓动函数
    function easeOutQuad(t) {
        return t * (2 - t);
    }
    
    // 批量动画处理函数 - 增加更自然的动画效果
    function animateStarsBatch() {
        if (!isPageVisible || starsToUpdate.length === 0) {
            animationFrameId = null;
            return;
        }
        
        const currentTime = performance.now();
        const starsToKeep = [];
        
        // 批量处理所有星星的动画
        for (let i = 0; i < starsToUpdate.length; i++) {
            const starData = starsToUpdate[i];
            const star = starData.star;
            const timeElapsed = currentTime - starData.startTime;
            const progress = Math.min(timeElapsed / starData.duration, 1);
            
            if (progress < 1) {
                // 使用更自然的缓动函数
                let easeProgress;
                // 开始时慢，中间快，结束时慢
                if (progress < 0.5) {
                    easeProgress = 2 * progress * progress;
                } else {
                    easeProgress = -1 + (4 - 2 * progress) * progress;
                }
                
                // 计算当前位置和样式
                const translateX = starData.startX + (starData.targetX - starData.startX) * easeProgress;
                const translateY = starData.startY + (starData.targetY - starData.startY) * easeProgress;
                
                // 偏移量随着进度逐渐减少，使星星最终准确聚集到目标点
                const offsetFactor = Math.pow(1 - progress, 1.5); // 指数衰减
                const randomOffsetX = starData.xOffset * offsetFactor;
                const randomOffsetY = starData.yOffset * offsetFactor;
                
                // 缩放效果更加自然：先变大再稍微变小
                let scale;
                if (progress < 0.3) {
                    scale = 1 + 0.3 * (progress / 0.3); // 前30%时间放大到1.3
                } else {
                    scale = 1.3 - 0.4 * ((progress - 0.3) / 0.7); // 后70%时间缩小到0.9
                }
                
                // 添加微妙的闪烁效果
                const flicker = 1 + starData.opacityVariation * Math.sin(progress * Math.PI * 5);
                
                // 统一设置transform属性
                star.style.transform = `translate(${translateX + randomOffsetX}px, ${translateY + randomOffsetY}px) scale(${scale})`;
                star.style.opacity = ((1 - easeProgress * 0.4) * flicker).toString();
                
                // 保留未完成的星星
                starsToKeep.push(starData);
            } else {
                // 动画完成，回收星星
                recycleStar(star);
            }
        }
        
        // 更新需要继续动画的星星列表
        starsToUpdate = starsToKeep;
        
        // 继续批量动画
        if (starsToUpdate.length > 0) {
            animationFrameId = requestAnimationFrame(animateStarsBatch);
        } else {
            animationFrameId = null;
        }
    }
    
    // 优化的星星动画函数 - 增强自然跟随效果
    function animateStar(star, startX, startY, targetX, targetY, size, color, duration) {
        // 基于距离的偏移量，距离越远偏移越大
        const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
        const offsetMultiplier = Math.min(distance / 50, 2); // 最大2倍偏移
        const xOffset = (Math.random() - 0.5) * 15 * offsetMultiplier;
        const yOffset = (Math.random() - 0.5) * 15 * offsetMultiplier;
        
        // 为星星添加微妙的闪烁效果
        const opacityVariation = 0.1 + Math.random() * 0.3;
        
        // 设置星星样式 - 更小但更明亮的星星
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.backgroundColor = color;
        star.style.boxShadow = `0 0 ${size * 2.5}px ${size * 0.5}px ${color}dd`; // 调整阴影为更柔和的光晕
        
        // 添加到动画队列
        starsToUpdate.push({
            star,
            startX,
            startY,
            targetX,
            targetY,
            xOffset,
            yOffset,
            opacityVariation,
            startTime: performance.now(),
            duration
        });
        
        // 如果没有正在运行的动画循环，启动它
        if (!animationFrameId && isPageVisible) {
            animateStarsBatch();
        }
    }
    
    // 记录上一次鼠标位置，用于计算移动距离
    let lastMouseX = 0;
    let lastMouseY = 0;
    let isInitialized = false;
    
    // 记录鼠标速度
    let mouseSpeed = 0;
    let lastTime = 0;
    
    // 鼠标移动处理函数（实时生成星星）
    function handleMouseMove(e) {
        // 页面不可见时不生成星星
        if (!isPageVisible) return;
        
        const currentTime = performance.now();
        
        // 初始化上次位置
        if (!isInitialized) {
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            lastTime = currentTime;
            isInitialized = true;
            return;
        }
        
        // 计算鼠标移动距离
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 计算时间差和速度
        const timeDiff = Math.max(currentTime - lastTime, 1); // 避免除以零
        const currentSpeed = distance / timeDiff; // 像素/毫秒
        
        // 平滑速度计算
        mouseSpeed = mouseSpeed * 0.7 + currentSpeed * 0.3;
        
        // 只有当鼠标移动超过阈值时才生成星星
        if (distance < config.moveThreshold) {
            // 更新位置，但不生成星星
            lastMouseX = e.pageX;
            lastMouseY = e.pageY;
            lastTime = currentTime;
            return;
        }
        
        // 更新上次位置和时间
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        lastTime = currentTime;
        
        // 根据鼠标速度和距离调整星星生成数量
        // 速度越快，生成的星星越多
        const speedFactor = Math.min(mouseSpeed * 50, 3); // 速度因子，最高3倍
        const scaledStarsPerMove = Math.min(
            config.starsPerMove + 
            Math.floor(distance / 25) + 
            Math.floor(config.accelerationFactor * speedFactor * distance),
            10 // 适当提高上限以增强快速移动时的效果
        );
        
        // 快速移动时降低生成随机性，确保视觉效果
        const adjustedSpawnRate = Math.min(config.spawnRate + (mouseSpeed * 5), 1);
        if (Math.random() > adjustedSpawnRate) return;
        
        // 根据鼠标速度调整每帧生成的星星数量
        const maxStarsThisFrame = mouseSpeed > 0.2 ? 4 : 3; // 快速移动时每帧最多生成4个星星
        const starsThisFrame = Math.min(scaledStarsPerMove, maxStarsThisFrame);
        
        for (let i = 0; i < starsThisFrame; i++) {
            // 检查星星池是否已满
            if (activeStars >= config.maxStars * 0.85) break; // 稍微放松限制
            
            const star = getStar();
            if (!star) break;
            
            // 根据鼠标速度调整星星大小：快速移动时星星更小更密集
            const baseSize = mouseSpeed > 0.15 ? 0.4 : 0.5; // 快速移动时基础尺寸更小
            const size = Math.random() * 0.15 + baseSize;
            const color = starColors[Math.floor(Math.random() * starColors.length)];
            
            // 目标位置（调整为星星中心）
            const targetX = e.clientX - size / 2;
            const targetY = e.clientY - size / 2;
            
            // 根据鼠标移动方向优化初始位置计算
            // 星星主要从鼠标移动的反方向生成，增强跟随感
            const mainAngle = Math.atan2(dy, dx) + Math.PI; // 反方向
            const angleVariation = (Math.random() - 0.5) * Math.PI * 0.7; // ±63度的变化
            const finalAngle = mainAngle + angleVariation;
            
            // 鼠标速度越快，初始距离越远
            const baseDistance = 5;
            const speedDistance = Math.min(mouseSpeed * 50, 10); // 速度相关距离，最高30px
            const distanceFromTarget = baseDistance + speedDistance + Math.random() * 10;
            
            const startX = targetX + Math.cos(finalAngle) * distanceFromTarget;
            const startY = targetY + Math.sin(finalAngle) * distanceFromTarget;
            
            // 设置初始状态
            star.style.transform = `translate(${startX}px, ${startY}px) scale(${1 + Math.random() * 0.2})`;
            star.style.opacity = (0.8 + Math.random() * 0.2).toString();
            
            // 根据速度调整动画持续时间：快速移动时星星追赶更快
            const speedDurationFactor = Math.max(0.5, 1 - mouseSpeed * 0.8);
            const duration = (Math.random() * (config.maxDuration - config.minDuration) + config.minDuration) * speedDurationFactor;
            
            // 启动动画
            animateStar(star, startX, startY, targetX, targetY, size, color, duration);
        }
    }
    
    // 直接绑定鼠标移动事件，实时生成星星
    $(document).mousemove(function(e) {
        handleMouseMove(e);
    });
    
    // 页面可见性变化处理 - 合并处理星星和流星动画
    document.addEventListener('visibilitychange', function() {
        isPageVisible = !document.hidden;
        
        if (isPageVisible) {
            // 页面可见时恢复动画
            if (starsToUpdate.length > 0 && !animationFrameId) {
                animateStarsBatch();
            }
            if (meteorsToUpdate.length > 0 && !meteorAnimationFrameId) {
                animateMeteorsBatch();
            }
            // 恢复流星生成调度
            if (!meteorSpawnTimer) {
                scheduleNextMeteor();
            }
        } else {
            // 页面不可见时完全停止所有动画和生成
            // 停止星星动画
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // 停止流星动画
            if (meteorAnimationFrameId) {
                cancelAnimationFrame(meteorAnimationFrameId);
                meteorAnimationFrameId = null;
            }
            
            // 完全暂停流星生成调度，确保页面不可见时不消耗资源
            if (meteorSpawnTimer) {
                clearTimeout(meteorSpawnTimer);
                meteorSpawnTimer = null;
            }
        }
    });
    
    // 生成流星函数 - 性能优化版本
    function spawnMeteor() {
        // 检查是否可以生成流星
        if (activeMeteors >= meteorConfig.maxMeteors || !isPageVisible) {
            scheduleNextMeteor();
            return;
        }
        
        const meteor = getMeteor();
        if (!meteor) {
            scheduleNextMeteor();
            return;
        }
        
        // 保存流星生成状态信息，避免重复计算
        const meteorState = {
            angle: Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 6,
            speed: meteorConfig.minSpeed + Math.random() * (meteorConfig.maxSpeed - meteorConfig.minSpeed),
            length: meteorConfig.minLength + Math.random() * (meteorConfig.maxLength - meteorConfig.minLength),
            opacity: meteorConfig.minOpacity + Math.random() * (meteorConfig.maxOpacity - meteorConfig.minOpacity)
        };
        
        // 计算起始位置（确保流星从屏幕外进入）
        let startX, startY;
        
        // 随机决定流星从左侧还是顶部进入
        if (Math.random() > 0.5) {
            // 从左侧进入
            startX = -50;
            startY = Math.random() * window.innerHeight * 0.5;
        } else {
            // 从顶部进入
            startX = Math.random() * window.innerWidth * 0.5;
            startY = -50;
        }
        
        // 计算动画持续时间（距离越长，速度越慢，持续时间越长）
        const distance = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
        const duration = (distance / meteorState.speed) * 1000; // 转换为毫秒
        
        // 启动流星动画
        animateMeteor(meteor, startX, startY, meteorState.angle, meteorState.speed, meteorState.length, meteorState.opacity, duration);
        
        // 调度下一个流星
        scheduleNextMeteor();
    }
    
    // 调度下一个流星生成
    function scheduleNextMeteor() {
        // 清除现有的定时器
        if (meteorSpawnTimer) {
            clearTimeout(meteorSpawnTimer);
        }
        
        // 随机生成下一个流星的生成间隔
        const nextInterval = meteorConfig.minSpawnInterval + Math.random() * (meteorConfig.maxSpawnInterval - meteorConfig.minSpawnInterval);
        
        // 设置定时器
        meteorSpawnTimer = setTimeout(() => {
            spawnMeteor();
        }, nextInterval);
    }
    
    // 清理函数
    $(window).on('beforeunload', function() {
        // 停止动画
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        // 停止流星动画
        if (meteorAnimationFrameId) {
            cancelAnimationFrame(meteorAnimationFrameId);
        }
        
        // 清除流星生成定时器
        if (meteorSpawnTimer) {
            clearTimeout(meteorSpawnTimer);
        }
        
        // 清理资源
        starContainer.innerHTML = '';
        starPool = [];
        starsToUpdate = [];
        activeStars = 0;
        animationFrameId = null;
        meteorPool = [];
        meteorsToUpdate = [];
        activeMeteors = 0;
        meteorAnimationFrameId = null;
        meteorSpawnTimer = null;
    });
    

    
    // 启动流星生成
    scheduleNextMeteor();
});
