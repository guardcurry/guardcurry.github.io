# AGENTS.md · 项目速览（给 AI 助手 / 未来的自己）

> **接手本项目时只读本文件即可**，无需通读 README.md 或源码。读完本文件你应能直接改内容、改样式、重新构建并指导部署。
> 人类视角的详细使用手册在 `README.md`；本文件是压缩版交接说明。

---

## 1. 一句话定义

一个**零依赖的中文静态个人博客**：文章写成 Markdown → 一个 PowerShell 脚本渲染成 HTML → 托管在 GitHub Pages。
没有框架、没有 Node/R/Python 依赖、没有后端、没有数据库。版式模仿 Quarto 博客模板（顶部导航、标题/副标题/标签、右侧目录、页脚引用与许可）。

## 2. 关键坐标（先看这里）

| 项 | 值 |
| --- | --- |
| 线上地址 | https://guardcurry.github.io/ |
| 仓库 | https://github.com/guardcurry/guardcurry.github.io （Public） |
| Pages 设置 | Settings → Pages → Deploy from a branch → `main` + `/ (root)`（已生效） |
| 本地目录 | `C:\Users\25942\OneDrive\Desktop\web` |
| 站名 / 作者 / 邮箱 | `guardcurry blog` / 徐奥 / `2594259836@qq.com`（全部集中在 `site.json`） |
| 当前状态 | **已上线并可访问**（4 页实测 HTTP 200）；giscus 评论区**已配置完成**（分类 ID 已填），待用户上传本次生成的文件后，文章页底部即出现评论框 |
| 文章数量 | 1 篇：《钥匙》（`blog/2026-09-30-钥匙/`） |

## 3. 目录结构与「哪些文件能改」

**只改这些（源码）：**

```
site.json                    站名、作者、邮箱、仓库地址、站点 URL
blog/<日期-标题>/index.md    一篇文章 = 一个文件夹（文件夹名即网址）
about/index.md               关于页
assets/style.css             Apple 风格设计系统（液态玻璃/深浅色/动效，见第 11 节）
assets/main.js               字数统计 + 自动目录 + 导航滚动状态 + 入场动画
assets/avatar.svg            已弃用（旧「钥匙」站标；页面与 favicon 都已不再引用，可安全删除）
_templates/*.html            页面模板、导航/页脚/评论 partial（含全局动态背景层）
giscus.json                  评论区配置（见第 10 节）
build.ps1 / build.cmd        构建脚本（build.cmd 是双击入口）
```

**不要手改（每次构建都会覆盖）：**

```
index.html                     首页
blog/index.html                文章列表页
blog/<日期-标题>/index.html    文章页
about/index.html               关于页
```

`.nojekyll` 由 `build.ps1` 在缺失时自动创建。`钥匙.md`（根目录）是最初的原始文本备份，**不参与构建**。

## 4. 构建（一条命令）

```powershell
# 首选：同进程执行（沙箱下最可靠，已实测）
Set-Location 'C:\Users\25942\OneDrive\Desktop\web'
Invoke-Expression (Get-Content .\build.ps1 -Raw)

# 备选：启动子进程（会被执行策略拦，需 Bypass；且子进程启动可能被沙箱拒绝）
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
# 用户侧：直接双击 build.cmd
```

输出形如：

```
  post   -> blog/2026-09-30-钥匙/index.html
  page   -> index.html
  page   -> blog/index.html
  page   -> about/index.html
Done. 1 post(s) built.
```

**构建后自查内部链接（可选）：**

```powershell
Get-ChildItem -Recurse -Filter index.html -File | Where-Object { $_.FullName -notmatch '_templates' } | ForEach-Object {
  $d = $_.DirectoryName
  [regex]::Matches([IO.File]::ReadAllText($_.FullName,[Text.Encoding]::UTF8),'(?:href|src)="(?!https?:|#|mailto:)([^"]+)"') |
    ForEach-Object { $t = Join-Path $d $_.Groups[1].Value; if (-not (Test-Path -LiteralPath $t)) { "MISSING $t" } }
}
```

## 5. 本机环境限制（**重要，能省大量试错**）

- `pwsh`（PowerShell 7）**不在 PATH**；当前 shell 是 Windows PowerShell 5.1，脚本必须兼容 5.1。
- `git` 和 `gh` **均未安装**，且本机**没有到 github.com 的可用网络** → **助手无法执行 git push，也不要尝试**。
- 沙箱（workspace-write）**禁止启动外部程序**：Chrome/Edge、`python.exe` 均报 `Access is denied` → **无法截图预览**，视觉验证由用户双击 `index.html` 完成。
- 脚本受执行策略限制：`& .\build.ps1` 会报「未数字签名」；改用上面的 `Invoke-Expression (Get-Content .\build.ps1 -Raw)`，或带 `-ExecutionPolicy Bypass` 启动子进程（`build.cmd` 已内置）。**子进程启动可能被沙箱拒绝**（报 `Program 'powershell.exe' failed to run: Access is denied`），失败就回到同进程执行。
- 但**可以**用 `web_fetch` 读取线上页面做验证：`https://guardcurry.github.io/`、`https://api.github.com/repos/guardcurry/guardcurry.github.io/contents/`。

## 6. 部署 / 更新流程（当前唯一可行路径：网页拖拽）

1. 本目录运行构建（见第 4 节）。
2. 仓库 → **Add file → Upload files**。
3. 拖入**本目录里面的内容**（`index.html`、`blog`、`about`、`assets`、`_templates`、`build.ps1`、`build.cmd`、`site.json`、`README.md`、`AGENTS.md`、`钥匙.md`）。
   ⚠️ **不要拖 `web` 文件夹本身**，否则首页会变成 `…/web/index.html`。
   ⚠️ 隐藏文件 `.nojekyll` 需先「查看 → 显示 → 隐藏的项目」才能选中（**目前线上仍未上传，不影响显示**，补法：Add file → Create new file → 文件名 `.nojekyll` → 空内容 → Commit）。
4. **Commit changes** → 等 1～2 分钟 → 强刷 `Ctrl+F5` 查看。

新增文章后**必须上传**：新文件夹 `blog/<日期-标题>/` + 重新生成的 `index.html` + `blog/index.html`。
若用户以后装了 Git，可用标准 `git init/add/commit/branch -M main/remote add origin/push -u origin main`。

## 7. 文章格式（front matter）

新建 `blog/2026-10-15-散步/index.md`：

```markdown
---
title: 散步                  # 必填，标题
subtitle: 一句话副标题         # 可空
date: 2026-10-15             # 必填，决定排序（倒序）
display_date: 2026 年 10 月 15 日
author: 徐奥
tags: 随笔, 散步              # 逗号分隔 → 标签胶囊
excerpt: 列表页显示的一句话摘要。
dateline: 2026 年 10 月 15 日，于家中   # 右对齐落款，可空
cite_key: xu2026sanbu        # BibTeX 引用键
---

第一段正文……

## 小标题（有 ## 时右侧目录自动出现）

> 引用、- 列表、**加粗**、`代码`、[链接](url) 均支持
```

正文规则：空行分段；中文段落自动首行缩进 2em、行高 2.05；`build.ps1` 里 `Convert-Markdown` 是全部 Markdown 逻辑（约 40 行），需要新语法就改它。

## 8. 约定与已知坑（改代码前必读）

- **`build.ps1` 必须保持纯 ASCII**（注释也是英文）：中文只放在 `_templates/*.html` 与 `*.md` 里，靠 `UTF8Encoding($false)` 读写，避免 PS 5.1 编码乱码。
- **不要用 `$home`（= 只读自动变量 `$HOME`）等自动变量名**，曾因此报 `Cannot overwrite variable HOME`；同类需避开 `$Host`、`$args`、`$input`、`$error`。
- 模板用 `{{TOKEN}}` 占位：`{{ROOT}}` 是相对前缀（根页 `''`、`blog/` 为 `'../'`、文章页 `'../../'`），因此**整站可在 `file://` 下直接双击打开**，也兼容「项目型仓库」（`用户名.github.io/blog/`）。改模板后必须重跑构建。
- `{{NAVBAR}}`、`{{FOOTER}}` 先替换 partial，再统一替换其余 token。
- 右侧「目录」仅在该文章存在 `##`/`###` 时渲染，否则 JS 隐藏，属正常。
- 文章页「阅读」时长由 `assets/main.js` 计算，**静态抓取时为 `—`**，浏览器中正常。
- 中文文件夹名会被 URL 编码（`2026-09-30-钥匙` → `%E9%92%A5%E5%8C%99`），GitHub Pages 正常支持。
- 站点页脚仓库链接、BibTeX 引用 URL 都来自 `site.json`，**改了 `site.json` 必须重新构建**。

## 9. 可能的下一步（用户尚未要求，按需实现）

- 换头像为真实照片（替换 `assets/avatar.svg`，或改扩展名并同步 4 处引用）。
- `new-post.cmd <标题>`：一键生成文件夹 + front matter 模板。
- `build.ps1` 生成 `feed.xml`（RSS/Atom），并在 `<head>` 加 `<link rel="alternate">`。
- 图片支持：文章内 `![](图.png)` 目前只作为普通文本段落，需在 `Convert-Markdown` 加图片规则。
- 浏览量统计（不蒜子 / GoatCounter，纯前端即可）。
- 站点地图 `sitemap.xml`、`robots.txt`。

## 10. 评论区（giscus / GitHub Discussions）—— 已配置完成

**状态**：Discussions 已开启、giscus App 已安装、`category_id` 已填入，构建产物已带评论块；**只等用户把文件上传到仓库**即在线上生效。

固定值（已写入 `giscus.json`，不要凭空改动）：
- `repo_id` = `R_kgDOU4un3A`（仓库 node_id，取自 GitHub REST API 的 `node_id` 字段）
- `category_id` = `DIC_kwDOU4un3M4DG4eU` = **Announcements** 分类

**架构**：`giscus.json`（配置）+ `_templates/_comments.html`（partial）+ `build.ps1` 的 `Get-CommentsHtml`；`_templates/post.html` 里用 `{{COMMENTS}}` 占位。**只有文章页**输出评论块，首页/列表页/关于页没有（已实测）。
**渲染条件**：`enabled = true` 且 `repo_id`、`category_id` 都非空；任一为空 → 整块静默不输出（安全默认，站点不会报错）。

**复核/重取分类 ID**：

```
web_fetch https://giscus.app/api/discussions/categories?repo=guardcurry/guardcurry.github.io&repoId=R_kgDOU4un3A
# → {"categories":[{"id":"DIC_kwDOU4un3M4DG4eU","name":"Announcements"}, {"id":"DIC_kwDOU4un3M4DG4eV","name":"General"}, ...]}
```

若返回 `{"error":"giscus is not installed on this repository"}`，说明 App 安装失效/被撤回：让用户到 <https://github.com/settings/installations> 检查（安装是两屏流程，最后一屏必须点绿色 Install；未装好时 <https://giscus.app> 的分类下拉会显示 “No categories found”）。

**可调项（只改 `giscus.json` 后重跑构建）**：`theme`（当前 `light`；本站无暗色模式，故未采用用户在 giscus.app 页面默认的 `preferred_color_scheme`）、`lang`（`zh-CN`）、`input_position`（`bottom`）、`reactions_enabled`、`mapping`（`pathname`，中文路径可用）。

**验证线上是否已带评论**：

```
web_fetch https://raw.githubusercontent.com/guardcurry/guardcurry.github.io/main/blog/2026-09-30-%E9%92%A5%E5%8C%99/index.html
# 搜 data-category-id 是否等于 DIC_kwDOU4un3M4DG4eU
```

> ⚠️ 上面第 10 节里写「`theme` 当前为 `light`、本站无暗色模式」**已过时**：全站重做后已支持深浅色，`giscus.json` 的 `theme` 现为 `preferred_color_scheme`（跟随系统，与站点一致）。

## 11. UI 设计系统（壁纸站风格 / 深色图库，参考 haowallpaper.com）

**风格**：**全站固定深色**（`:root` 里 `color-scheme: dark`，已删除 `prefers-color-scheme` 双主题）——深色底 + 氛围光斑 + 图库网格 + 圆角卡片 + 悬停微缩放，模仿 haowallpaper.com「哲风壁纸」。

**关键实现（全在 `assets/style.css`）**：
- 设计变量集中在 `:root`（单一暗色主题）→ **改配色/圆角/阴影只动这一块**。
- 氛围背景：`.mesh span` 四个彩色光斑 + `@keyframes meshFloat` 缓慢漂移。**`.mesh` 标记写在 `_templates/_navbar.html` 顶部**（随导航 partial 注入每个页面 `<body>` 之后），不要在页面模板里重复添加。
- 导航栏：`.navbar` 是**全宽模糊条**（`backdrop-filter` + 下边框），`.navbar-shell` 只是内层限宽 flex 行；滚动超过 12px 时 `main.js` 给 `.navbar` 加 `.is-scrolled` 加深底色。**胶囊悬浮导航已不存在。**
- 文章卡片 = 图库 tile，由 `build.ps1` 的 `New-PostListHtml` 输出：
  `<li class="tile reveal" style="--h:200">` → `.tile-link` → `.tile-thumb`（内含 `.tile-glyph` 标题首字）+ `.tile-body`（`.tile-date` / `.tile-title` / `.tile-excerpt` / `.tags`）。
  `--h` = 每张卡的 HSL 色相（`(200 + i*47) % 360`），渐变封面靠它上色。**`.post-card` / `.card-date` / `.card-excerpt` / `.list-date` / `.glass` 均已废弃，别再引用。**
- 网格：`.post-list` = `repeat(auto-fill, minmax(340px, 1fr))`，桌面多列、手机单列。
- 入场动画：元素加 `class="reveal"`（可加 `data-delay`），由 `main.js` 的 IntersectionObserver 加 `.in`。
- 跨页面转场：`@view-transition { navigation: auto }` + `.navbar { view-transition-name: navbar }`（Chrome/Edge 126+，其余自动降级）。
- giscus 主题为 `dark`（`giscus.json`），与固定深色站点一致。
- **点击爆表情特效**：`main.js` 第 5 段监听 `pointerdown`（只响应 `e.button === 0`，即左键/单指），在点击坐标生成 5～8 个 emoji 粒子；粒子样式 `.pop-emoji` 定义在 `style.css`（`position: fixed` + `pointer-events: none`），动画用 Web Animations API（飞散 + 旋转 + 淡出），`onfinish` 自动 `remove()`。emoji 清单是 `POP_GLYPHS` 数组（用 `\uXXXX` 转义，避免文件编码风险）；同时存活粒子 >140 个时停止生成；`prefers-reduced-motion` 下整段不注册。注意：因为用的是 `pointerdown`，拖动滚动条或选文字也会触发；想只在真正 click 时触发就把 `pointerdown` 改成 `click`。

**主页封面（只在首页出现，文章页永不显示）**：
- 图片放 `assets/cover.jpg`（也支持 `.jpeg/.png/.webp`）→ `build.ps1` 自动探测并注入 `index.html` 的 `<figure class="hero-cover" style="background-image:url(...)">`；**文件不存在时整块不输出**，不会出现破图。
- 占位符是 `{{COVER_BLOCK}}`，只存在于 `_templates/home.html`；文章页/列表页/关于页都没有它。
- `main.js` 第 4 段给封面加滚动视差（`prefers-reduced-motion` 下自动关闭）。
- 换封面：替换 `assets\cover.jpg` → 重跑构建 → 上传 `assets` + `index.html`。
- 当前封面：1123×657 JPEG，约 105 KB（由用户提供的壁纸压缩而来）；CSS 高度 `clamp(230px, 44vw, 500px)`、`background-position: center 30%`（保住书法与主体，裁掉底部人群）。

**字体**：SF Pro 字族优先，中文回落 PingFang SC / 微软雅黑；Windows 上渲染为 Segoe UI（不内嵌字体以保持零依赖）。
**保留的必需覆盖**：`.post-body .dateline { text-indent: 0 }`（否则落款继承段落首行缩进）。
**浏览器要求**：`color-mix(in srgb, ...)` 需 Chrome 111+ / Safari 16.2+；`backdrop-filter` 需 Chrome 76+。

## 12. 更新：Spotify 风格 + 分类栏目（最新状态，**优先于第 11 节**）

**风格改为 Spotify 网页风**（第 11 节里 `.mesh` 光斑、悬浮导航、`.tile` 亮色渐变的描述已过时，以本节为准）：
- 配色：`--bg:#000` / `--panel:#121212` / `--card:#181818` / `--card-hover:#282828` / `--text:#fff` / `--muted:#b3b3b3` / 品牌绿 `--accent:#1db954`、`--accent-hover:#1ed760`。**改主题只动 `:root`。**
- 布局：**左侧固定侧边栏 `.sidebar`**（桌面 `position:fixed` + `body{padding-left:232px}`；≤900px 自动变成顶部 sticky 横向条）。结构在 `_templates/_navbar.html`：`.brand` → `.nav > .nav-item(.active)` → `.sidebar-cta`（绿色按钮）→ `.sidebar-foot`。
- **`.glass` 现在就是"面板"**（`background:var(--panel)` + 1px 边框 + 8px 圆角）：所有页面模板仍在使用它，别删。
- 卡片：`.tile`（hover 变 `#282828` 并上浮）+ `.tile-thumb`（按 `--h` 色相的**暗色**渐变）+ `.tile-glyph` + **`.play-btn`（Spotify 标志性绿色圆形播放按钮，hover 浮现）**。
- 文章页右栏从 `.sidebar` 改名为 **`.post-aside` / `.aside-sticky`**（避免与全局 `.sidebar` 撞名）。
- 旧的 `.mesh` 光斑标记、`.navbar` / `.navbar-shell` 结构**已删除**；`main.js` 的滚动状态改为监听 `.sidebar`。

**分类栏目（新功能，自动推导）**：
- 文章 front matter 写 `category: 儿童作文` → `build.ps1` 自动做四件事：① 侧边栏加一个 `.nav-item` 入口；② 生成 `category\<分类名>\index.html` 列表页（模板 `_templates/category.html`）；③ 卡片上加 `.cat-pill`；④ 文章页标题上方加 `.cat-pill` 链接。
- 分类**从文章里推导**（`Select-Object -Unique`），无需在 `site.json` 登记；新增分类只需在新文章里写 `category: xxx` 再构建。
- 两个新的可选 front matter 字段：**`glyph:`**（卡片封面字，默认取标题首字）和 **`author_bio:`**（作者介绍，渲染成 `.author-card` 头像卡）。当前《小狗"年年"》用 `glyph: 🐶` + 「五年级学生，站主的妹妹，喜欢卡皮巴拉。」
- 目前文章：《钥匙》（徐奥，2026-09-30）与《小狗"年年"》（徐汝婷，2026-10-03，分类「儿童作文」）。URL 形如 `category/儿童作文/index.html`（中文目录名，GitHub Pages 正常支持）。

**本轮修掉的三个真 bug（重要）**：
1. `.reveal` 改为 **`html.js .reveal`**（`_navbar.html` 顶部内联脚本加 `js` 类）→ **没有 JS 时内容不再"隐身"**。
2. `IntersectionObserver` 的 `threshold` 由 `0.05` 改为 **`0`** 并加 2 秒兜底：手机上的长正文高达上万像素，比例阈值永远达不到，会让**整篇文章显示为空白**——这就是「手机上点文章进不去」的真正原因。
3. 点击爆表情改为**在链接/按钮/输入框上不触发**（`closest("a, button, input, textarea, select, label")`），保证手机上点文章一定能跳转。

**构建输出现在是**：`post ×N` → `cover`（可选）→ `page index.html` → `page blog/index.html` → `cat category/<名>/index.html` → `page about/index.html`。
