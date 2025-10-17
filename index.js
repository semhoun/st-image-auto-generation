// The main script for the extension
// The following are examples of some basic extension functionality

// You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext } from '../../../extensions.js';
// You'll likely need to import some other functions from the main script
import {
    saveSettingsDebounced,
    eventSource,
    event_types,
    updateMessageBlock,
} from '../../../../script.js';
import { appendMediaToMessage } from '../../../../script.js';
import { regexFromString } from '../../../utils.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';

// Extension name and path
const extensionName = 'st-image-auto-generation';
// /scripts/extensions/third-party
const extensionFolderPath = `/scripts/extensions/third-party/${extensionName}`;

// Insertion type constants
const INSERT_TYPE = {
    DISABLED: 'disabled',
    INLINE: 'inline',
    NEW_MESSAGE: 'new',
    REPLACE: 'replace',
};

/**
 * Escapes characters for safe inclusion inside HTML attribute values.
 * @param {string} value
 * @returns {string}
 */
function escapeHtmlAttribute(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Default settings
const defaultSettings = {
    insertType: INSERT_TYPE.DISABLED,
    promptInjection: {
        enabled: true,
        remove: false,
        prompt: `<image_generation>
You must insert a <pic prompt="example prompt"> at end of the reply. Prompts are used for stable diffusion image generation, based on the plot and character to output appropriate prompts to generate captivating images.
</image_generation>`,
        regex: '/<pic[^>]*\\sprompt="([^"]*)"[^>]*?>/g',
        position: 'deep_system', // deep_system, deep_user, deep_assistant
        depth: 0, // 0 means append to the end, >0 means count from the end backwards to the specified position
    },
};

// Update UI based on settings
function updateUI() {
    // Toggle switch state based on insertType
    $('#auto_generation').toggleClass(
        'selected',
        extension_settings[extensionName].insertType !== INSERT_TYPE.DISABLED,
    );

    // Update form elements only if they exist
    if ($('#image_generation_insert_type').length) {
        $('#image_generation_insert_type').val(
            extension_settings[extensionName].insertType,
        );
        $('#prompt_injection_enabled').prop(
            'checked',
            extension_settings[extensionName].promptInjection.enabled,
        );
        $('#prompt_generated_remove').prop(
            'checked',
            extension_settings[extensionName].promptInjection.remove,
        );
        $('#prompt_injection_text').val(
            extension_settings[extensionName].promptInjection.prompt,
        );
        $('#prompt_injection_regex').val(
            extension_settings[extensionName].promptInjection.regex,
        );
        $('#prompt_injection_position').val(
            extension_settings[extensionName].promptInjection.position,
        );
        $('#prompt_injection_depth').val(
            extension_settings[extensionName].promptInjection.depth,
        );
    }
}

// Load settings
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    // If settings are empty or missing necessary properties, use default settings
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    } else {
        // Ensure promptInjection object exists
        if (!extension_settings[extensionName].promptInjection) {
            extension_settings[extensionName].promptInjection =
                defaultSettings.promptInjection;
        } else {
            // Ensure all sub-properties of promptInjection exist
            const defaultPromptInjection = defaultSettings.promptInjection;
            for (const key in defaultPromptInjection) {
                if (
                    extension_settings[extensionName].promptInjection[key] ===
                    undefined
                ) {
                    extension_settings[extensionName].promptInjection[key] =
                        defaultPromptInjection[key];
                }
            }
        }

        // Ensure insertType property exists
        if (extension_settings[extensionName].insertType === undefined) {
            extension_settings[extensionName].insertType =
                defaultSettings.insertType;
        }
    }

    updateUI();
}

// Create settings page
async function createSettings(settingsHtml) {
    // Create a container to hold the settings, ensuring it is correctly displayed in the extension settings panel
    if (!$('#image_auto_generation_container').length) {
        $('#extensions_settings2').append(
            '<div id="image_auto_generation_container" class="extension_container"></div>',
        );
    }

    // Use the passed settingsHtml instead of fetching it again
    $('#image_auto_generation_container').empty().append(settingsHtml);

    // Add event handlers for settings changes
    $('#image_generation_insert_type').on('change', function () {
        const newValue = $(this).val();
        extension_settings[extensionName].insertType = newValue;
        updateUI();
        saveSettingsDebounced();
    });

    // Add event handlers for prompt injection settings
    $('#prompt_injection_enabled').on('change', function () {
        extension_settings[extensionName].promptInjection.enabled =
            $(this).prop('checked');
        saveSettingsDebounced();
    });

    $('#prompt_generated_remove').on('change', function () {
        extension_settings[extensionName].promptInjection.remove =
            $(this).prop('checked');
        saveSettingsDebounced();
    });

    $('#prompt_injection_text').on('input', function () {
        extension_settings[extensionName].promptInjection.prompt =
            $(this).val();
        saveSettingsDebounced();
    });

    $('#prompt_injection_regex').on('input', function () {
        extension_settings[extensionName].promptInjection.regex = $(this).val();
        saveSettingsDebounced();
    });

    $('#prompt_injection_position').on('change', function () {
        extension_settings[extensionName].promptInjection.position =
            $(this).val();
        saveSettingsDebounced();
    });

    // Depth setting event handler
    $('#prompt_injection_depth').on('input', function () {
        const value = parseInt(String($(this).val()));
        extension_settings[extensionName].promptInjection.depth = isNaN(value)
            ? 0
            : value;
        saveSettingsDebounced();
    });

    // Initialize setting values
    updateUI();
}

// Function to handle extension button click
function onExtensionButtonClick() {
    // Directly access the extensions settings panel
    const extensionsDrawer = $('#extensions-settings-button .drawer-toggle');

    // If the drawer is closed, click to open it
    if ($('#rm_extensions_block').hasClass('closedDrawer')) {
        extensionsDrawer.trigger('click');
    }

    // Wait for the drawer to open and then scroll to our settings container
    setTimeout(() => {
        // Find our settings container
        const container = $('#image_auto_generation_container');
        if (container.length) {
            // Scroll to the settings panel position
            $('#rm_extensions_block').animate(
                {
                    scrollTop:
                        container.offset().top -
                        $('#rm_extensions_block').offset().top +
                        $('#rm_extensions_block').scrollTop(),
                },
                500,
            );

            // Use SillyTavern's native drawer expansion method
            // Check if drawer content is visible
            const drawerContent = container.find('.inline-drawer-content');
            const drawerHeader = container.find('.inline-drawer-header');

            // Trigger expansion only if content is hidden
            if (drawerContent.is(':hidden') && drawerHeader.length) {
                // Directly use native click event to trigger without internal handling
                drawerHeader.trigger('click');
            }
        }
    }, 500);
}

// Initialize extension
$(function () {
    (async function () {
        // Fetch settings HTML (only once)
        const settingsHtml = await $.get(
            `${extensionFolderPath}/settings.html`,
        );

        // Add extension to menu
        $('#extensionsMenu')
            .append(`<div id="auto_generation" class="list-group-item flex-container flexGap5">
            <div class="fa-solid fa-robot"></div>
            <span data-i18n="Image Auto Generation">Image Auto Generation</span>
        </div>`);

        // Modify click event to open settings panel instead of toggling state
        $('#auto_generation').off('click').on('click', onExtensionButtonClick);

        await loadSettings();

        // Create settings - Pass the fetched HTML to createSettings
        await createSettings(settingsHtml);

        // Ensure that when the settings panel is visible, the values are correct
        $('#extensions-settings-button').on('click', function () {
            setTimeout(() => {
                updateUI();
            }, 200);
        });
    })();
});

// Get message role
function getMesRole() {
    // Ensure object path exists
    if (
        !extension_settings[extensionName] ||
        !extension_settings[extensionName].promptInjection ||
        !extension_settings[extensionName].promptInjection.position
    ) {
        return 'system'; // Default to system role
    }

    switch (extension_settings[extensionName].promptInjection.position) {
        case 'deep_system':
            return 'system';
        case 'deep_user':
            return 'user';
        case 'deep_assistant':
            return 'assistant';
        default:
            return 'system';
    }
}

// Listen to CHAT_COMPLETION_PROMPT_READY event to inject prompt
eventSource.on(
    event_types.CHAT_COMPLETION_PROMPT_READY,
    async function (eventData) {
        try {
            // Ensure settings object and promptInjection object both exist
            if (
                !extension_settings[extensionName] ||
                !extension_settings[extensionName].promptInjection ||
                !extension_settings[extensionName].promptInjection.enabled ||
                extension_settings[extensionName].insertType ===
                    INSERT_TYPE.DISABLED
            ) {
                return;
            }

            const prompt =
                extension_settings[extensionName].promptInjection.prompt;
            const depth =
                extension_settings[extensionName].promptInjection.depth || 0;
            const role = getMesRole();

            console.log(
                `[${extensionName}] Preparing to inject prompt: role=${role}, depth=${depth}`,
            );
            console.log(
                `[${extensionName}] Prompt content: ${prompt.substring(0, 50)}...`,
            );

            // Determine insertion position based on depth parameter
            if (depth === 0) {
                // Append to the end
                eventData.chat.push({ role: role, content: prompt });
                console.log(`[${extensionName}] Prompt added to the end of chat`);
            } else {
                // Insert from the end backwards
                eventData.chat.splice(-depth, 0, {
                    role: role,
                    content: prompt,
                });
                console.log(
                    `[${extensionName}] Prompt inserted into chat at position ${depth} from the end`,
                );
            }
        } catch (error) {
            console.error(`[${extensionName}] Prompt injection error:`, error);
            toastr.error(`Prompt injection error: ${error}`);
        }
    },
);

// Listen to message received event
eventSource.on(event_types.MESSAGE_RECEIVED, handleIncomingMessage);
async function handleIncomingMessage() {
    // Ensure settings object exists
    if (
        !extension_settings[extensionName] ||
        extension_settings[extensionName].insertType === INSERT_TYPE.DISABLED
    ) {
        return;
    }

    const context = getContext();
    const message = context.chat[context.chat.length - 1];

    // Check if it's an AI message
    if (!message || message.is_user) {
        return;
    }

    // Ensure promptInjection object and regex property exist
    if (
        !extension_settings[extensionName].promptInjection ||
        !extension_settings[extensionName].promptInjection.regex
    ) {
        console.error(`[${extensionName}] Prompt injection settings not properly initialized`);
        return;
    }

    // Use regex search
    const imgTagRegex = regexFromString(
        extension_settings[extensionName].promptInjection.regex,
    );
    // const testRegex = regexFromString(extension_settings[extensionName].promptInjection.regex);
    let matches;
    if (imgTagRegex.global) {
        matches = [...message.mes.matchAll(imgTagRegex)];
    } else {
        const singleMatch = message.mes.match(imgTagRegex);
        matches = singleMatch ? [singleMatch] : [];
    }
    console.log(`[${extensionName}] ${imgTagRegex}`, matches);
    if (matches.length > 0) {
        // Delay image generation to ensure the message is displayed first
        setTimeout(async () => {
            try {
                toastr.info(`Generating ${matches.length} images...`);
                const insertType = extension_settings[extensionName].insertType;
                const removePrompt = extension_settings[extensionName].promptInjection.remove;

                // Insert image into the current message
                // Initialize message.extra
                if (!message.extra) {
                    message.extra = {};
                }

                // Initialize image_swipes array
                if (!Array.isArray(message.extra.image_swipes)) {
                    message.extra.image_swipes = [];
                }

                // If there are existing images, add to swipes
                if (
                    message.extra.image &&
                    !message.extra.image_swipes.includes(message.extra.image)
                ) {
                    message.extra.image_swipes.push(message.extra.image);
                }

                // Get message element for later update
                const messageElement = $(
                    `.mes[mesid="${context.chat.length - 1}"]`,
                );

                // Process each matched image tag
                let generatedImage = 0;
                for (const match of matches) {
                    const prompt =
                        typeof match?.[1] === 'string' ? match[1] : '';
                    if (!prompt.trim()) {
                        continue;
                    }

                    let originalTag = typeof match?.[0] === 'string' ? match[0] : '';

                    if (removePrompt && originalTag) {
                        let prompt_nse = '<div class="img-auto-generation" title="' +  prompt + '">⚙️​🖼️⏳​</div>';
                        message.mes = message.mes.replace(originalTag, prompt_nse);
                        // Update the message display using updateMessageBlock
                        updateMessageBlock(context.chat.length - 1, message);
                        context.saveChat();
                        
                        originalTag = prompt_nse;
                    }

                    // @ts-ignore
                    const result = await SlashCommandParser.commands[
                        'sd'
                    ].callback(
                        {
                            quiet:
                                insertType === INSERT_TYPE.NEW_MESSAGE
                                    ? 'false'
                                    : 'true',
                        },
                        prompt,
                    );
                    
                    let imageUrl = result;
                    if (typeof imageUrl !== 'string' && imageUrl.trim().length == 0) {
                        continue;
                    }
                    generatedImage++;
                    
                    // Uniformly insert into extra
                    if (insertType === INSERT_TYPE.INLINE) {
                          if (removePrompt) {
                              // Remove the message
                              message.mes = message.mes.replace(originalTag, "");
                              // Update the message display using updateMessageBlock
                              updateMessageBlock(context.chat.length - 1, message);
                          }
                        
                          // Add image to swipes array
                          message.extra.image_swipes.push(imageUrl);

                          // Set the first image as the main image, or update to the latest generated image
                          message.extra.image = imageUrl;
                          message.extra.title = prompt;
                          message.extra.inline_image = true;

                          // Update UI
                          appendMediaToMessage(message, messageElement);

                          // Save chat history
                          await context.saveChat();
                    } else if (insertType === INSERT_TYPE.REPLACE) {
                          if (!originalTag) {
                              continue;
                          }
                          // Replace it with an actual image tag
                          const escapedUrl = escapeHtmlAttribute(imageUrl);
                          const escapedPrompt = escapeHtmlAttribute(prompt);
                          const newImageTag = `<img src="${escapedUrl}" title="${escapedPrompt}" alt="${escapedPrompt}">`;
                          message.mes = message.mes.replace(
                              originalTag,
                              newImageTag,
                          );

                          // Update the message display using updateMessageBlock
                          updateMessageBlock(
                              context.chat.length - 1,
                              message,
                          );
                          await eventSource.emit(
                              event_types.MESSAGE_UPDATED,
                              context.chat.length - 1,
                          );

                          // Save the chat
                          await context.saveChat();
                    }
                    else if (insertType === INSERT_TYPE.NEW_MESSAGE) {
                        if (!removePrompt) {
                          // Remove the message
                          message.mes = message.mes.replace(originalTag, "");
                          // Update the message display using updateMessageBlock
                          updateMessageBlock(context.chat.length - 1, message);
                        }
                          
                        await context.saveChat();
                    }
                }
                toastr.success(
                    `${generatedImage} images generated successfully`,
                );
            } catch (error) {
                toastr.error(`Image generation error: ${error}`);
                console.error(`[${extensionName}] Image generation error:`, error);
            }
        }, 0); // Prevent blocking UI rendering
    }
}
  