from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Case(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]
    
    name = models.CharField(max_length=200)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_death = models.DateField()
    total_estate_value = models.DecimalField(
        max_digits=20, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    funeral_expenses = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    debts = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def net_estate(self):
        return self.total_estate_value - self.funeral_expenses - self.debts
    
    def __str__(self):
        return f"Case: {self.name} ({self.date_of_death})"
    
    class Meta:
        ordering = ['-created_at']


class Heir(models.Model):
    RELATIONSHIP_CHOICES = [
        ('HUSBAND', 'Husband'),
        ('WIFE', 'Wife'),
        ('SON', 'Son'),
        ('DAUGHTER', 'Daughter'),
        ('GRANDSON', 'Grandson'),
        ('GRANDDAUGHTER', 'Granddaughter'),
        ('FATHER', 'Father'),
        ('MOTHER', 'Mother'),
        ('PATERNAL_GRANDFATHER', 'Paternal Grandfather'),
        ('PATERNAL_GRANDMOTHER', 'Paternal Grandmother'),
        ('MATERNAL_GRANDMOTHER', 'Maternal Grandmother'),
        ('FULL_BROTHER', 'Full Brother'),
        ('FULL_SISTER', 'Full Sister'),
        ('PATERNAL_BROTHER', 'Paternal Half-Brother'),
        ('PATERNAL_SISTER', 'Paternal Half-Sister'),
        ('MATERNAL_BROTHER', 'Maternal Half-Brother'),
        ('MATERNAL_SISTER', 'Maternal Half-Sister'),
        ('NEPHEW_FULL', 'Nephew (Full Brother\'s Son)'),
        ('NEPHEW_PATERNAL', 'Nephew (Paternal Brother\'s Son)'),
        ('PATERNAL_UNCLE', 'Paternal Uncle'),
        ('COUSIN', 'Cousin'),
    ]
    
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='heirs')
    relationship = models.CharField(max_length=25, choices=RELATIONSHIP_CHOICES)
    count = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    is_blocked = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.get_relationship_display()} x{self.count}"
    
    class Meta:
        unique_together = ['case', 'relationship']


class Asset(models.Model):
    ASSET_TYPE_CHOICES = [
        ('LIQUID', 'Liquid Cash'),
        ('REAL_ESTATE', 'Real Estate'),
        ('COMMODITY', 'Commodity'),
        ('VEHICLE', 'Vehicle'),
        ('BUSINESS', 'Business/Shares'),
        ('OTHER', 'Other Asset'),
    ]
    
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=200)
    asset_type = models.CharField(max_length=15, choices=ASSET_TYPE_CHOICES)
    value = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    is_divisible = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_asset_type_display()}) - {self.value}"
    
    class Meta:
        ordering = ['asset_type', '-value']
