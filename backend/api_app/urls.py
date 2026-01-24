from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseViewSet, HeirViewSet, AssetViewSet, relationship_choices, asset_type_choices

router = DefaultRouter()
router.register(r'cases', CaseViewSet)
router.register(r'heirs', HeirViewSet)
router.register(r'assets', AssetViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('choices/relationships/', relationship_choices, name='relationship-choices'),
    path('choices/asset-types/', asset_type_choices, name='asset-type-choices'),
]
