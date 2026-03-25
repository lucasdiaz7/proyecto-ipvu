from django.http import HttpResponse
from django.shortcuts import render 


# Create your views here.

def pantalla_inicio(request):
    return render(request,'index.html')


def saludo_principal(request):
    return HttpResponse("Hola mundo xddd") 