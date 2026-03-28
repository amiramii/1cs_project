from rest_framework import serializers
from .models import DocumentType, Document

class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = ['id', 'name', 'audience']


class DocumentSerializer(serializers.ModelSerializer):
    document_type = DocumentTypeSerializer(read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'title', 'pdf', 'document_type', 'uploaded_at']