from django.shortcuts import render
from django.http import HttpResponse
from .models import News

def index(request):
    news = News.objects.order_by('-created_at')

    context = {
        'news': news,
        'title': 'Список новостей'
    }

    return render(request, 'news/index.html', context)

def test(request):
    return HttpResponse('<h1>Тестовая страница</h1>')