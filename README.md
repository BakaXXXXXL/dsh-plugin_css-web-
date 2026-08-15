# dsh-plugin-css

Cherry Studio V2 毛玻璃主题（glassmorphism）适配 **DeepSeek Harness Web GUI**（`dsh web`）的客户端插件。

插件包名：`dsh-cherry-glass`。纯 client 插件：向页面注入一份全局样式表，覆写 DSH 的 `--dsw-*` 设计令牌，并在稳定 `data-*` 接缝上施加玻璃效果。亮/暗两套值跟随 DSH 外观设置（浅色/深色/跟随系统）自动切换，并兼容 dsh-desktop（Electron）桌面壳。

## 特性

- 背景图铺底，主对话页表面高度透明，背景图清晰可见
- 侧边栏、详情栏为半透明填充 + 渐变叠加的玻璃观感（不使用 backdrop-filter，避免破坏 fixed 弹层）
- 输入胶囊磨砂 + 聚焦光环（`:focus-within` 主题色描边）
- 设置面板、弹窗、菜单等浮层表面接近不透明，不受背景图干扰
- 代码块、滚动条、选中文本按 Cherry 蓝色调统一

## 效果预览

浅色主题：

![浅色主题](light.png)

深色主题：

![深色主题](dark.png)

## 目录结构

```
dsh-plugin-css/
├── src/
│   ├── client/
│   │   ├── glass.css        # 主题样式（唯一需要编辑的文件）
│   │   ├── glass-css.js     # 由 glass.css 生成的 JS 模块（勿手改）
│   │   └── index.js         # 浏览器入口：注入/卸载 <style>
│   └── index.js             # 宿主入口（无操作占位）
├── scripts/
│   ├── build.ps1            # 一键构建
│   ├── clean-dist.ps1       # 清理被注入到 dist/index.html 的旧样式
│   └── gen-css.mjs          # 从 glass.css 生成 glass-css.js
├── lib/                     # 构建产物（client bundle）
├── cordis.patch.yml         # bundle 补丁（行 id: cherry-glass）
└── package.json
```

## 安装

### 方式一：命令行安装

```sh
dsh plugin --profile web add C:/AAA/dsh_Agent/dsh-plugin_css
```

### 方式二：手动安装

编辑 `$DSH_HOME/profiles/web/package.json`：

- `dependencies` 增加 `"dsh-cherry-glass": "file:C:/AAA/dsh_Agent/dsh-plugin_css"`
- `dsh.profile.bundles` 增加 `"dsh-cherry-glass"`

然后在 profile 目录执行：

```sh
corepack pnpm install
```

安装后重启 `dsh web`（bundle roster 在启动时组装），刷新页面生效。
移除插件：`dsh plugin --profile web remove dsh-cherry-glass` 后重启。

## 构建

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
```

构建使用 DSH checkout 自带的 tsdown（首次运行会自动创建 node_modules junction），无需额外安装依赖。产物为 `lib/client.js`（ModuleLoader 包装的浏览器 bundle）与 `lib/index.js`（宿主入口）。

## 更新主题（已安装后免重启热更新）

web profile 默认挂载 `client-hmr`。构建后将新 bundle 同步到 profile 的已安装副本，host 会检测到文件变化、重新哈希并广播 SSE，浏览器自动 dispose/reload 插件 fiber（旧样式移除，新样式注入），无需重启、无需刷新页面：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
Copy-Item lib\client.js, lib\client.js.map $env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-cherry-glass\lib\ -Force
```

验证：重新抓取 `http://127.0.0.1:3080/`，`window.__DSH_BOOT__` 中 `dsh-cherry-glass` 行的 `rev` 已变化。

## 常见问题

**改了 CSS / 构建了插件，但页面完全不变？设置页被挤进侧边栏窄框？**

检查 `deepseek-harness/apps/web/dist/index.html` 是否被注入了旧样式（特征：HTML 内有 `<style data-plugin="dsh-cherry-glass">` 标签）。HTML 内嵌的同名 style 标签会命中插件 client 的幂等守卫，导致插件自身的（更新的）样式表永远不被注入；旧版侧边栏 blur 又会让 fixed 定位的设置弹层被挤进侧边栏窄框。清理：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/clean-dist.ps1
# 或重新构建 web：cd deepseek-harness && pnpm run build:web
```

`scripts/preview.ps1` 已禁用（它会把旧样式注入 dist/index.html，制造上述问题）。

## 版本记录

- v0.6：新增 dsh-desktop（Electron）背景图恢复规则（`html[data-dsh-desktop='true'] body`）
- v0.5：侧边栏/详情栏彻底移除 backdrop-filter（避免包含块破坏 fixed 设置弹层），毛玻璃观感改为半透明填充 + 渐变叠加
- v0.4：移除用户气泡结构装饰（描边、装饰线、磨砂、投影），仅保留原生半透明胶囊
- v0.3：移除消息滚动区与输入容器的 blur；透明度分层（内容表面透明、窗口表面不透明）
- v0.2：新增输入胶囊聚焦光环、过渡动画
- v0.1：初始适配
