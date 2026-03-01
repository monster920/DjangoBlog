from django.core.management.base import BaseCommand
from blog.models import Article


class Command(BaseCommand):
    help = '为所有文章生成或重新生成摘要'

    def handle(self, *args, **options):
        # 获取所有文章，包括已有摘要的文章，以便重新生成
        all_articles = Article.objects.all()
        count = all_articles.count()
        
        self.stdout.write(f'开始为 {count} 篇文章生成/重新生成摘要...')
        
        processed = 0
        for article in all_articles:
            # 强制清空摘要，确保会重新生成
            article.summary = None
            # 直接调用generate_summary方法并保存，不通过save方法的自动生成逻辑
            article.summary = article.generate_summary()
            article.save(update_fields=['summary'])  # 只更新summary字段
            processed += 1
            if processed % 10 == 0:
                self.stdout.write(f'已处理 {processed}/{count} 篇文章')
        
        self.stdout.write(self.style.SUCCESS(f'摘要重新生成完成！共处理了 {processed} 篇文章。'))