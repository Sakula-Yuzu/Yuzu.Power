# Yuzu.Power 官网

Yuzu.Power（柚.Power）轻量级安卓功率记录应用的官方宣传站点。

纯静态页面，可直接部署到 **GitHub Pages**。

## 本地预览

用任意静态服务器打开即可，例如：

```bash
# Python
python -m http.server 8080

# 或 Node
npx serve .
```

然后访问 http://localhost:8080

## 部署到 GitHub Pages

### 方式一：项目 Pages（推荐）

1. 新建仓库，例如 `Yuzu.Power-site` 或把本目录内容推到已有仓库的 `gh-pages` 分支 / `docs` 文件夹。
2. 仓库 Settings → Pages → Source 选择对应分支和目录。
3. 访问 `https://<用户名>.github.io/<仓库名>/`

### 方式二：用户/组织主页

把文件放在 `username.github.io` 仓库的根目录，即可通过 `https://username.github.io` 访问。

### 注意

- 本站使用相对路径，既适合仓库根目录部署，也适合子路径部署。
- 已包含 `og.jpg` 与 `favicon.svg`，便于分享与收藏。
- 下载链接指向官方 GitHub Releases，本站不托管 APK。

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 主页面 |
| `site.css` | 样式 |
| `site.js` | 交互（演示仪表、移动端菜单等） |
| `shots/` | 界面截图 |
| `favicon.svg` | 图标 |
| `og.jpg` | 社交分享图 |

作者：[Sakula_小柚柚](https://github.com/Sakula-Yuzu) · 应用仓库：[Yuzu.Power](https://github.com/Sakula-Yuzu/Yuzu.Power)
