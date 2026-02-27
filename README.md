# DjangoBlog

<p align="center">
  <a href="https://github.com/monster920/DjangoBlog"><img src="https://img.shields.io/github/license/monster920/djangoblog.svg" alt="license"></a>
</p>

<p align="center">
  <b>基于 Django 的个人博客系统 - 优化美化版</b>
</p>

---

## 📝 说明

本项目基于 [liangliangyy/DjangoBlog](https://github.com/liangliangyy/DjangoBlog) 开源项目进行修改优化。

### 主要优化内容

- **界面美化**: 采用现代化暗色主题设计
- **用户体验**: 优化导航栏、卡片样式、响应式布局
- **视觉效果**: 添加星空背景、渐变边框、毛玻璃效果
- **细节打磨**: 优化字体、排版、间距、动画效果
- **Bug修复**: 修复若干已知问题

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

## 🙏 致谢

- 感谢原项目作者 [liangliangyy](https://github.com/liangliangyy) 的开源贡献
- 感谢 JetBrains 提供的开发工具支持
