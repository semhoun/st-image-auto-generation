# Sillytavern Image Auto Generation Extension

[中文](./README_CN.md)

### Description
This extension automatically generates images when it detects `<img prompt="..."/>` tags in AI messages. It seamlessly integrates with SillyTavern's image generation capabilities, allowing your AI characters to include images in their responses.

**Make sure your ST built-in image generation function works properly**
### Features
- Automatically detects and processes image generation requests in AI messages
- Two insertion modes:
  - Insert images directly in the current message (ST release version unsupported now)
  - Create new messages with generated images (ST's default image generation method)
- Simple toggle in the extensions menu
- Configuration panel in the Extensions settings

### Usage
1. Enable the extension by clicking "Auto-generate Image" in the extensions menu
2. Configure the image insertion type in the Extensions settings panel
3. When your AI includes `<img prompt="your prompt here"/>` in its message, the extension will automatically generate the image

Example:
```
Here's a picture of a cat:
<img prompt="cute orange cat with green eyes"/>
```

### Installation
Extension - Install Extension - https://github.com/wickedcode01/st-image-auto-generation
