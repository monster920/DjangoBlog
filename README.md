# DjangoBlog

<p align="center">
  <a href="https://github.com/monster920/DjangoBlog"><img src="https://img.shields.io/github/license/monster920/djangoblog.svg" alt="license"></a>
</p>

<p align="center">
  <b>基于 Django 的个人博客系统</b>
</p>

---

## ✨ 特性

- Markdown 文章编辑与发布
- 分类、标签管理
- 评论系统
- 侧边栏组件
- 插件系统
- 暗色主题界面
- 响应式设计

---

## 🛠️ 技术栈

- **后端**: Python 3.10, Django 4.0
- **数据库**: MySQL, SQLite (可配置)
- **缓存**: Redis
- **前端**: HTML5, CSS3, JavaScript

---

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/monster920/DjangoBlog.git
cd DjangoBlog

# 安装依赖
pip install -r requirements.txt

# 配置数据库 (编辑 djangoblog/settings.py)

# 初始化
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# 运行
python manage.py runserver
```

访问 `http://127.0.0.1:8000/` 即可查看。

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 作者

- **suisui** - [monster920](https://github.com/monster920)
- Email: jh070711@126.com
