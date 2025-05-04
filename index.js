// The main script for the extension
// The following are examples of some basic extension functionality

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";
import { ToolManager } from "../../../../scripts/tool-calling.js";
import { appendMediaToMessage } from "../../../../script.js";
import { getRequestHeaders } from "../../../../script.js";
// 扩展名称和路径
const extensionName = "image-auto-generation";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// 插入类型常量
const INSERT_TYPE = {
    DISABLED: 'disabled',
    INLINE: 'inline',
    NEW_MESSAGE: 'new'
};

// 默认设置
const defaultSettings = {
    insertType: INSERT_TYPE.DISABLED
};

// 加载设置
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    
    updateUiFromSettings();
}

// 从设置更新UI
function updateUiFromSettings() {
    // 根据insertType设置开关状态
    $("#auto_generation").toggleClass('selected', extension_settings[extensionName].insertType !== INSERT_TYPE.DISABLED);
    
    if ($("#image_generation_insert_type").length) {
        $("#image_generation_insert_type").val(extension_settings[extensionName].insertType);
    }
}

// 创建设置页面
function createSettings() {
    const settingsHtml = `
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b data-i18n="Image Auto Generation">Image Auto Generation</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <div class="flex-container flexnowrap">
                <label for="image_generation_insert_type" class="flex1" data-i18n="Image Insert Type">Image Insert Type</label>
                <select id="image_generation_insert_type" class="flex1">
                    <option data-i18n="Insert In Current Message" value="${INSERT_TYPE.INLINE}">Insert In Current Message</option>
                    <option data-i18n="Create New Message" value="${INSERT_TYPE.NEW_MESSAGE}">Create New Message</option>
                    <option data-i18n="Disable" value="${INSERT_TYPE.DISABLED}">Disable</option>
                </select>
            </div>
        </div>
    </div>`;
    
    // 创建一个容器来存放设置，确保其正确显示在扩展设置面板中
    if (!$("#image_auto_generation_container").length) {
        $("#extensions_settings2").append('<div id="image_auto_generation_container" class="extension_container"></div>');
    }
    
    // 将设置添加到容器中
    $("#image_auto_generation_container").empty().append(settingsHtml);
    
    // 添加设置变更事件处理
    $('#image_generation_insert_type').on('change', function() {
        const newValue = $(this).val();
        extension_settings[extensionName].insertType = newValue;
        updateUiFromSettings();
        saveSettingsDebounced();
        console.log(`Image insert type changed to: ${newValue}`);
    });
    
    // 初始化选择框的值
    $('#image_generation_insert_type').val(extension_settings[extensionName].insertType);
    
    // 不再手动添加事件处理，让SillyTavern的系统处理drawer toggle
    
    updateUiFromSettings();
}

// 设置变更处理函数
function onExtensionButtonClick() {
    // 直接访问扩展设置面板
    const extensionsDrawer = $('#extensions-settings-button .drawer-toggle');
    
    // 如果抽屉是关闭的，点击打开它
    if ($('#rm_extensions_block').hasClass('closedDrawer')) {
        extensionsDrawer.trigger('click');
    }
    
    // 等待抽屉打开后滚动到我们的设置容器
    setTimeout(() => {
        // 找到我们的设置容器
        const container = $('#image_auto_generation_container');
        if (container.length) {
            // 滚动到设置面板位置
            $('#rm_extensions_block').animate({
                scrollTop: container.offset().top - $('#rm_extensions_block').offset().top + $('#rm_extensions_block').scrollTop()
            }, 500);
            
            // 使用SillyTavern原生的抽屉展开方式
            // 检查抽屉内容是否可见
            const drawerContent = container.find('.inline-drawer-content');
            const drawerHeader = container.find('.inline-drawer-header');
            
            // 只有当内容被隐藏时才触发展开
            if (drawerContent.is(':hidden') && drawerHeader.length) {
                // 直接使用原生点击事件触发，而不做任何内部处理
                drawerHeader.trigger('click');
            }
        }
    }, 500);
}

// 初始化扩展
$(function() {
    (async function() {
        const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
        $("#extensionsMenu").append(settingsHtml);
        // 修改点击事件，打开设置面板而不是切换状态
        $("#auto_generation").off('click').on("click", onExtensionButtonClick);
        
        loadSettings();
        
        // 创建设置
        createSettings();
        
        // 确保设置面板可见时，选择框的值是正确的
        $('#extensions-settings-button').on('click', function() {
            setTimeout(() => {
                if ($('#image_generation_insert_type').length) {
                    $('#image_generation_insert_type').val(extension_settings[extensionName].insertType);
                }
            }, 200);
        });
    })();
});

// 监听消息接收事件
eventSource.on(event_types.MESSAGE_RECEIVED, handleIncomingMessage);

async function handleIncomingMessage() {
    // 如果禁用了功能，直接返回
    if (extension_settings[extensionName].insertType === INSERT_TYPE.DISABLED) {
        return;
    }

    const context = getContext();
    const message = context.chat[context.chat.length - 1];
    
    // 检查是否是AI消息
    if (!message || message.is_user) {
        return;
    }

    // 使用正则表达式搜索 <img prompt="" /> 标签
    const imgTagRegex = /<img\s+prompt="([^"]*)"\s*\/?>/g;
    const matches = [...message.mes.matchAll(imgTagRegex)];

    if (matches.length > 0) {
        toastr.info(`Generating ${matches.length} images...`);
        try {
            const insertType = extension_settings[extensionName].insertType;
            
            if (insertType === INSERT_TYPE.INLINE) {
                // 在当前消息中插入图片
                // 初始化message.extra
                if (!message.extra) {
                    message.extra = {};
                }
                
                // 初始化image_swipes数组
                if (!Array.isArray(message.extra.image_swipes)) {
                    message.extra.image_swipes = [];
                }
                
                // 如果已有图片，添加到swipes
                if (message.extra.image && !message.extra.image_swipes.includes(message.extra.image)) {
                    message.extra.image_swipes.push(message.extra.image);
                }
                
                // 获取消息元素用于稍后更新
                const messageElement = $(`.mes[mesid="${context.chat.length - 1}"]`);
                
                // 处理每个匹配的图片标签
                for (let i = 0; i < matches.length; i++) {
                    const prompt = matches[i][1];
                    
                    // 使用 ToolManager 调用图片生成功能
                    const result = await ToolManager.invokeFunctionTool('GenerateImage', {
                        prompt: prompt,
                        quiet: 'true'
                    });
                    
                    let imageUrl = result;
                    if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
                        // 添加图片到swipes数组
                        message.extra.image_swipes.push(imageUrl);
                        
                        // 设置第一张图片为主图片，或更新为最新生成的图片
                        message.extra.image = imageUrl;
                        message.extra.title = prompt;
                        message.extra.inline_image = true;
                        
                        // 更新UI
                        appendMediaToMessage(message, messageElement);
                        
                        // 保存聊天记录
                        await context.saveChat();
                    }
                }
            } else if (insertType === INSERT_TYPE.NEW_MESSAGE) {
                // 在新的一条消息中插入图片
                for (let i = 0; i < matches.length; i++) {
                    const prompt = matches[i][1];
                    await ToolManager.invokeFunctionTool('GenerateImage', {
                        prompt: prompt
                    });
                }
            }
            
            toastr.success(`${matches.length} images generated successfully`);
        } catch (error) {
            toastr.error('Image generation error:', error);
            console.error('Image generation error:', error);
        }
    }
}
