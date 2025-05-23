# Sillytavern Image Auto Generation Extension

[中文](./README_CN.md)

### Description
This extension automatically generates images when it detects `<pic prompt="...">` tags in AI messages. It seamlessly integrates with SillyTavern's image generation capabilities, allowing your AI characters to include images in their responses.

**Make sure your ST built-in image generation function works properly**

**By default, relevant prompt will be injected at the end of the message, but this can be changed in the settings**
### Features
- Automatically detects and processes image generation requests in AI messages
- Two insertion modes:
  - Insert images directly in the current message
  - Create new messages with generated images (ST's default image generation method)
- Simple toggle in the extensions menu
- Configuration panel in the Extensions settings
- Customizable prompt template and regexp

### Prerequisites
Extensions -> Image Generation -> Configure API
![](./dist/image.png)

### Installation
Extension -> Install Extension -> https://github.com/wickedcode01/st-image-auto-generation

### Usage
1. Enable the extension by clicking "Auto-generate Image" in the extensions menu
2. Configure the image insertion type in the Extensions settings panel
3. When your AI includes `<pic prompt="...">` in its message, the extension will automatically generate the image
4. **[Optional]** Based on your selected image generation model, provide some good prompt examples to AI.

Example:
```
<pic prompt="score_9, score_8_up, score_7_up, source_anime,
 1girl, woman, kitsune girl, golden bands, blushing, heart, cowboy shot, beautiful face, thick eyelashes, glowing white eyes, fox ears, long flowy silver hair, cute smile, dark eyeshadow, glowing shoulders tattoos, glowing tattoos, floral decoration in hair, night time, shinning moon, blush, white floral kimono, large breasts, cleavage,japanese theme,">
```

### Notes
- Prompt injection and regex can be decoupled. You can use world books or other extensions to implement more advanced prompt injection (such as conditional injection based on context scanning)
- The regex pattern must capture the prompt as the first capture group, i.e., wrap it in parentheses, for example: `<pic[^>]*\sprompt="([^"]*)"[^>]*?>` 
- Check if your regex and prompt can match properly, as auto image generation won't trigger if they don't match.

### Screenshots
![](./dist/screenshot.png)

![settings](./dist/screenshot_en.png)
You can configure prompt template and regular expression

![](./dist/image.png)
Please make sure you have configured the image generation model before starting
