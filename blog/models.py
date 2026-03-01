import logging
import re
from abc import abstractmethod

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.urls import reverse
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from mdeditor.fields import MDTextField
from uuslug import slugify

from djangoblog.utils import cache_decorator, cache
from djangoblog.utils import get_current_site

logger = logging.getLogger(__name__)


class LinkShowType(models.TextChoices):
    I = ('i', _('index'))
    L = ('l', _('list'))
    P = ('p', _('post'))
    A = ('a', _('all'))
    S = ('s', _('slide'))


class BaseModel(models.Model):
    id = models.AutoField(primary_key=True)
    creation_time = models.DateTimeField(_('creation time'), default=now)
    last_modify_time = models.DateTimeField(_('modify time'), default=now)

    def save(self, *args, **kwargs):
        is_update_views = isinstance(
            self, 
            Article) and 'update_fields' in kwargs and kwargs['update_fields'] == ['views']
        if is_update_views:
            Article.objects.filter(pk=self.pk).update(views=self.views)
        else:
            if 'slug' in self.__dict__:
                slug = getattr(
                    self, 'title') if 'title' in self.__dict__ else getattr(
                    self, 'name')
                setattr(self, 'slug', slugify(slug))
            super().save(*args, **kwargs)

    def get_full_url(self):
        site = get_current_site().domain
        url = "https://{site}{path}".format(site=site,
                                            path=self.get_absolute_url())
        return url

    class Meta:
        abstract = True

    @abstractmethod
    def get_absolute_url(self):
        pass


class Article(BaseModel):
    """文章"""
    STATUS_CHOICES = (
        ('d', _('Draft')),
        ('p', _('Published')),
    )
    COMMENT_STATUS = (
        ('o', _('Open')),
        ('c', _('Close')),
    )
    TYPE = (
        ('a', _('Article')),
        ('p', _('Page')),
    )
    title = models.CharField(_('title'), max_length=200, unique=True)
    body = MDTextField(_('body'))
    summary = models.TextField(_('summary'), blank=True, null=True, help_text='文章摘要，为空时将自动从内容生成')
    pub_time = models.DateTimeField(
        _('publish time'), blank=False, null=False, default=now)
    status = models.CharField(
        _('status'),
        max_length=1,
        choices=STATUS_CHOICES,
        default='p')
    comment_status = models.CharField(
        _('comment status'),
        max_length=1,
        choices=COMMENT_STATUS,
        default='o')
    type = models.CharField(_('type'), max_length=1, choices=TYPE, default='a')
    views = models.PositiveIntegerField(_('views'), default=0)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_('author'),
        blank=False,
        null=False,
        on_delete=models.CASCADE)
    article_order = models.IntegerField(
        _('order'), blank=False, null=False, default=0)
    show_toc = models.BooleanField(_('show toc'), blank=False, null=False, default=False)
    category = models.ForeignKey(
        'Category',
        verbose_name=_('category'),
        on_delete=models.CASCADE,
        blank=False,
        null=False)
    tags = models.ManyToManyField('Tag', verbose_name=_('tag'), blank=True)

    def generate_summary(self):
        """智能生成文章摘要，提取文章核心信息"""
        if not self.body:
            return ''
        
        try:
            import re
            from django.utils.html import strip_tags
            from django.template.defaultfilters import truncatechars
            
            # 处理原始文本，去除特殊语法和格式
            text = self.body
            
            # 1. 保留标题信息（标题通常包含文章核心内容）
            titles = re.findall(r'^#+(.*?)$', text, flags=re.MULTILINE)
            title_text = ' '.join([t.strip() for t in titles]) if titles else ''
            
            # 2. 移除Markdown语法元素
            text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)  # 移除标题标记
            text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)   # 移除引用标记
            text = re.sub(r'^```[\s\S]*?```$', '', text, flags=re.MULTILINE)  # 移除代码块
            text = re.sub(r'^---\s*$', '', text, flags=re.MULTILINE)  # 移除分隔线
            text = re.sub(r'!\[.*?\]\(.*?\)', '', text)  # 移除图片
            text = re.sub(r'\[([^\]]+)\]\([^)]+\)', '\1', text)  # 链接，保留文本
            
            # 3. 去除HTML标签
            plain_text = strip_tags(text)
            
            # 4. 清理空白字符
            plain_text = ' '.join(plain_text.split())
            
            if plain_text and len(plain_text.strip()) > 0:
                # 获取博客设置中的摘要长度
                from djangoblog.utils import get_blog_setting
                blogsetting = get_blog_setting()
                max_summary_length = blogsetting.article_sub_length if blogsetting else 300
                
                # 5. 智能摘要提取算法
                # 分割文章为句子
                sentences = re.split(r'[。！？.!?]\s*', plain_text)
                
                # 计算句子的重要性分数
                important_sentences = []
                for i, sentence in enumerate(sentences):
                    sentence = sentence.strip()
                    if not sentence or len(sentence) < 10:
                        continue
                        
                    # 评分标准：
                    # 1. 位置权重（开头和结尾的句子更重要）
                    position_score = 1.0
                    if i == 0:  # 第一句通常是主题句
                        position_score = 2.5
                    elif i <= 3:  # 前几句
                        position_score = 1.8
                    elif i >= len(sentences) - 2:  # 最后几句
                        position_score = 1.5
                    elif i >= len(sentences) - 4:  # 倒数几句
                        position_score = 1.2
                    
                    # 2. 长度权重（适中长度的句子通常包含更多信息）
                    length = len(sentence)
                    length_score = 0.5
                    if 20 <= length <= 100:
                        length_score = 1.2
                    elif 100 < length <= 150:
                        length_score = 1.0
                    
                    # 3. 包含关键标点的句子（如分号、冒号）可能有总结性质
                    punctuation_score = 1.0
                    if '：' in sentence or ';' in sentence or ':' in sentence:
                        punctuation_score = 1.3
                    
                    # 4. 包含数字的句子可能包含关键信息
                    number_score = 1.0
                    if any(char.isdigit() for char in sentence):
                        number_score = 1.2
                    
                    # 5. 包含关键词的句子更重要
                    keyword_score = 1.0
                    keywords = ['介绍', '实现', '方法', '技术', '结论', '总结', '特点', '优势', '原理']
                    for keyword in keywords:
                        if keyword in sentence:
                            keyword_score += 0.3
                    
                    # 6. 以特定词开头的句子可能是主题句
                    start_words = ['本文', '本文将', '本文介绍', '本文讨论', '本文研究', '总的来说', '综上所述', '总结']
                    start_word_score = 1.0
                    for word in start_words:
                        if sentence.startswith(word):
                            start_word_score = 2.0
                            break
                    
                    # 综合得分
                    score = position_score * length_score * punctuation_score * number_score * keyword_score * start_word_score
                    important_sentences.append((score, sentence))
                
                # 按重要性排序并选择重要句子
                important_sentences.sort(reverse=True, key=lambda x: x[0])
                
                # 构建摘要
                summary_text = ''
                current_length = len(title_text)
                
                # 首先添加标题信息（如果有）
                if title_text and current_length < max_summary_length:
                    summary_text = title_text + '。'
                    current_length = len(summary_text)
                
                # 然后添加重要句子
                for _, sentence in important_sentences:
                    # 检查句子是否已经在摘要中
                    if sentence in summary_text:
                        continue
                    
                    # 检查添加后是否超出长度限制
                    if current_length + len(sentence) + 1 <= max_summary_length:  # +1 是标点符号
                        if summary_text:
                            summary_text += '。' + sentence
                        else:
                            summary_text = sentence
                        current_length = len(summary_text)
                    else:
                        # 如果剩余空间不足，尝试截断当前句子
                        remaining_space = max_summary_length - current_length - 3  # -3 是省略号
                        if remaining_space > 10:  # 确保至少能添加有意义的内容
                            summary_text += '。' + sentence[:remaining_space] + '...'
                            break
                        else:
                            break
                
                # 确保摘要不为空且格式正确
                if not summary_text or len(summary_text.strip()) < 20:
                    # 如果智能提取失败，回退到更可靠的方法：提取前300字符并在合适位置截断
                    temp_text = plain_text[:max_summary_length + 100]  # 先截取更长的片段
                    
                    # 寻找合适的句尾
                    end_positions = []
                    for char in ['。', '！', '？', '. ', '! ', '? ']:
                        pos = temp_text.rfind(char, 0, max_summary_length)
                        if pos > max_summary_length * 0.6:  # 确保至少截取到60%的目标长度
                            end_positions.append(pos)
                    
                    if end_positions:
                        end_pos = max(end_positions)
                        summary_text = plain_text[:end_pos+1]
                    else:
                        # 仍然找不到合适的句尾，使用截断函数
                        summary_text = truncatechars(plain_text, max_summary_length)
                
                # 确保摘要以句号结尾
                if summary_text and summary_text[-1] not in '。！？.!?':
                    summary_text += '...'
                
                return summary_text
        except Exception as e:
            logger.error(f"生成摘要出错: {e}")
        
        # 出错时返回默认摘要
        fallback_text = strip_tags(self.body) if self.body else ''
        return truncatechars(fallback_text, 200) + '...' if len(fallback_text) > 200 else fallback_text

    def body_to_string(self):
        return self.body

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-article_order', '-pub_time']
        verbose_name = _('article')
        verbose_name_plural = verbose_name
        get_latest_by = 'id'

    def get_absolute_url(self):
        return reverse('blog:detailbyid', kwargs={
            'article_id': self.id,
            'year': self.creation_time.year,
            'month': self.creation_time.month,
            'day': self.creation_time.day
        })

    @cache_decorator(60 * 60 * 10)
    def get_category_tree(self):
        tree = self.category.get_category_tree()
        names = list(map(lambda c: (c.name, c.get_absolute_url()), tree))

        return names

    def save(self, *args, **kwargs):
        is_update_views = isinstance(
            self, 
            Article) and 'update_fields' in kwargs and kwargs['update_fields'] == ['views']
        if is_update_views:
            Article.objects.filter(pk=self.pk).update(views=self.views)
        else:
            # 自动生成摘要
            if not self.summary or self.summary.strip() == '':
                self.summary = self.generate_summary()
            super().save(*args, **kwargs)

    def viewed(self):
        self.views += 1
        self.save(update_fields=['views'])

    def comment_list(self):
        cache_key = 'article_comments_{id}'.format(id=self.id)
        value = cache.get(cache_key)
        if value:
            logger.info('get article comments:{id}'.format(id=self.id))
            return value
        else:
            comments = self.comment_set.filter(is_enable=True).order_by('-id')
            cache.set(cache_key, comments, 60 * 100)
            logger.info('set article comments:{id}'.format(id=self.id))
            return comments

    def get_admin_url(self):
        info = (self._meta.app_label, self._meta.model_name)
        return reverse('admin:%s_%s_change' % info, args=(self.pk,))

    @cache_decorator(expiration=60 * 100)
    def next_article(self):
        # 下一篇
        return Article.objects.filter(
            id__gt=self.id, status='p').order_by('id').first()

    @cache_decorator(expiration=60 * 100)
    def prev_article(self):
        # 前一篇
        return Article.objects.filter(id__lt=self.id, status='p').first()

    def get_first_image_url(self):
        """
        Get the first image url from article.body.
        :return:
        """
        match = re.search(r'!\[.*?\]\((.+?)\)', self.body)
        if match:
            return match.group(1)
        return ""


class Category(BaseModel):
    """文章分类"""
    name = models.CharField(_('category name'), max_length=30, unique=True)
    parent_category = models.ForeignKey(
        'self',
        verbose_name=_('parent category'),
        blank=True,
        null=True,
        on_delete=models.CASCADE)
    slug = models.SlugField(default='no-slug', max_length=60, blank=True)
    index = models.IntegerField(default=0, verbose_name=_('index'))

    class Meta:
        ordering = ['-index']
        verbose_name = _('category')
        verbose_name_plural = verbose_name

    def get_absolute_url(self):
        return reverse(
            'blog:category_detail', kwargs={
                'category_name': self.slug})

    def __str__(self):
        return self.name

    @cache_decorator(60 * 60 * 10)
    def get_category_tree(self):
        """
        递归获得分类目录的父级
        :return:
        """
        categorys = []

        def parse(category):
            categorys.append(category)
            if category.parent_category:
                parse(category.parent_category)

        parse(self)
        return categorys

    @cache_decorator(60 * 60 * 10)
    def get_sub_categorys(self):
        """
        获得当前分类目录所有子集
        :return:
        """
        categorys = []
        all_categorys = Category.objects.all()

        def parse(category):
            if category not in categorys:
                categorys.append(category)
            childs = all_categorys.filter(parent_category=category)
            for child in childs:
                if category not in categorys:
                    categorys.append(child)
                parse(child)

        parse(self)
        return categorys


class Tag(BaseModel):
    """文章标签"""
    name = models.CharField(_('tag name'), max_length=30, unique=True)
    slug = models.SlugField(default='no-slug', max_length=60, blank=True)

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('blog:tag_detail', kwargs={'tag_name': self.slug})

    @cache_decorator(60 * 60 * 10)
    def get_article_count(self):
        return Article.objects.filter(tags__name=self.name).distinct().count()

    class Meta:
        ordering = ['name']
        verbose_name = _('tag')
        verbose_name_plural = verbose_name


class Links(models.Model):
    """友情链接"""

    name = models.CharField(_('link name'), max_length=30, unique=True)
    link = models.URLField(_('link'))
    sequence = models.IntegerField(_('order'), unique=True)
    is_enable = models.BooleanField(
        _('is show'), default=True, blank=False, null=False)
    show_type = models.CharField(
        _('show type'),
        max_length=1,
        choices=LinkShowType.choices,
        default=LinkShowType.I)
    creation_time = models.DateTimeField(_('creation time'), default=now)
    last_mod_time = models.DateTimeField(_('modify time'), default=now)

    class Meta:
        ordering = ['sequence']
        verbose_name = _('link')
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class SideBar(models.Model):
    """侧边栏,可以展示一些html内容"""
    name = models.CharField(_('title'), max_length=100)
    content = models.TextField(_('content'))
    sequence = models.IntegerField(_('order'), unique=True)
    is_enable = models.BooleanField(_('is enable'), default=True)
    creation_time = models.DateTimeField(_('creation time'), default=now)
    last_mod_time = models.DateTimeField(_('modify time'), default=now)

    class Meta:
        ordering = ['sequence']
        verbose_name = _('sidebar')
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class BlogSettings(models.Model):
    """blog的配置"""
    site_name = models.CharField(
        _('site name'),
        max_length=200,
        null=False,
        blank=False,
        default='')
    site_description = models.TextField(
        _('site description'),
        max_length=1000,
        null=False,
        blank=False,
        default='')
    site_seo_description = models.TextField(
        _('site seo description'), max_length=1000, null=False, blank=False, default='')
    site_keywords = models.TextField(
        _('site keywords'),
        max_length=1000,
        null=False,
        blank=False,
        default='')
    article_sub_length = models.IntegerField(_('article sub length'), default=300)
    sidebar_article_count = models.IntegerField(_('sidebar article count'), default=10)
    sidebar_comment_count = models.IntegerField(_('sidebar comment count'), default=5)
    article_comment_count = models.IntegerField(_('article comment count'), default=5)
    show_google_adsense = models.BooleanField(_('show adsense'), default=False)
    google_adsense_codes = models.TextField(
        _('adsense code'), max_length=2000, null=True, blank=True, default='')
    open_site_comment = models.BooleanField(_('open site comment'), default=True)
    global_header = models.TextField("公共头部", null=True, blank=True, default='')
    global_footer = models.TextField("公共尾部", null=True, blank=True, default='')
    beian_code = models.CharField(
        '备案号',
        max_length=2000,
        null=True,
        blank=True,
        default='')
    analytics_code = models.TextField(
        "网站统计代码",
        max_length=1000,
        null=False,
        blank=False,
        default='')
    show_gongan_code = models.BooleanField(
        '是否显示公安备案号', default=False, null=False)
    gongan_beiancode = models.TextField(
        '公安备案号',
        max_length=2000,
        null=True,
        blank=True,
        default='')
    comment_need_review = models.BooleanField(
        '评论是否需要审核', default=False, null=False)

    class Meta:
        verbose_name = _('Website configuration')
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.site_name

    def clean(self):
        if BlogSettings.objects.exclude(id=self.id).count():
            raise ValidationError(_('There can only be one configuration'))

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        from djangoblog.utils import cache
        cache.clear()
