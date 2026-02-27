from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from django.utils.safestring import mark_safe

# 导入必要的模块用于处理Markdown和插件
from djangoblog.utils import CommonMarkdown
from djangoblog.plugin_manage import hooks
from djangoblog.plugin_manage.hook_constants import ARTICLE_CONTENT_HOOK_NAME

# Register your models here.
from .models import Article, Category, Tag, Links, SideBar, BlogSettings


class ArticleForm(forms.ModelForm):
    # body = forms.CharField(widget=AdminPagedownWidget())
    
    def clean_body(self):
        """清洗body字段，但不修改原始内容"""
        return self.cleaned_data.get('body', '')
    
    def get_processed_content(self, article=None):
        """
        获取处理后的文章内容，应用与前端相同的插件处理流程
        这用于管理后台的预览功能，确保预览效果与前端一致
        """
        body = self.cleaned_data.get('body', '')
        if not body:
            return ''
        
        # 先转换Markdown为HTML
        html_content = CommonMarkdown.get_markdown(body)
        
        # 然后应用插件过滤器，与前端使用相同的处理流程
        # 注意：这里我们创建一个模拟的上下文和request对象
        from django.http import HttpRequest
        request = HttpRequest()
        request.META = {'HTTP_HOST': 'localhost:8000'}
        
        context = {
            'request': request,
            'article': article or self.instance
        }
        
        # 应用所有文章内容相关的插件
        optimized_html = hooks.apply_filters(
            ARTICLE_CONTENT_HOOK_NAME, 
            html_content, 
            article=article or self.instance, 
            request=request,
            context=context,
            is_summary=False
        )
        
        return mark_safe(optimized_html)

    class Meta:
        model = Article
        fields = '__all__'


def makr_article_publish(modeladmin, request, queryset):
    queryset.update(status='p')


def draft_article(modeladmin, request, queryset):
    queryset.update(status='d')


def close_article_commentstatus(modeladmin, request, queryset):
    queryset.update(comment_status='c')


def open_article_commentstatus(modeladmin, request, queryset):
    queryset.update(comment_status='o')


makr_article_publish.short_description = _('Publish selected articles')
draft_article.short_description = _('Draft selected articles')
close_article_commentstatus.short_description = _('Close article comments')
open_article_commentstatus.short_description = _('Open article comments')


class ArticlelAdmin(admin.ModelAdmin):
    list_per_page = 20
    search_fields = ('body', 'title')
    form = ArticleForm
    list_display = (
        'id',
        'title',
        'author',
        'link_to_category',
        'creation_time',
        'views',
        'status',
        'type',
        'article_order')
    list_display_links = ('id', 'title')
    list_filter = ('status', 'type', 'category')
    date_hierarchy = 'creation_time'
    filter_horizontal = ('tags',)
    exclude = ('creation_time', 'last_modify_time')
    view_on_site = True
    actions = [
        makr_article_publish,
        draft_article,
        close_article_commentstatus,
        open_article_commentstatus]
    raw_id_fields = ('author', 'category',)
    
    # 添加一个只读字段用于显示处理后的文章预览
    readonly_fields = ('article_preview',)
    
    def article_preview(self, obj):
        """显示文章内容预览，使用与前端相同的处理流程"""
        if not obj or not obj.body:
            return "无内容预览"
        
        # 使用我们自定义的方法获取处理后的内容
        from django.http import HttpRequest
        request = HttpRequest()
        request.META = {'HTTP_HOST': 'localhost:8000'}
        
        # 先转换Markdown为HTML
        from djangoblog.utils import CommonMarkdown
        html_content = CommonMarkdown.get_markdown(obj.body)
        
        # 然后应用插件过滤器
        from djangoblog.plugin_manage import hooks
        from djangoblog.plugin_manage.hook_constants import ARTICLE_CONTENT_HOOK_NAME
        
        context = {
            'request': request,
            'article': obj
        }
        
        optimized_html = hooks.apply_filters(
            ARTICLE_CONTENT_HOOK_NAME, 
            html_content, 
            article=obj, 
            request=request,
            context=context,
            is_summary=False
        )
        
        return mark_safe('<div style="max-height: 500px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">' + 
                        optimized_html + '</div>')
    
    article_preview.short_description = "文章预览（与前端显示一致）"
    article_preview.allow_tags = True

    def link_to_category(self, obj):
        info = (obj.category._meta.app_label, obj.category._meta.model_name)
        link = reverse('admin:%s_%s_change' % info, args=(obj.category.id,))
        return format_html(u'<a href="%s">%s</a>' % (link, obj.category.name))

    link_to_category.short_description = _('category')

    def get_form(self, request, obj=None, **kwargs):
        form = super(ArticlelAdmin, self).get_form(request, obj, **kwargs)
        form.base_fields['author'].queryset = get_user_model(
        ).objects.filter(is_superuser=True)
        return form

    def save_model(self, request, obj, form, change):
        super(ArticlelAdmin, self).save_model(request, obj, form, change)
    
    def get_fields(self, request, obj=None):
        """调整字段顺序，将预览放在body字段之后"""
        fields = super().get_fields(request, obj)
        # 确保预览字段在body字段之后
        if 'body' in fields and 'article_preview' in fields:
            body_index = fields.index('body')
            fields.remove('article_preview')
            fields.insert(body_index + 1, 'article_preview')
        return fields
    
    def render_change_form(self, request, context, add=False, change=False, form_url='', obj=None):
        """自定义表单渲染，确保预览使用与前端相同的处理流程"""
        # 为表单添加请求对象，以便插件可以使用
        if 'form' in context and hasattr(context['form'], 'instance'):
            context['request'] = request
        
        return super().render_change_form(request, context, add, change, form_url, obj)

    def get_view_on_site_url(self, obj=None):
        if obj:
            url = obj.get_full_url()
            return url
        else:
            from djangoblog.utils import get_current_site
            site = get_current_site().domain
            return site


class TagAdmin(admin.ModelAdmin):
    exclude = ('slug', 'last_mod_time', 'creation_time')


class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_category', 'index')
    exclude = ('slug', 'last_mod_time', 'creation_time')


class LinksAdmin(admin.ModelAdmin):
    exclude = ('last_mod_time', 'creation_time')


class SideBarAdmin(admin.ModelAdmin):
    list_display = ('name', 'content', 'is_enable', 'sequence')
    exclude = ('last_mod_time', 'creation_time')


class BlogSettingsAdmin(admin.ModelAdmin):
    pass
