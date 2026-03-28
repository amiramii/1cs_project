from rest_framework.routers import DefaultRouter
from .views import DocumentTypeViewSet, DocumentViewSet

router = DefaultRouter()
router.register(r'document-types', DocumentTypeViewSet)
router.register(r'documents', DocumentViewSet)

urlpatterns = router.urls