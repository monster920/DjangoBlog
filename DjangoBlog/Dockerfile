# 基础镜像（使用阿里云Docker镜像源）
FROM python:3.12

# 设置Python环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

# 设置工作目录
WORKDIR /code/djangoblog/

# 安装系统依赖（添加中文支持）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    gettext \
    locales \
    curl \
    vim && \
    # 配置中文支持
    locale-gen zh_CN.UTF-8 && \
    echo "LANG=zh_CN.UTF-8" > /etc/default/locale && \
    # 清理缓存减小镜像体积
    rm -rf /var/lib/apt/lists/*

# 升级pip并安装依赖（使用阿里云镜像源）
COPY requirements.txt ./
RUN pip install --upgrade pip setuptools wheel -i https://mirrors.aliyun.com/pypi/simple/ && \
    pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ && \
    pip install --no-cache-dir gunicorn[gevent] -i https://mirrors.aliyun.com/pypi/simple/ && \
    # 清理pip缓存
    pip cache purge

# 复制项目文件
COPY . .

# 创建必要的目录并设置权限
RUN mkdir -p /code/djangoblog/logs /code/djangoblog/uploads /code/djangoblog/collectedstatic && \
    chmod -R 755 /code/djangoblog && \
    chmod +x /code/djangoblog/deploy/entrypoint.sh

# 确保docker_start.sh脚本存在且可执行
RUN if [ ! -f "/code/djangoblog/bin/docker_start.sh" ]; then \
        mkdir -p /code/djangoblog/bin && \
        echo '#!/bin/bash' > /code/djangoblog/bin/docker_start.sh && \
        echo 'sh /code/djangoblog/deploy/entrypoint.sh' >> /code/djangoblog/bin/docker_start.sh && \
        chmod +x /code/djangoblog/bin/docker_start.sh; \
    else \
        chmod +x /code/djangoblog/bin/docker_start.sh; \
    fi

# 暴露端口
EXPOSE 8000

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# 设置入口点（与docker-compose配置兼容）
ENTRYPOINT ["/code/djangoblog/deploy/entrypoint.sh"]
CMD ["bash", "/code/djangoblog/bin/docker_start.sh"]
