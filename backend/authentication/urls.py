from django.urls import path
from rest_framework import routers
from django.urls import include
from . import views

router = routers.DefaultRouter()
router.register(r"users", views.UserViewSet)
urlpatterns = [
    path("", include(router.urls)),
    path('students/upload/', views.UploadCSVFile.as_view(), name='students_upload_csv'),
    path('reset-password-request/', views.ResetPasswordRequest.as_view(), name='reset_password_request'),
    path('reset-password/', views.ResetPassword.as_view(), name='reset_password'),

]
