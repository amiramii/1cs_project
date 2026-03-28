from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DocumentType, Document
from .serializers import DocumentTypeSerializer, DocumentSerializer

class DocumentTypeViewSet(viewsets.ModelViewSet):
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admin can create/edit types


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Document.objects.filter(document_type__audience='student')
        elif user.role == 'teacher':
            return Document.objects.all()
        return Document.objects.none()
# Create your views here.
