# 酒馆图像自动生成插件

[English](./README.md)

### 描述
当检测到AI消息中的 `<pic prompt="...">` 标签时，此扩展会自动生成图像。它与SillyTavern的图像生成功能无缝集成，允许您的AI角色在回复中包含图像。


**请确保你酒馆自带的生图功能能够使用**

**默认会在消息列表的最后注入相关生图提示词，可以在设置里更改**
### 功能
- 自动检测并处理AI消息中的图像生成请求
- 两种插入模式：
  - 直接在当前消息中插入图像 
  - 创建带有图像的独立消息 (酒馆官方生图用的方式)
- 扩展菜单中简单的开关
- 扩展设置面板中的配置选项
- 自定义提示词模板和正则

### 前置
拓展 -> 图像生成 -> 配置好API<br>

### 安装
拓展 -> 安装拓展 -> 输入 https://github.com/wickedcode01/st-image-auto-generation

### 使用方法
1. 点击扩展菜单中的"自动生成图片"启用扩展
2. 在扩展设置面板中配置图像插入类型
3. 当您的AI在消息中包含 `<pic prompt="...">` 时，扩展将自动生成图像
4. 【可选】根据选择的生图模型，在提示词模板内提供一些好的例子，让AI参考。

示例：
```
<pic prompt="score_9, score_8_up, score_7_up, source_anime,
 1girl, woman, kitsune girl, golden bands, blushing, heart, cowboy shot, beautiful face, thick eyelashes, glowing white eyes, fox ears, long flowy silver hair, cute smile, dark eyeshadow, glowing shoulders tattoos, glowing tattoos, floral decoration in hair, night time, shinning moon, blush, white floral kimono, large breasts, cleavage,japanese theme,">
```
### 注意事项
- 提示词注入和正则可以解耦，你完全可以用世界书或其他插件实现更高级的提示词注入（如基于上下文扫描的条件注入）
- 正则的写法必须满足将提示词作为第一个捕获组，即用括号包裹，例如：`<pic[^>]*\sprompt="([^"]*)"[^>]*?>` 
- 检查你的正则和提示词是否能够匹配上，如果匹配不上是无法触发自动生图的。

### 截图
![](./dist/screenshot.png)

你可以自定义提示词模板和正则表达式<br>
![settings](./dist/screenshot2.png)

请确保在开始前配置好相关的生图模型<br>
![](./dist/Screenshot%202025-05-23%20141239.png)

