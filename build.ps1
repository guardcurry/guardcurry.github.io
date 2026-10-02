# =====================================================================
#  build.ps1 - static blog generator (no dependencies)
#
#  Usage:   pwsh -File .\build.ps1
#           (or right-click -> Run with PowerShell)
#
#  Reads:   site.json
#           _templates\*.html        (page templates + navbar/footer partials)
#           about\index.md           (about page source)
#           blog\<slug>\index.md     (one folder per post)
#  Writes:  index.html, blog\index.html, blog\<slug>\index.html,
#           about\index.html, .nojekyll
# =====================================================================

$ErrorActionPreference = 'Stop'
$Root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if (-not (Test-Path -LiteralPath (Join-Path $Root 'site.json'))) {
    throw "site.json not found next to build.ps1. Run the script from the site folder."
}
Set-Location $Root

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Read-Text([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { throw "Missing file: $Path" }
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-Text([string]$Path, [string]$Text) {
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Text, $Utf8NoBom)
}

function Esc([string]$s) {
    if ($null -eq $s) { return '' }
    $s = $s -replace '&', '&amp;'
    $s = $s -replace '<', '&lt;'
    $s = $s -replace '>', '&gt;'
    return $s
}

function Inline([string]$s) {
    $s = Esc $s
    $s = [regex]::Replace($s, '\*\*(.+?)\*\*', '<strong>$1</strong>')
    $s = [regex]::Replace($s, '`(.+?)`', '<code>$1</code>')
    $s = [regex]::Replace($s, '\[([^\]]+)\]\(([^)]+)\)', '<a href="$2">$1</a>')
    return $s
}

# --- tiny markdown -> html (paragraphs, headings, quotes, lists) -----
function Convert-Markdown([string]$md) {
    $md = $md -replace "`r`n", "`n"
    $chunks = [regex]::Split($md, '\n\s*\n')
    $out = New-Object System.Text.StringBuilder
    foreach ($chunk in $chunks) {
        $t = $chunk.Trim()
        if ($t.Length -eq 0) { continue }

        if ($t.StartsWith('### ')) {
            [void]$out.AppendLine('<h3>' + (Inline $t.Substring(4).Trim()) + '</h3>')
        }
        elseif ($t.StartsWith('## ')) {
            [void]$out.AppendLine('<h2>' + (Inline $t.Substring(3).Trim()) + '</h2>')
        }
        elseif ($t.StartsWith('# ')) {
            [void]$out.AppendLine('<h2>' + (Inline $t.Substring(2).Trim()) + '</h2>')
        }
        elseif ($t.StartsWith('>')) {
            $q = ($t -split "`n" | ForEach-Object { $_ -replace '^\s*>\s?', '' }) -join "`n"
            [void]$out.AppendLine('<blockquote><p>' + (Inline $q) + '</p></blockquote>')
        }
        elseif ($t -match '^[-*]\s') {
            [void]$out.AppendLine('<ul>')
            foreach ($li in ($t -split "`n")) {
                $item = $li.Trim()
                if ($item -match '^[-*]\s+(.*)$') {
                    [void]$out.AppendLine('<li>' + (Inline $Matches[1]) + '</li>')
                }
            }
            [void]$out.AppendLine('</ul>')
        }
        else {
            $one = ($t -split "`n") -join ''
            [void]$out.AppendLine('<p>' + (Inline $one) + '</p>')
        }
    }
    return $out.ToString().TrimEnd()
}

# --- front matter ----------------------------------------------------
function Get-Post([string]$MdPath, [string]$Slug) {
    $raw = (Read-Text $MdPath) -replace "`r`n", "`n"
    $lines = $raw -split "`n"
    $meta = @{}
    $bodyStart = 0
    if ($lines.Count -gt 0 -and $lines[0].Trim() -eq '---') {
        for ($i = 1; $i -lt $lines.Count; $i++) {
            if ($lines[$i].Trim() -eq '---') { $bodyStart = $i + 1; break }
            if ($lines[$i] -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$') {
                $meta[$Matches[1]] = $Matches[2].Trim()
            }
        }
    }
    $body = ''
    if ($bodyStart -lt $lines.Count) {
        $body = ($lines[$bodyStart..($lines.Count - 1)]) -join "`n"
    }
    return [pscustomobject]@{
        Slug        = $Slug
        Meta        = $meta
        Body        = $body
        Content     = Convert-Markdown $body
        Title       = if ($meta['title']) { $meta['title'] } else { $Slug }
        Subtitle    = if ($meta['subtitle']) { $meta['subtitle'] } else { '' }
        Author      = if ($meta['author']) { $meta['author'] } else { '' }
        Date        = if ($meta['date']) { $meta['date'] } else { '' }
        DisplayDate = if ($meta['display_date']) { $meta['display_date'] } else { $meta['date'] }
        Excerpt     = if ($meta['excerpt']) { $meta['excerpt'] } else { '' }
        Dateline    = if ($meta['dateline']) { $meta['dateline'] } else { '' }
        CiteKey     = if ($meta['cite_key']) { $meta['cite_key'] } else { 'ref' }
        Tags        = if ($meta['tags']) { @($meta['tags'] -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }) } else { @() }
    }
}

function Apply-Tokens([string]$Text, [hashtable]$Map) {
    foreach ($k in $Map.Keys) {
        $Text = $Text.Replace('{{' + $k + '}}', [string]$Map[$k])
    }
    return $Text
}

function New-TagHtml($Tags) {
    $sb = New-Object System.Text.StringBuilder
    foreach ($tag in $Tags) {
        [void]$sb.Append('<span class="tag">' + (Esc $tag) + '</span>')
    }
    return $sb.ToString()
}

function Get-CommentsHtml($g, [string]$Tpl) {
    if ($null -eq $g) { return '' }
    if (-not $g.enabled) { return '' }
    if (-not $g.repo_id -or -not $g.category_id) { return '' }
    $html = Apply-Tokens $Tpl @{
        'G_REPO'           = $g.repo
        'G_REPO_ID'        = $g.repo_id
        'G_CATEGORY'       = $g.category
        'G_CATEGORY_ID'    = $g.category_id
        'G_MAPPING'        = $g.mapping
        'G_REACTIONS'      = $g.reactions_enabled
        'G_INPUT_POSITION' = $g.input_position
        'G_THEME'          = $g.theme
        'G_LANG'           = $g.lang
    }
    return $html.Trim()
}

function New-PostListHtml($Posts, [string]$RootPrefix) {
    $sb = New-Object System.Text.StringBuilder
    $i = 0
    foreach ($p in $Posts) {
        $hue = (200 + ($i * 47)) % 360
        $glyph = '.'
        if ($p.Title.Length -gt 0) { $glyph = $p.Title.Substring(0, 1) }
        $url = $RootPrefix + 'blog/' + $p.Slug + '/index.html'
        [void]$sb.AppendLine('    <li class="tile reveal" style="--h:' + $hue + '">')
        [void]$sb.AppendLine('      <a class="tile-link" href="' + $url + '">')
        [void]$sb.AppendLine('        <span class="tile-thumb"><span class="tile-glyph">' + (Esc $glyph) + '</span></span>')
        [void]$sb.AppendLine('        <span class="tile-body">')
        [void]$sb.AppendLine('          <span class="tile-date">' + (Esc $p.DisplayDate) + '</span>')
        [void]$sb.AppendLine('          <span class="tile-title">' + (Esc $p.Title) + '</span>')
        if ($p.Excerpt) {
            [void]$sb.AppendLine('          <span class="tile-excerpt">' + (Esc $p.Excerpt) + '</span>')
        }
        if ($p.Tags.Count -gt 0) {
            [void]$sb.AppendLine('          <span class="tags">' + (New-TagHtml $p.Tags) + '</span>')
        }
        [void]$sb.AppendLine('        </span>')
        [void]$sb.AppendLine('      </a>')
        [void]$sb.AppendLine('    </li>')
        $i++
    }
    return $sb.ToString().TrimEnd()
}

# =====================================================================
#  main
# =====================================================================
$site = (Read-Text (Join-Path $Root 'site.json')) | ConvertFrom-Json
$navbarTpl = Read-Text (Join-Path $Root '_templates\_navbar.html')
$footerTpl = Read-Text (Join-Path $Root '_templates\_footer.html')
$postTpl = Read-Text (Join-Path $Root '_templates\post.html')
$homeTpl = Read-Text (Join-Path $Root '_templates\home.html')
$listTpl = Read-Text (Join-Path $Root '_templates\list.html')
$pageTpl = Read-Text (Join-Path $Root '_templates\page.html')
$commentsTpl = Read-Text (Join-Path $Root '_templates\_comments.html')

# giscus comment config (optional file; comments only render when both IDs are set)
$giscusPath = Join-Path $Root 'giscus.json'
$giscus = if (Test-Path -LiteralPath $giscusPath) { (Read-Text $giscusPath) | ConvertFrom-Json } else { $null }

$repo = ([string]$site.repo).TrimEnd('/')
$siteUrl = ([string]$site.site_url).TrimEnd('/')
$year = (Get-Date).Year

# --- collect posts ---------------------------------------------------
$posts = @()
$postDirs = Get-ChildItem -Path (Join-Path $Root 'blog') -Directory -ErrorAction SilentlyContinue
foreach ($dir in $postDirs) {
    $md = Join-Path $dir.FullName 'index.md'
    if (Test-Path -LiteralPath $md) {
        $posts += Get-Post $md $dir.Name
    }
}
$posts = @($posts | Sort-Object -Property Date -Descending)

function Get-Chrome([string]$RootPrefix, [string]$Active, [string]$Citation) {
    $nav = Apply-Tokens $navbarTpl @{
        'ROOT'         = $RootPrefix
        'SITE_TITLE'   = $site.site_title
        'REPO'         = $repo
        'ACTIVE_HOME'  = $(if ($Active -eq 'home') { ' class="active"' } else { '' })
        'ACTIVE_BLOG'  = $(if ($Active -eq 'blog') { ' class="active"' } else { '' })
        'ACTIVE_ABOUT' = $(if ($Active -eq 'about') { ' class="active"' } else { '' })
    }
    $foot = Apply-Tokens $footerTpl @{
        'ROOT'           = $RootPrefix
        'SITE_TITLE'     = $site.site_title
        'SITE_DESC'      = $site.site_desc
        'AUTHOR'         = $site.author
        'REPO'           = $repo
        'YEAR'           = $year
        'CITATION_BLOCK' = $Citation
    }
    return @{ Nav = $nav.TrimEnd(); Foot = $foot.TrimEnd() }
}

# --- post pages ------------------------------------------------------
foreach ($p in $posts) {
    $url = "$siteUrl/blog/$($p.Slug)/"
    $bib = @"
<pre>@online{$($p.CiteKey),
  author = {$($p.Author)},
  title  = {$($p.Title)},
  date   = {$($p.Date)},
  url    = {$url}
}</pre>
"@
    $bib = $bib.Trim()
    $chrome = Get-Chrome '../../' 'blog' $bib
    $html = Apply-Tokens $postTpl @{
        'NAVBAR'       = $chrome.Nav
        'FOOTER'       = $chrome.Foot
        'ROOT'         = '../../'
        'SITE_TITLE'   = $site.site_title
        'SITE_DESC'    = $site.site_desc
        'REPO'         = $repo
        'TITLE'        = Esc $p.Title
        'SUBTITLE'     = Esc $p.Subtitle
        'AUTHOR'       = Esc $p.Author
        'DISPLAY_DATE' = Esc $p.DisplayDate
        'EXCERPT'      = Esc $p.Excerpt
        'TAGS_HTML'    = New-TagHtml $p.Tags
        'TAG_COUNT'    = $p.Tags.Count
        'CONTENT'      = $p.Content
        'DATELINE'     = Esc $p.Dateline
        'SLUG'         = $p.Slug
        'YEAR'         = $year
        'COMMENTS'     = Get-CommentsHtml $giscus $commentsTpl
    }
    $out = Join-Path $Root ("blog\{0}\index.html" -f $p.Slug)
    Write-Text $out $html
    Write-Host ("  post   -> blog/{0}/index.html" -f $p.Slug)
}

# --- home hero cover (optional file) ---------------------------------
# Drop a file at assets\cover.jpg (or .jpeg/.png/.webp) and rebuild:
# it becomes the home page header cover. Article pages never show it.
$coverPath = ''
foreach ($ext in @('jpg', 'jpeg', 'png', 'webp')) {
    if (Test-Path -LiteralPath (Join-Path $Root ("assets\cover.{0}" -f $ext))) {
        $coverPath = "assets/cover.$ext"
        break
    }
}
$coverBlock = ''
if ($coverPath) {
    $coverBlock = '  <figure class="hero-cover" style="background-image:url(''' + $coverPath + ''')" role="img" aria-label="cover"></figure>'
    Write-Host ('  cover  -> ' + $coverPath)
} else {
    Write-Host '  cover  -> none (drop assets\cover.jpg to enable)'
}

# --- home page -------------------------------------------------------
$chrome = Get-Chrome '' 'home' ''
$homeHtml = Apply-Tokens $homeTpl @{
    'NAVBAR'      = $chrome.Nav
    'FOOTER'      = $chrome.Foot
    'ROOT'        = ''
    'SITE_TITLE'  = $site.site_title
    'SITE_DESC'   = $site.site_desc
    'AUTHOR'      = $site.author
    'REPO'        = $repo
    'YEAR'        = $year
    'COVER_BLOCK' = $coverBlock
    'POSTS_HTML'  = New-PostListHtml $posts ''
}
Write-Text (Join-Path $Root 'index.html') $homeHtml
Write-Host '  page   -> index.html'

# --- blog list page --------------------------------------------------
$chrome = Get-Chrome '../' 'blog' ''
$list = Apply-Tokens $listTpl @{
    'NAVBAR'      = $chrome.Nav
    'FOOTER'      = $chrome.Foot
    'ROOT'        = '../'
    'SITE_TITLE'  = $site.site_title
    'SITE_DESC'   = $site.site_desc
    'AUTHOR'      = $site.author
    'REPO'        = $repo
    'YEAR'        = $year
    'POST_COUNT'  = $posts.Count
    'POSTS_HTML'  = New-PostListHtml $posts '../'
}
Write-Text (Join-Path $Root 'blog\index.html') $list
Write-Host '  page   -> blog/index.html'

# --- about page ------------------------------------------------------
$aboutMd = Join-Path $Root 'about\index.md'
if (Test-Path -LiteralPath $aboutMd) {
    $about = Get-Post $aboutMd 'about'
    $chrome = Get-Chrome '../' 'about' ''
    $html = Apply-Tokens $pageTpl @{
        'NAVBAR'      = $chrome.Nav
        'FOOTER'      = $chrome.Foot
        'ROOT'        = '../'
        'SITE_TITLE'  = $site.site_title
        'SITE_DESC'   = $site.site_desc
        'AUTHOR'      = $site.author
        'REPO'        = $repo
        'YEAR'        = $year
        'PAGE_TITLE'  = Esc $about.Title
        'PAGE_DESC'   = Esc $about.Subtitle
        'CONTENT'     = $about.Content
    }
    Write-Text (Join-Path $Root 'about\index.html') $html
    Write-Host '  page   -> about/index.html'
}

# --- .nojekyll (stop GitHub Pages from running Jekyll) ---------------
$nojekyll = Join-Path $Root '.nojekyll'
if (-not (Test-Path -LiteralPath $nojekyll)) {
    Write-Text $nojekyll ''
    Write-Host '  file   -> .nojekyll'
}

Write-Host ''
Write-Host ("Done. {0} post(s) built." -f $posts.Count)
