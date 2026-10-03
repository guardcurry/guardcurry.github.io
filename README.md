# 钥匙 · 个人博客站

一个不依赖任何框架的中文个人博客：**Markdown 写文章 → PowerShell 生成 HTML → GitHub Pages 托管**。
版式参考了 Quarto 博客模板（顶部头像导航、标题/副标题/标签、右侧目录、页脚引用与许可块）。

**已上线：<https://guardcurry.github.io/>**

> 🤖 **用 AI 助手接手本项目时，先读 [`AGENTS.md`](AGENTS.md)**：那是压缩版交接说明（关键坐标、构建命令、环境限制、已知坑、下一步），读完即可直接干活，不必通读本文件。

---

## 一、目录结构

```
.
├── index.html              ← 首页（自动生成，不要手改）
├── blog/
│   ├── index.html          ← 文章列表（自动生成）
│   └── 2026-09-30-钥匙/
│       ├── index.md        ← 文章源文件（改这个）
│       └── index.html      ← 生成的文章页（自动生成）
├── about/
│   ├── index.md            ← 关于页源文件（改这个）
│   └── index.html          ← 自动生成
├── assets/
│   ├── style.css           ← 全站样式
│   ├── main.js             ← 目录生成、字数统计、滚动高亮
│   └── avatar.svg          ← 站标/头像（可换成自己的图片）
├── _templates/             ← 页面模板与导航、页脚
├── site.json               ← 站点配置：站名、作者、仓库地址
├── build.ps1               ← 构建脚本
├── build.cmd               ← 一键构建（Windows 双击即可）
├── .nojekyll               ← 告诉 GitHub Pages 不要跑 Jekyll
└── 钥匙.md                 ← 散文原始文本（备份用，不参与构建）
```

---

## 二、本地预览

直接**双击 `index.html`** 即可用浏览器打开（全站使用相对路径，`file://` 下样式和链接都正常）。

---

## 三、写一篇新文章

1. 新建文件夹 `blog/2026-10-15-我的新文章/`，里面放一个 `index.md`：

   ```markdown
   ---
   title: 我的新文章
   subtitle: 一句话副标题
   date: 2026-10-15
   display_date: 2026 年 10 月 15 日
   author: 徐奥
   tags: 散文, 随笔
   excerpt: 列表页显示的一句话摘要。
   dateline: 2026 年 10 月 15 日，于家中
   cite_key: xu2026new
   ---

   第一段正文……

   第二段正文……
   ```

   > 文件夹名决定网址，建议用 `日期-标题`；中文可用，浏览器会显示为 `%E9%94%AE...`，属正常现象。

2. **双击 `build.cmd`**（或在 PowerShell 里执行 `powershell -ExecutionPolicy Bypass -File .\build.ps1`）。

3. 重新打开 `index.html` 检查效果，然后按下一节推送到 GitHub。

正文支持：空行分段、`## 小标题` / `###`（有标题时右侧目录自动出现）、`> 引用`、`- 列表`、`**加粗**`、`` `代码` ``、`[链接](url)`。
中文段落会自动首行缩进两格、行高 2.05，适合长文阅读。

---

## 四、部署到 GitHub Pages（免费）

### 第 1 步：改配置

配置已经填好了（用户名 `guardcurry`、邮箱 `2594259836@qq.com`、站名 `guardcurry blog`）：

```json
{
  "site_title": "guardcurry blog",
  "site_desc": "写一点文字，记一些事。这里存放我的散文与随笔。",
  "author": "徐奥",
  "author_email": "2594259836@qq.com",
  "repo": "https://github.com/guardcurry/guardcurry.github.io",
  "site_url": "https://guardcurry.github.io",
  "start_year": 2026
}
```

以后若改站名或换仓库，改完**重新双击 `build.cmd`**（页脚仓库链接、引用块网址都来自这里）。

### 第 2 步：在 GitHub 建仓库

1. 打开 <https://github.com/new>。
2. **Repository name** 填 **`guardcurry.github.io`**（必须与用户名完全一致，网址才会是 `https://guardcurry.github.io/`）。
3. 可见性选 **Public**（免费版 Pages 要求公开仓库）。
4. **不要**勾选 Add a README file / .gitignore / license，保持空仓库，点 **Create repository**。

> 想用普通项目仓库也行（例如叫 `blog`），地址会变成 `https://guardcurry.github.io/blog/`——全站走相对路径，**代码无需改动**。

### 第 3 步：上传文件（网页拖拽，不用装 Git）

1. 在刚建好的空仓库页面，点提示里的 **uploading an existing file**（或右上角 **Add file → Upload files**）。
2. 打开 `C:\Users\25942\OneDrive\Desktop\web`，按 `Ctrl+A` **全选里面的内容**：`index.html`、`blog`、`about`、`assets`、`_templates`、`build.ps1`、`build.cmd`、`site.json`、`README.md`、`钥匙.md`。
3. 把它们**拖到网页的上传区**，等进度条走完。
   - ⚠️ 拖的是文件夹**里面的内容**，别拖 `web` 文件夹本身，否则首页会变成 `…/web/index.html`。
   - 隐藏文件 `.nojekyll` 默认看不见：先在资源管理器点「查看 → 显示 → 隐藏的项目」再全选。若仍漏了，可在仓库里用 **Add file → Create new file**，文件名填 `.nojekyll`，内容留空，直接 Commit。
4. 页面下方 **Commit changes** 的说明随便写（如 `first commit`），点绿色按钮提交。

**以后装了 Git 的话**，更新会更省事：

```bash
git init
git add .
git commit -m "first commit: 钥匙"
git branch -M main
git remote add origin https://github.com/guardcurry/guardcurry.github.io.git
git push -u origin main
```

⚠️ `.nojekyll` 和 `assets/` 一定不能漏：前者防止 Jekyll 忽略 `_templates`，后者决定页面有没有样式。

### 第 4 步：开启 Pages

仓库 → **Settings → Pages** → Source 选 **Deploy from a branch** → Branch 选 **`main`**、目录选 **`/ (root)`** → **Save**。

等 1～2 分钟，访问 **<https://guardcurry.github.io/>** 即可看到首页。以后每次改完文章：双击 `build.cmd` → 回到仓库 **Add file → Upload files** 上传改动过的文件（同名文件会直接覆盖）→ Commit，页面随即更新。

### 第 5 步（可选）：绑定自己的域名

1. 在仓库根目录新建一个名为 `CNAME` 的文件，内容只写域名，例如 `blog.example.com`。
2. 到域名服务商处添加 CNAME 记录，指向 `guardcurry.github.io`。
3. 回到 Settings → Pages，填入 Custom domain 并勾选 **Enforce HTTPS**。

---

## 五、常见问题

| 现象 | 原因与解决 |
| --- | --- |
| 打开是 404 | 首页必须叫 `index.html`（全小写）；确认 `.nojekyll` 也上传了；仓库 Settings → Pages 是否已 Save |
| 页面没样式 | `assets/` 文件夹没上传，或上传时层级被压平，保持原有目录结构 |
| 提示“无法加载脚本，因为未数字签名” | 用 `build.cmd`（内部已带 `-ExecutionPolicy Bypass`），或执行 `powershell -ExecutionPolicy Bypass -File .\build.ps1` |
| 右侧目录不显示 | 文章里没有 `## 小标题`，属于正常（无标题时目录自动隐藏） |
| 想给导航栏加图标 | 目前导航栏只有站名文字、页面无 favicon。要加图标：在 `_templates/_navbar.html` 的 `.brand` 里插入 `<img>`，并在 4 个页面模板的 `<head>` 加回 `<link rel="icon" href="{{ROOT}}assets/你的图标.svg">` |
| 想换配色/字体 | 只改 `assets/style.css` 顶部的 CSS 变量即可 |

---

## 六、想用 Quarto（与参考站完全一致的技术栈）

参考站 `bim382.github.io` 用的是 Quarto。若你希望以后用 `quarto render` 一条命令搞定、并自动支持交叉引用与 BibTeX 文献表：

1. 安装 [Quarto](https://quarto.org/docs/get-started/) 与 R（可选，用于代码块）。
2. 把 `blog/2026-09-30-钥匙/index.md` 改名为 `index.qmd`，在根目录加一个 `_quarto.yml`（`project: type: website`，`website: navbar`）。
3. 执行 `quarto render`，把生成的 `_site/` 目录内容推到 GitHub Pages。

两条路线产出的页面视觉效果接近，**本仓库的方案优点是零依赖、改完即传**，Quarto 的优点是可写代码、可交叉引用、可自动生成参考文献。

---

## 七、开启评论区（giscus，免费，基于 GitHub Discussions）

代码侧已经做好（`giscus.json` + `_templates/_comments.html`），文章页会自动带上评论区；只剩**两步只能在网页上完成**的操作：

1. **开启 Discussions**：仓库 → **Settings → General → Features** → 勾选 **Discussions**。（可顺手在 Discussions 里新建一个 `Comments` 分类，用默认的 `Announcements` 也可以。）
2. **安装 giscus App**：打开 <https://github.com/apps/giscus> → **Install** → 选 `guardcurry` → **Only select repositories** 勾选 `guardcurry.github.io` → **Install**。

拿到评论分类 ID（`category_id`）：

- **最省事**：告诉 AI 助手「giscus 装好了」，它会自动探测并填好；
- **自己来**：打开 <https://giscus.app>，`repository` 一栏填 `guardcurry/guardcurry.github.io`，页面下方会生成一段 `<script>`，把里面的 `data-category-id` 复制出来，填进 `giscus.json` 的 `"category_id": ""`。

然后双击 `build.cmd`，把改动（`blog/2026-09-30-钥匙/index.html`、`giscus.json`、`_templates/_comments.html`、`assets/style.css`、`build.ps1`）上传到仓库，文章页底部就会出现评论区。

> 说明：评论者需登录 GitHub 账号；评论以 Discussion 形式保存在你的仓库里，可随时在 GitHub 上管理或删除。
> `category_id` 为空时评论区自动隐藏，不会报错。想换配色/语言，改 `giscus.json` 里的 `theme`、`lang` 后重新构建即可。

---

## 八、分类栏目

在文章的 front matter 里写一行 `category: 儿童作文` 就够了，下次构建会自动：

1. 在左侧导航栏里加一个「儿童作文」入口；
2. 生成 `category/儿童作文/index.html` 列表页（模板 `_templates/category.html`）；
3. 在文章卡片和文章标题上方显示绿色分类标签。

分类是**从文章里自动推导**的，不需要在 `site.json` 里登记。想再开一个栏目（比如「随笔」「影评」），直接在新文章里写对应的 `category: xxx` 再构建即可。

另外两个可选字段：

| 字段 | 作用 |
| --- | --- |
| `glyph:` | 卡片封面上的那个大字。留空自动取标题第一个字，也可以填 emoji，例如 `glyph: 🐶` |
| `author_bio:` | 作者介绍，会渲染成文章标题下方的作者卡片（《小狗"年年"》用的就是它） |
