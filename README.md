# dsh-cherry-glass

Cherry Studio V2 毛玻璃主题（glassmorphism）适配到 **DeepSeek Harness Web GUI**（`dsh web`）
与 **dsh-desktop 桌面壳**（Electron，win32/darwin）。

这是一个纯 client 插件：向页面注入一份全局样式表，覆写 DSH 的 `--dsw-*` 设计令牌
（半透明表面、Cherry 蓝主题色、磨砂代码块/滚动条），并在稳定 `data-*` 接缝上施加
`backdrop-filter` 玻璃效果（侧边栏、消息区、输入栏）。亮/暗两套值跟随 DSH 外观设置
（浅色/深色/跟随系统）自动切换。

v0.6（桌面端支持）：

- dsh-desktop 的 fork 在 `html[data-dsh-desktop-platform='win32'|'darwin'] body`
  上写了 `background: transparent`（`background` 简写会清掉 `background-image`），
  特异性高于主题的 `html body`，导致桌面窗口里背景图被抹掉、只剩半透明面板 +
  原生 acrylic 的"纯毛玻璃"观感。
- 新增 `html[data-dsh-desktop='true'] body` 规则（同等特异性、后注入）把背景图
  重新铺回 body，桌面与 Web 观感一致；亮/暗两套背景色同样恢复。

v0.5 彻底移除侧边栏/详情栏 blur（勿回退）：

- 侧边栏/详情栏子树内不再使用任何 `backdrop-filter`。元素的 `backdrop-filter`
  会使自身成为 `position: fixed` 后代的包含块，而 DSH 的全屏设置弹层
  （`ui-settings-general` 的 `.overlay`，`fixed; inset: 0`）就渲染在侧边栏列
  内部——任何加在列元素或其后代上的 blur 都会把设置弹层挤进侧边栏窄框。
- **重要更正**：此前"设置页被挤进窄框"反复复现的真正根因，是 `apps/web/dist/
  index.html` 被 `scripts/preview.ps1 -Apply` 注入了**旧版 CSS**（内嵌同名
  `style[data-plugin="dsh-cherry-glass"]` 标签命中插件 client 的幂等守卫，
  插件自身的新样式永不注入）。该脚本已禁用；详见"常见问题"。
- 毛玻璃观感改为：半透明填充（`--dsw-specific-sidebar-fill`）+ 渐变/色调叠加
  （无 blur），与不支持 backdrop-filter 的浏览器观感一致；任何加载方式
  （HMR 或整页刷新、重启）都不会破坏 fixed 弹层（设置/Modal 等）。
- 输入胶囊 `[data-composer-card]` 的磨砂保留：其内部无 fixed 后代。

v0.4 移除用户气泡结构装饰：

- 移除 v0.2 加入的用户/steering 气泡描边、装饰线、磨砂与投影。原因：结构选择器
  下探层级不足，实际命中的是"用户栈"长方形容器而非气泡胶囊，产生违和的长方形
  毛玻璃边框。气泡元素本身是哈希类名、无稳定 data-* 接缝，故直接移除装饰，
  仅保留 DSH 原生半透明胶囊（`--dsw-specific-bubble` 令牌），不影响其他样式。

v0.3 修复与分层设计（保留）：

- **设置页被挤进侧边栏窄框**（v0.5 彻底修复）：根因是元素的 `backdrop-filter`
  会使自身成为 `position: fixed` 后代的包含块，而 DSH 的全屏设置弹层
  （`ui-settings-general` 的 `.overlay`，`fixed; inset: 0`）就渲染在侧边栏列内部。
- **消息滚动区与输入容器不再施加 blur**：图片灯箱 `ImageLightbox` 与拖拽遮罩
  `DropOverlay` 均为 fixed 定位且渲染在这些容器内部；同时移除滚动区模糊让
  主对话页背景图保持清晰。
- **透明度分层**：`--dsw-alias-bg-base` 等"内容表面"高度透明（清晰背景图）；
  `--dsw-alias-bg-layer-2`（设置面板/Modal）等"窗口表面"接近不透明——打开
  设置、弹窗、菜单时不受背景图干扰。

v0.2 补全 Cherry 标志元素（仅输入胶囊，全部只依赖稳定 data-* 接缝）：

- 输入胶囊聚焦光环：`:focus-within` 主题色描边 + 外发光（保留 `--dsw-shadow-lv2`）；
- 过渡动画、链接、选中文本对齐 Cherry 原主题。

## 常见问题

**改了 CSS / 构建了插件，但页面完全不变?设置页被挤进侧边栏窄框?**

检查 `apps/web/dist/index.html` 是否被注入了旧样式（特征：HTML 里有
`<style data-plugin="dsh-cherry-glass">` 或 `data-source="dist-preview"` 标签，
内容含 `blur(14px)`）。这曾是 `scripts/preview.ps1 -Apply` 的产物——HTML 内嵌
的同名 style 标签会命中插件 client 的幂等守卫（`apply()` 检测到同名标签就
跳过注入），导致插件自己（更新的）样式表永远不被注入，页面一直显示注入时的
旧 CSS；旧侧边栏 blur 又会让 fixed 定位的设置弹层被挤进侧边栏窄框。清理：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/clean-dist.ps1
# 或重新构建 web：cd deepseek-harness && pnpm run build:web（会重新生成干净的 index.html）
```

`scripts/preview.ps1` 已禁用（它会再次制造该问题）。正常更新主题请走
"更新主题"一节的构建 + 同步 + client-hmr 热更新流程。

## 目录

- `src/client/glass.css` — 主题样式（唯一需要编辑的文件）
- `src/client/index.js` — 浏览器入口：注入/卸载 `<style data-plugin="dsh-cherry-glass">`
- `src/index.js` — 宿主入口（无操作占位）
- `cordis.patch.yml` — bundle 补丁（行 id `cherry-glass`）
- `scripts/build.ps1` — 一键构建（使用 DSH checkout 自带的 tsdown，无需安装依赖）

## 构建

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
# 或指定 DSH checkout：
powershell -ExecutionPolicy Bypass -File scripts/build.ps1 -Harness C:\path\to\deepseek-harness
```

产物：`lib/client.js`（ModuleLoader 包装的浏览器 bundle）+ `lib/index.js`（宿主入口）。

## 安装（对 web profile 生效）

```sh
dsh plugin --profile web add C:/AAA/DeepseekHarness/dsh-cherry-glass
```

或手动编辑 `$DSH_HOME/profiles/web/package.json`：dependencies 增加
`"dsh-cherry-glass": "file:C:/AAA/DeepseekHarness/dsh-cherry-glass"`，
`dsh.profile.bundles` 增加 `"dsh-cherry-glass"`，然后在该目录执行
`corepack pnpm install`。

安装后 **重启 `dsh web`**（bundle roster 在启动时组装），再刷新页面即生效。
移除插件：`dsh plugin --profile web remove dsh-cherry-glass` 后重启。

## 更新主题（已安装后免重启热更新）

`web` profile 的 bundle 默认挂载 `client-hmr`：构建后将新 `lib/client.js` 同步到
profile 的已安装副本，host 会 stat 检测到变化、重新哈希并广播 SSE，浏览器自动
dispose/reload 该插件 fiber（旧样式移除 → 新样式注入），无需重启、无需刷新页面：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
Copy-Item lib\client.js, lib\client.js.map $env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-cherry-glass\lib\ -Force
```

验证：重新抓取 `http://127.0.0.1:3080/`，`window.__DSH_BOOT__` 中
`dsh-cherry-glass` 行的 `rev` 已变化。

## 设计映射速查（Cherry → DSH）

| Cherry（shadcn 变量） | DSH 令牌 |
|---|---|
| `--background` / `--card` | `--dsw-alias-bg-base` / `--dsw-alias-bg-layer-*`、`--dsw-specific-menu` |
| `--sidebar*` | `--dsw-specific-sidebar-fill` + `div:has(> [data-slot='sidebar'])` |
| `--primary` / `--accent` | `--dsw-alias-brand-primary`、`--dsw-alias-button-primary-*`、`--dsw-alias-interactive-bg-hover-accent` |
| `--chat-user` / `--chat-assistant` | `--dsw-specific-bubble`（原生半透明胶囊）/ 消息区整体透出背景图 |
| `--inputbar-*` | `--dsw-specific-input-major` + `[data-composer-card]` 磨砂胶囊与 `:focus-within` 聚焦光环 |
| `--code-block` / `--inline-code` | `--dsw-alias-markdown-*` |
| `body` 背景图 | `html body` 背景图 + 半透明 `--dsw-alias-bg-base` |
| 滚动条 | `--dsw-alias-scrollbar-*`（DSH 自带渲染体系） |

主题选择器：`html body` / `html body[data-ds-dark-theme]`（与 DSH 内置 `body[data-ds-dark-theme]`
对应，html 前缀保证优先级稳定）。
