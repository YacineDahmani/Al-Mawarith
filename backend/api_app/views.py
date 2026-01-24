from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from inheritance_engine.models import Case, Heir, Asset
from inheritance_engine.calculator import InheritanceCalculator
from .serializers import (
    CaseSerializer, CaseCreateSerializer, 
    HeirSerializer, AssetSerializer, CalculationResultSerializer
)


class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CaseCreateSerializer
        return CaseSerializer
    
    @action(detail=True, methods=['get'])
    def calculate(self, request, pk=None):
        case = self.get_object()
        calculator = InheritanceCalculator(case)
        result = calculator.calculate()
        
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CalculationResultSerializer(result)
        return Response(serializer.data)


class HeirViewSet(viewsets.ModelViewSet):
    queryset = Heir.objects.all()
    serializer_class = HeirSerializer
    
    def get_queryset(self):
        queryset = Heir.objects.all()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    
    def get_queryset(self):
        queryset = Asset.objects.all()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset


def relationship_choices(request):
    from django.http import JsonResponse
    choices = [{'value': c[0], 'label': c[1]} for c in Heir.RELATIONSHIP_CHOICES]
    return JsonResponse(choices, safe=False)


def asset_type_choices(request):
    from django.http import JsonResponse
    choices = [{'value': c[0], 'label': c[1]} for c in Asset.ASSET_TYPE_CHOICES]
    return JsonResponse(choices, safe=False)
