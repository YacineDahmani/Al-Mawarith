from fractions import Fraction
from decimal import Decimal


class InheritanceCalculator:
    
    FIXED_SHARES = {
        'HUSBAND': {'with_children': Fraction(1, 4), 'without_children': Fraction(1, 2)},
        'WIFE': {'with_children': Fraction(1, 8), 'without_children': Fraction(1, 4)},
        'FATHER': {'with_children': Fraction(1, 6), 'without_children': None},
        'MOTHER': {'with_children': Fraction(1, 6), 'without_children': Fraction(1, 3)},
        'DAUGHTER': {'single': Fraction(1, 2), 'multiple': Fraction(2, 3)},
        'GRANDDAUGHTER': {'single': Fraction(1, 2), 'multiple': Fraction(2, 3)},
        'FULL_SISTER': {'single': Fraction(1, 2), 'multiple': Fraction(2, 3)},
        'PATERNAL_SISTER': {'single': Fraction(1, 2), 'multiple': Fraction(2, 3)},
        'MATERNAL_BROTHER': {'single': Fraction(1, 6), 'multiple': Fraction(1, 3)},
        'MATERNAL_SISTER': {'single': Fraction(1, 6), 'multiple': Fraction(1, 3)},
        'PATERNAL_GRANDMOTHER': Fraction(1, 6),
        'MATERNAL_GRANDMOTHER': Fraction(1, 6),
    }
    
    BLOCKING_RULES = {
        'SON': ['GRANDSON', 'GRANDDAUGHTER', 'FULL_BROTHER', 'FULL_SISTER', 
                'PATERNAL_BROTHER', 'PATERNAL_SISTER', 'NEPHEW_FULL', 
                'NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN'],
        'FATHER': ['PATERNAL_GRANDFATHER', 'FULL_BROTHER', 'FULL_SISTER',
                   'PATERNAL_BROTHER', 'PATERNAL_SISTER', 'NEPHEW_FULL',
                   'NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN'],
        'GRANDSON': ['NEPHEW_FULL', 'NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN'],
        'FULL_BROTHER': ['PATERNAL_BROTHER', 'PATERNAL_SISTER', 'NEPHEW_FULL',
                         'NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN'],
        'PATERNAL_GRANDFATHER': ['FULL_BROTHER', 'FULL_SISTER', 'PATERNAL_BROTHER', 'PATERNAL_SISTER'],
    }

    def __init__(self, case):
        self.case = case
        self.heirs = {h.relationship: h for h in case.heirs.all()}
        self.net_estate = case.net_estate
        self.results = {}
        
    def calculate(self):
        if self.net_estate <= 0:
            return {'error': 'No estate to distribute after deductions', 'distributions': []}
        
        self._apply_blocking_rules()
        remaining = Fraction(1)
        remaining = self._calculate_fixed_shares(remaining)
        self._distribute_residue(remaining)
        return self._prepare_results()
    
    def _has_children(self):
        return any(r in self.heirs for r in ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER'])
    
    def _has_sons(self):
        return 'SON' in self.heirs
    
    def _apply_blocking_rules(self):
        for blocker, blocked_list in self.BLOCKING_RULES.items():
            if blocker in self.heirs:
                for blocked in blocked_list:
                    if blocked in self.heirs:
                        self.heirs[blocked].is_blocked = True
    
    def _calculate_fixed_shares(self, remaining):
        has_children = self._has_children()
        
        if 'HUSBAND' in self.heirs:
            share = self.FIXED_SHARES['HUSBAND']['with_children' if has_children else 'without_children']
            self.results['HUSBAND'] = {'share': share, 'count': 1}
            remaining -= share
            
        if 'WIFE' in self.heirs:
            heir = self.heirs['WIFE']
            share = self.FIXED_SHARES['WIFE']['with_children' if has_children else 'without_children']
            self.results['WIFE'] = {'share': share, 'count': heir.count}
            remaining -= share
        
        if 'FATHER' in self.heirs:
            if has_children:
                share = self.FIXED_SHARES['FATHER']['with_children']
                self.results['FATHER'] = {'share': share, 'count': 1, 'asabah': True}
                remaining -= share
            
        if 'MOTHER' in self.heirs:
            share = self.FIXED_SHARES['MOTHER']['with_children' if has_children else 'without_children']
            self.results['MOTHER'] = {'share': share, 'count': 1}
            remaining -= share
        
        if 'DAUGHTER' in self.heirs and 'SON' not in self.heirs:
            heir = self.heirs['DAUGHTER']
            share = self.FIXED_SHARES['DAUGHTER']['single' if heir.count == 1 else 'multiple']
            self.results['DAUGHTER'] = {'share': share, 'count': heir.count}
            remaining -= share
        
        if 'GRANDDAUGHTER' in self.heirs and not self.heirs['GRANDDAUGHTER'].is_blocked:
            heir = self.heirs['GRANDDAUGHTER']
            if 'DAUGHTER' not in self.heirs:
                share = Fraction(1, 2) if heir.count == 1 else Fraction(2, 3)
            else:
                daughter_count = self.heirs.get('DAUGHTER', type('', (), {'count': 0})).count
                share = Fraction(1, 6) if daughter_count == 1 else Fraction(0)
            if share > 0:
                self.results['GRANDDAUGHTER'] = {'share': share, 'count': heir.count}
                remaining -= share
        
        if 'FULL_SISTER' in self.heirs and not self.heirs['FULL_SISTER'].is_blocked:
            if not has_children and 'FATHER' not in self.heirs and 'FULL_BROTHER' not in self.heirs:
                heir = self.heirs['FULL_SISTER']
                share = Fraction(1, 2) if heir.count == 1 else Fraction(2, 3)
                self.results['FULL_SISTER'] = {'share': share, 'count': heir.count}
                remaining -= share
        
        for rel in ['MATERNAL_BROTHER', 'MATERNAL_SISTER']:
            if rel in self.heirs and not has_children and 'FATHER' not in self.heirs:
                heir = self.heirs[rel]
                total_maternal = sum(
                    self.heirs.get(r, type('', (), {'count': 0})).count 
                    for r in ['MATERNAL_BROTHER', 'MATERNAL_SISTER'] if r in self.heirs
                )
                if total_maternal == 1:
                    share = Fraction(1, 6)
                else:
                    share = Fraction(1, 3) * Fraction(heir.count, total_maternal)
                self.results[rel] = {'share': share, 'count': heir.count}
                remaining -= share
        
        grandmothers = [g for g in ['PATERNAL_GRANDMOTHER', 'MATERNAL_GRANDMOTHER'] if g in self.heirs]
        if grandmothers and 'MOTHER' not in self.heirs:
            share_each = Fraction(1, 6) / len(grandmothers)
            for gm in grandmothers:
                self.results[gm] = {'share': share_each, 'count': 1}
                remaining -= share_each
        
        return remaining
    
    def _distribute_residue(self, remaining):
        if remaining <= 0:
            return
        
        if 'SON' in self.heirs:
            son_count = self.heirs['SON'].count
            daughter_count = self.heirs.get('DAUGHTER', type('', (), {'count': 0})).count
            total_parts = (son_count * 2) + daughter_count
            self.results['SON'] = {'share': remaining * Fraction(son_count * 2, total_parts), 'count': son_count}
            if daughter_count > 0:
                self.results['DAUGHTER'] = {'share': remaining * Fraction(daughter_count, total_parts), 'count': daughter_count}
            return
        
        if 'FATHER' in self.heirs and 'FATHER' not in self.results:
            self.results['FATHER'] = {'share': remaining, 'count': 1}
            return
        elif 'FATHER' in self.results and self.results['FATHER'].get('asabah'):
            self.results['FATHER']['share'] += remaining
            return
        
        if 'PATERNAL_GRANDFATHER' in self.heirs and not self.heirs['PATERNAL_GRANDFATHER'].is_blocked:
            self.results['PATERNAL_GRANDFATHER'] = {'share': remaining, 'count': 1}
            return
        
        if 'FULL_BROTHER' in self.heirs and not self.heirs['FULL_BROTHER'].is_blocked:
            brother_count = self.heirs['FULL_BROTHER'].count
            sister_count = 0
            if 'FULL_SISTER' in self.heirs and not self.heirs['FULL_SISTER'].is_blocked:
                sister_count = self.heirs['FULL_SISTER'].count
            total_parts = (brother_count * 2) + sister_count
            self.results['FULL_BROTHER'] = {'share': remaining * Fraction(brother_count * 2, total_parts), 'count': brother_count}
            if sister_count > 0 and 'FULL_SISTER' not in self.results:
                self.results['FULL_SISTER'] = {'share': remaining * Fraction(sister_count, total_parts), 'count': sister_count}
            return
        
        for rel in ['PATERNAL_BROTHER', 'NEPHEW_FULL', 'NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN']:
            if rel in self.heirs and not self.heirs[rel].is_blocked:
                self.results[rel] = {'share': remaining, 'count': self.heirs[rel].count}
                return
    
    def _prepare_results(self):
        distributions = []
        total_shares = sum(r['share'] for r in self.results.values())
        
        for relationship, data in self.results.items():
            share_fraction = data['share']
            count = data['count']
            
            if total_shares > 1:
                share_fraction = share_fraction / total_shares
            
            percentage = float(share_fraction) * 100
            total_value = self.net_estate * Decimal(str(float(share_fraction)))
            per_person_value = total_value / count if count > 0 else Decimal('0')
            
            heir_obj = self.heirs.get(relationship)
            display_name = heir_obj.get_relationship_display() if heir_obj else relationship
            
            distributions.append({
                'relationship': relationship,
                'relationship_display': display_name,
                'count': count,
                'share_fraction': str(share_fraction),
                'percentage': round(percentage, 4),
                'total_value': str(round(total_value, 2)),
                'per_person_value': str(round(per_person_value, 2)),
            })
        
        return {
            'case_id': self.case.id,
            'deceased_name': self.case.name,
            'total_estate': str(self.case.total_estate_value),
            'deductions': str(self.case.funeral_expenses + self.case.debts),
            'net_estate': str(self.net_estate),
            'distributions': sorted(distributions, key=lambda x: -float(x['percentage'])),
        }
