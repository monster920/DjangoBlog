#!/usr/bin/env bash
# DjangoBlog Docker Entrypoint脚本
# 优化用于Docker环境的初始化和服务启动

NAME="djangoblog"
DJANGODIR=/code/djangoblog
USER=root
GROUP=root
NUM_WORKERS=2  # 增加工作线程数以提高性能
DJANGO_WSGI_MODULE=djangoblog.wsgi

# 等待数据库服务就绪
wait_for_db() {
  echo "等待数据库服务就绪..."
  python -c "import os, sys; sys.exit(0 if os.environ.get('DJANGO_SKIP_DB_CHECK') else 1)" || {
    until python -c "import MySQLdb; MySQLdb.connect(host=os.environ.get('DJANGO_MYSQL_HOST', 'db'), port=int(os.environ.get('DJANGO_MYSQL_PORT', '3306')), user=os.environ.get('DJANGO_MYSQL_USER', 'root'), passwd=os.environ.get('DJANGO_MYSQL_PASSWORD', 'password'))" 2>/dev/null; do
      echo "数据库未就绪，等待5秒..."
      sleep 5
    done
  }
  echo "数据库服务就绪"
}

echo "Starting $NAME as `whoami`"

# 等待数据库服务
wait_for_db

cd $DJANGODIR

export PYTHONPATH=$DJANGODIR:$PYTHONPATH

# 执行初始化操作，添加更友好的错误处理
python manage.py makemigrations && \
python manage.py migrate && \
python manage.py collectstatic --noinput && \
python manage.py compress --force && \
python manage.py build_index && \
python manage.py compilemessages || {
    echo "初始化失败，请检查错误信息"
    exit 1
}

# 启动Gunicorn服务器，优化日志级别和超时设置
exec gunicorn ${DJANGO_WSGI_MODULE}:application \
--name $NAME \
--workers $NUM_WORKERS \
--user=$USER --group=$GROUP \
--bind 0.0.0.0:8000 \
--log-level=info \
--log-file=- \
--worker-class gevent \
--threads 4 \
--timeout 60  # 添加超时设置，避免进程挂起
