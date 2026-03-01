# DjangoBlog Docker一键部署指南

本项目支持使用Docker和Docker Compose进行一键部署，下面是详细的部署步骤和配置说明。

## 前提条件

- 已安装Docker（推荐版本：20.10+）
- 已安装Docker Compose（推荐版本：1.29+）
- 确保主机上的80端口、443端口、3306端口和6379端口未被占用

## 快速开始

### 1. 克隆项目（如果尚未克隆）

```bash
git clone https://github.com/yourusername/djangoblog.git
cd djangoblog
```

### 2. 启动服务

进入项目的Docker配置目录：

```bash
cd DjangoBlog/deploy/docker-compose
```

使用Docker Compose启动所有服务：

```bash
docker-compose up -d
```

这将自动：
- 构建Django应用镜像
- 启动MySQL数据库容器
- 启动Redis缓存容器
- 启动Nginx反向代理容器
- 启动Django应用容器
- 执行数据库迁移、静态文件收集等初始化操作

### 3. 访问网站

服务启动后，可以通过以下地址访问网站：

```
http://localhost  # 通过Nginx访问（推荐）
# 或者
http://localhost:8000  # 直接访问Django应用
```

## 配置说明

### 环境变量

主要的环境变量已在`docker-compose.yml`文件中配置：

- `DJANGO_MYSQL_DATABASE`: 数据库名称
- `DJANGO_MYSQL_USER`: 数据库用户名
- `DJANGO_MYSQL_PASSWORD`: 数据库密码
- `DJANGO_MYSQL_HOST`: 数据库主机
- `DJANGO_MYSQL_PORT`: 数据库端口
- `DJANGO_REDIS_URL`: Redis连接地址

如需修改这些配置，请编辑`docker-compose.yml`文件。

### 持久化存储

项目使用Docker卷进行数据持久化：

- MySQL数据存储在`./bin/datas/mysql/`
- 静态文件存储在`./collectedstatic/`
- 日志文件存储在`./logs/`
- 上传文件存储在`./uploads/`

### 容器说明

- **db**: MySQL数据库容器
- **redis**: Redis缓存容器
- **djangoblog**: Django应用容器
- **nginx**: Nginx反向代理容器

## 常用命令

### 查看服务状态

```bash
docker-compose ps
```

### 查看日志

```bash
# 查看所有容器日志
docker-compose logs

# 查看指定容器日志
docker-compose logs djangoblog

# 实时查看日志
docker-compose logs -f djangoblog
```

### 停止服务

```bash
docker-compose down
```

### 重启服务

```bash
docker-compose restart
```

### 重新构建镜像并启动

```bash
docker-compose up -d --build
```

## 注意事项

1. **首次部署**：首次启动时，系统会自动创建数据库、执行迁移、收集静态文件等初始化操作，可能需要几分钟时间。

2. **中文支持**：Docker镜像已配置中文支持，确保网站内容能正确显示中文。

3. **安全设置**：
   - 生产环境中，请修改`docker-compose.yml`中的数据库密码
   - 建议在`settings.py`中设置`DEBUG = False`
   - 修改`ALLOWED_HOSTS`为您的实际域名

4. **备份数据**：定期备份`./bin/datas/mysql/`目录以保存数据库数据。

5. **性能优化**：
   - 可根据实际需求调整`docker_start.sh`中的Gunicorn工作进程数和线程数
   - 对于高流量网站，建议配置Nginx的缓存功能

## 故障排查

### 常见问题

1. **数据库连接失败**：
   - 检查环境变量配置是否正确
   - 确保MySQL容器正常运行
   - 查看djangoblog容器日志获取详细错误信息

2. **静态文件加载失败**：
   - 确认`collectstatic`命令已成功执行
   - 检查Nginx配置和卷挂载是否正确

3. **网站无法访问**：
   - 检查端口是否被占用
   - 查看各容器日志
   - 确认防火墙设置

### 查看详细日志

```bash
docker-compose logs djangoblog | grep -i error
```

## 扩展功能

### 配置HTTPS

1. 将SSL证书放置在`./bin/certs/`目录下
2. 修改Nginx配置文件`./bin/nginx.conf`，启用HTTPS配置
3. 重启Nginx容器：`docker-compose restart nginx`

### 使用自定义域名

1. 修改`docker-compose.yml`中的`CSRF_TRUSTED_ORIGINS`环境变量
2. 更新Nginx配置文件中的域名设置
3. 重启相关容器

---

通过以上步骤，您可以轻松地在Docker环境中部署和运行DjangoBlog应用。如有任何问题，请参考项目文档或提交Issue。