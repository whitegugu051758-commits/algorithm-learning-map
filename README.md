# ACM 算法地图

ACM 算法知识图谱、节点小测和本机学习记录。小测使用洛谷题目列表的标签与难度筛选；账号 UID 对应洛谷公开练习页中的 AC 题目列表。

## 本地运行

安装 Node.js 18 或更新版本后，双击 `启动本地网站.bat`。也可以在仓库目录运行：

```bash
node server.js
```

再打开 http://127.0.0.1:4173/。

本地学习数据保存在当前浏览器的 localStorage。洛谷抽题和提交核验需要互联网连接。

## 测试与检查

```bash
npm test        # node:test，覆盖知识数据完整性、本地存储、缓存、UID 校验、洛谷响应解析、抽题与静态路径安全
npm run check   # 语法检查
```

## 项目结构

```text
index.html                 页面骨架
styles.css                 样式
app.js                     前端交互、图谱渲染
src/data/knowledge-map.js  知识点与分类数据
src/state/storage.js        localStorage 读取、校验与保存
src/server/cache.js        带过期时间和容量上限的缓存
src/server/luogu.js        洛谷请求、超时、响应解析、UID 校验
src/server/problems.js     知识点标签、抽题规则、题目筛选
server.js                  本地静态服务器与 API
api/                       Vercel 函数
netlify/functions/         Netlify 函数
cloud-functions/           EdgeOne Makers 云函数
tests/                     node:test 测试
```

前端状态保存在 `acm-map-state`、`acm-map-notes`、`acm-map-quizzes`、`acm-map-accounts` 四个 localStorage 键中。读取时会做容错，损坏的数据会回退为空对象，不会导致页面白屏。

> 浏览器端 ES 模块统一使用 `.js` 扩展名，不要改回 `.mjs`。部分静态托管（例如 EdgeOne）会把 `.mjs` 以 `application/octet-stream` 返回，浏览器会拒绝执行，导致整个模块图加载失败、页面只剩静态骨架。`tests/frontend-assets.test.js` 会拦截这类回归。

## 学习数据导入导出

打开右上角「账号设置」：

- 「导出学习数据」下载 `algorithm-map-data.json`，包含状态、笔记、题组和洛谷 UID。
- 「导入学习数据」读取上述文件并覆盖当前浏览器数据。

导入文件使用 `format: "acm-algorithm-map"` 和 `version: 1` 标识；版本不匹配时会拒绝导入。数据仍然只保存在浏览器，不会上传。

## 在线部署

完整交互功能包含洛谷题库与 UID 核验 API，不能只用 GitHub Pages 托管。

### EdgeOne Makers

仓库已包含 `cloud-functions/`，EdgeOne 会自动识别为 Node.js 云函数：

```text
cloud-functions/api/problems.js        → /api/problems
cloud-functions/api/luogu/passed.js    → /api/luogu/passed
```

在 [EdgeOne Makers 控制台](https://console.cloud.tencent.com/edgeone/pages) 导入本仓库即可，无需构建命令，静态文件发布目录为仓库根目录。也可以使用 CLI：

```bash
npm install -g edgeone@latest
edgeone login
edgeone makers deploy
```

本地预览云函数：

```bash
edgeone makers dev
```

### Netlify

导入本仓库并部署，`netlify.toml` 会自动配置静态页面、函数目录和 API 路由。

### Vercel

导入本仓库，`api/` 下的函数提供 API，根目录的 `index.html` 作为网站入口。

### Render

仓库保留 Render Blueprint 配置，可用于创建 Node Web Service，启动命令为 `node server.js`。

## 数据与接口

洛谷题库接口按知识点标签和节点难度上限随机抽题；题组在抽取后固定保存在当前浏览器。公开练习页提供的已通过题目用于自动核验。账号 UID、题组、状态和笔记都保存在浏览器 localStorage，不会上传到网站服务器或 GitHub。每位用户的数据只在该浏览器和网站域名下保留；需要换设备时使用导出/导入功能。

服务端请求洛谷的超时可通过 `LUOGU_TIMEOUT_MS` 调整（默认 10000 毫秒），CORS 来源可通过 `CORS_ORIGIN` 限制（默认 `*`）。
