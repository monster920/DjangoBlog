# DjangoBlog

<p align="center">
  <a href="https://github.com/monster920/DjangoBlog"><img src="https://img.shields.io/github/license/monster920/djangoblog.svg" alt="license"></a>
  <a href="https://github.com/monster920/DjangoBlog"><img src="https://img.shields.io/github/stars/monster920/DjangoBlog" alt="stars"></a>
  <a href="https://github.com/monster920/DjangoBlog"><img src="https://img.shields.io/github/forks/monster920/DjangoBlog" alt="forks"></a>
</p>

<p align="center">
  <b>基于 Django 4.0 的现代化个人博客系统</b>
</p>

---

## ✨ 特性亮点

- **强大的内容管理**: 支持文章、独立页面、分类和标签的完整管理
- **Markdown 编辑器**: 内置强大的 Markdown 编辑器，支持代码语法高亮
- **评论系统**: 支持回复、评论分页等功能
- **灵活的侧边栏**: 可自定义展示最新文章、最多阅读、标签云等模块
- **插件系统**: 通过插件扩展博客功能，代码解耦，易于维护
- **SEO 优化**: 动态生成 Meta 标签和 JSON-LD 结构化数据
- **暗色主题**: 现代化暗色主题设计，护眼舒适
- **响应式设计**: 完美适配桌面端和移动端
- **性能优化**: 图片懒加载、异步解码优化

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 后端 | Python 3.10, Django 4.0 |
| 数据库 | MySQL / SQLite (可配置) |
| 缓存 | Redis |
| 前端 | HTML5, CSS3, JavaScript |
| 搜索 | Whoosh (内置) |
| 部署 | Docker, Docker Compose |

---

## 📌 环境要求

- Python 3.10+
- MySQL 5.6+ / SQLite (开发环境)
- Redis (可选，用于缓存)

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/monster920/DjangoBlog.git
cd DjangoBlog
```

### 2. 创建虚拟环境（推荐）

```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 配置数据库

编辑 `djangoblog/settings.py`，配置你的数据库连接：

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'djangoblog',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': '127.0.0.1',
        'PORT': 3306,
    }
}
```

如果是使用 SQLite（仅推荐用于开发环境）：

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

创建 MySQL 数据库：

```sql
CREATE DATABASE `djangoblog` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 初始化数据库

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. 创建管理员账户

```bash
python manage.py createsuperuser
```

按照提示输入用户名、邮箱和密码。

### 7. 运行项目

```bash
python manage.py runserver
```

访问 `http://127.0.0.1:8000/` 查看博客首页。

管理后台：`http://127.0.0.1:8000/admin/`

---

## 🔧 高级配置

### 配置邮件发送

编辑 `djangoblog/settings.py`：

```python
EMAIL_HOST = 'smtp.your-email.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'your-email@domain.com'
EMAIL_HOST_PASSWORD = 'your-password'
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
SERVER_EMAIL = EMAIL_HOST_USER
```

### 配置 Redis 缓存

设置环境变量或修改 settings.py：

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### 收集静态文件

```bash
python manage.py collectstatic --noinput
```

---

## 📁 项目结构

```
DjangoBlog/
├── blog/              # 博客核心应用
├── accounts/          # 用户账户应用
├── comments/          # 评论应用
├── plugins/           # 插件系统
│   ├── article_copyright/
│   ├── seo_optimizer/
│   ├── view_count/
│   └── ...
├── templates/         # 模板文件
├── djangoblog/       # 项目配置
│   ├── settings.py   # 配置文件
│   └── urls.py      # URL 路由
└── requirements.txt  # 依赖列表
```

---

## 🧩 插件系统

DjangoBlog 内置插件系统，支持功能扩展：

| 插件 | 功能 |
|------|------|
| view_count | 文章浏览统计 |
| seo_optimizer | SEO 优化 |
| article_copyright | 文章版权声明 |
| reading_time | 阅读时间预估 |
| image_lazy_loading | 图片懒加载 |
| external_links | 外部链接处理 |
| article_recommendation | 文章推荐 |

---

## 🐳 Docker 部署

### 使用 docker-compose（推荐）

```bash
# 克隆项目
git clone https://github.com/monster920/DjangoBlog.git
cd DjangoBlog

# 启动服务
docker-compose up -d
```

访问 `http://localhost:8000/`

### 构建 Docker 镜像

```bash
docker build -t djangoblog .
docker run -d -p 8000:8000 djangoblog
```

---

## 📝 使用指南

### 创建文章

1. 登录管理后台 `/admin/`
2. 进入「文章」管理
3. 点击「添加文章」
4. 填写标题、内容，选择分类和标签
5. 点击「保存并发布」

### 配置侧边栏

1. 进入管理后台
2. 找到「侧边栏」配置
3. 自定义需要显示的组件

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📧 联系方式

- **作者**: suisui
- **GitHub**: [monster920](https://github.com/monster920)
- **邮箱**: jh070711@126.com
