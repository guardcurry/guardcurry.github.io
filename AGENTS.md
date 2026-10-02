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
assets/style.css             全站样式（配色/字号/行距，顶部 CSS 变量集中控制）
assets/main.js               字数统计 + 自动目录 + 滚动高亮
assets/avatar.svg            站标/头像
_templates/*.html            页面模板、导航/页脚/评论 partial
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
