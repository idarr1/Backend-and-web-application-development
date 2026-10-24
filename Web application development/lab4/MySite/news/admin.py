from django.contrib import admin
from .models import News, Employee, Profile


class NewsAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'created_at', 'updated_at', 'is_published')
    list_display_links = ('id', 'title')
    search_fields = ('title', 'content')


admin.site.register(News, NewsAdmin)
admin.site.register(Employee)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'birth_date', 'phone')
    list_display_links = ('id', 'user')
    search_fields = ('user__username', 'phone')
    list_filter = ('birth_date',)