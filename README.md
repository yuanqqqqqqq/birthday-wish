# 手绘风生日祝福网站 · Hand-drawn Birthday Wish

一个精致、独特的手绘（doodle / sketch）风格生日祝福单页网站，支持沉浸式序章动画、3D 爱心粒子、照片相册、视频回忆、吹蜡烛许愿等互动。

## ✨ 特色

- 🎨 **手绘插画风格**：纸张纹理 + Rough.js 手绘背景装饰（太阳、云、树、花、山、房子）
- 🎬 **沉浸式序章**：点击切换的三幕开场，3D 爱心粒子「散开 → 文字」
- 💗 **3D 爱心粒子**：Three.js 粒子组成立体爱心，心跳跳动
- 🌸 **花瓣粒子**：花瓣/星星飘落 + 点击爆发
- 🕯️ **吹蜡烛许愿**：点击吹灭蜡烛，星星爆发 + 祝福浮现
- 📸 **照片相册 + 视频**（占位，可替换）
- ✍️ 手写字体 + 手绘光标 + 滚动叙事

## 🛠 技术栈

- [Astro](https://astro.build) —— 静态框架
- [Tailwind CSS v4](https://tailwindcss.com) —— 样式
- [Three.js](https://threejs.org) —— 3D 爱心粒子
- [Rough.js](https://github.com/roughjs/rough) —— 手绘背景装饰
- [Rough Notation](https://github.com/rough-stuff/rough-notation) —— 手绘标注
- [Lenis](https://github.com/darkroomengineering/lenis) —— 平滑滚动

## 🚀 使用

```bash
npm install
npm run dev        # 开发预览 http://localhost:4321
npm run build      # 构建到 dist/
```

## ✏️ 自定义

- **称呼**：全局搜索替换 `XXX` 为祝福对象的名字
- **照片/视频**：把你的照片放进 `public/photos/`、视频放进 `public/videos/`，然后修改 `src/components/birthday/Gallery.astro` 和 `Videos.astro` 里的引用
- **祝福文字**：编辑 `src/components/birthday/` 下的 `.astro` 文件
- **配色/字体**：修改 `src/styles/global.css` 里的 `@theme` 变量

## 📦 部署

构建产物在 `dist/`，可部署到 Vercel / Netlify / 宝塔等任意静态托管。
