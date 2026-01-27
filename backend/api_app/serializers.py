from rest_framework import serializers
from inheritance_engine.models import Case, Heir, Asset


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ['id', 'name', 'asset_type', 'value', 'is_divisible']


class HeirSerializer(serializers.ModelSerializer):
    relationship_display = serializers.CharField(source='get_relationship_display', read_only=True)
    
    class Meta:
        model = Heir
        fields = ['id', 'relationship', 'relationship_display', 'count', 'is_blocked']


class CaseSerializer(serializers.ModelSerializer):
    heirs = HeirSerializer(many=True, read_only=True)
    assets = AssetSerializer(many=True, read_only=True)
    net_estate = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    
    class Meta:
        model = Case
        fields = [
            'id', 'name', 'gender', 'date_of_death', 
            'total_estate_value', 'funeral_expenses', 'debts',
            'net_estate', 'heirs', 'assets', 'created_at', 'updated_at'
        ]


class CaseCreateSerializer(serializers.ModelSerializer):
    heirs = HeirSerializer(many=True)
    assets = AssetSerializer(many=True)
    
    class Meta:
        model = Case
        fields = [
            'id', 'name', 'gender', 'date_of_death', 
            'total_estate_value', 'funeral_expenses', 'debts',
            'heirs', 'assets'
        ]
    
    def create(self, validated_data):
        heirs_data = validated_data.pop('heirs')
        assets_data = validated_data.pop('assets')
        
        case = Case.objects.create(**validated_data)
        
        for heir_data in heirs_data:
            Heir.objects.create(case=case, **heir_data)
        
        for asset_data in assets_data:
            Asset.objects.create(case=case, **asset_data)
        
        return case


class CalculationResultSerializer(serializers.Serializer):
    case_id = serializers.IntegerField()
    deceased_name = serializers.CharField()
    total_estate = serializers.CharField()
    deductions = serializers.CharField()
    net_estate = serializers.CharField()
    distributions = serializers.ListField()
