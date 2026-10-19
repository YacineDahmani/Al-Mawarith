from fractions import Fraction
from decimal import Decimal
from math import gcd


def lcm(a, b):
    return (a * b) // gcd(a, b)


class InheritanceCalculator:
    """
    Sharia-compliant Islamic Inheritance (Mirath) Engine.
    Implements Fard (fixed shares), Ta'sib (residuary), Hajb (blocking),
    Awl (deficit adjustment), Radd (surplus redistribution), and Umariyyatan.
    """

    def __init__(self, case):
        self.case = case
        self.heirs = {h.relationship: h for h in case.heirs.all()}
        self.net_estate = case.net_estate
        self.results = {}
        self.blocked_heirs = {}
        self.asl_al_masala = 1
        self.awl_applied = False
        self.radd_applied = False
        self.umariyyatan_applied = False

    def calculate(self):
        if self.net_estate <= 0:
            return {
                'error': 'No estate to distribute after deductions',
                'distributions': [],
                'blocked_heirs': [],
                'asl_al_masala': 0,
                'awl_applied': False,
                'radd_applied': False,
            }

        # Step 1: Detect and apply exclusion rules (Hajb)
        self._apply_blocking_rules()

        # Step 2: Calculate fixed shares (Ashab al-Furud)
        fixed_shares = self._calculate_fixed_shares()

        total_fixed = sum(d['share'] for d in fixed_shares.values())

        # Step 3: Handle Awl, Ta'sib, or Radd
        if total_fixed > Fraction(1):
            # Awl (Deficit): Total shares exceed 1. Residuary heirs get nothing.
            self.awl_applied = True
            for rel, data in fixed_shares.items():
                scaled_share = data['share'] / total_fixed
                self.results[rel] = {
                    'share': scaled_share,
                    'original_share': data['share'],
                    'count': data['count'],
                    'type': 'AWL',
                    'dalil': data.get('dalil', ''),
                }
        else:
            remaining = Fraction(1) - total_fixed
            self.results = {
                rel: {
                    'share': data['share'],
                    'original_share': data['share'],
                    'count': data['count'],
                    'type': data.get('type', 'FARD'),
                    'dalil': data.get('dalil', ''),
                }
                for rel, data in fixed_shares.items()
            }

            # Distribute residue to Asabah if remaining > 0
            if remaining > Fraction(0):
                residue_distributed = self._distribute_residue(remaining)

                # If no Asabah claimed the residue, apply Radd (Surplus)
                if not residue_distributed:
                    self._apply_radd(remaining)

        return self._prepare_results()

    def _has_children(self):
        return any(
            r in self.heirs and not getattr(self.heirs[r], 'is_blocked', False)
            for r in ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER']
        )

    def _has_male_descendants(self):
        return any(
            r in self.heirs and not getattr(self.heirs[r], 'is_blocked', False)
            for r in ['SON', 'GRANDSON']
        )

    def _has_female_descendants_only(self):
        has_female = any(
            r in self.heirs and not getattr(self.heirs[r], 'is_blocked', False)
            for r in ['DAUGHTER', 'GRANDDAUGHTER']
        )
        return has_female and not self._has_male_descendants()

    def _count_all_siblings(self):
        """Count total siblings (even if blocked by father/grandfather)."""
        sibling_keys = [
            'FULL_BROTHER', 'FULL_SISTER',
            'PATERNAL_BROTHER', 'PATERNAL_SISTER',
            'MATERNAL_BROTHER', 'MATERNAL_SISTER'
        ]
        return sum(self.heirs[r].count for r in sibling_keys if r in self.heirs)

    def _is_eligible(self, rel):
        return rel in self.heirs and not getattr(self.heirs[rel], 'is_blocked', False)

    def _apply_blocking_rules(self):
        # 1. Son blocks grandsons, granddaughters, all siblings, nephews, uncles, cousins
        if 'SON' in self.heirs:
            blocked_by_son = [
                'GRANDSON', 'GRANDDAUGHTER', 'FULL_BROTHER', 'FULL_SISTER',
                'PATERNAL_BROTHER', 'PATERNAL_SISTER', 'MATERNAL_BROTHER',
                'MATERNAL_SISTER', 'NEPHEW_FULL', 'NEPHEW_PATERNAL',
                'PATERNAL_UNCLE', 'COUSIN'
            ]
            for b in blocked_by_son:
                if b in self.heirs:
                    self.heirs[b].is_blocked = True
                    self.blocked_heirs[b] = 'Blocked by Son (حجب حرمان بالابن)'

        # 2. Grandson blocks lower descendants, all siblings, nephews, uncles, cousins
        elif 'GRANDSON' in self.heirs:
            blocked_by_grandson = [
                'FULL_BROTHER', 'FULL_SISTER', 'PATERNAL_BROTHER',
                'PATERNAL_SISTER', 'MATERNAL_BROTHER', 'MATERNAL_SISTER',
                'NEPHEW_FULL', 'NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN'
            ]
            for b in blocked_by_grandson:
                if b in self.heirs:
                    self.heirs[b].is_blocked = True
                    self.blocked_heirs[b] = 'Blocked by Grandson (حجب حرمان بابن الابن)'

        # 3. Daughters blocking granddaughters (when 2+ daughters and no grandson)
        if 'DAUGHTER' in self.heirs and self.heirs['DAUGHTER'].count >= 2:
            if 'GRANDDAUGHTER' in self.heirs and 'GRANDSON' not in self.heirs:
                self.heirs['GRANDDAUGHTER'].is_blocked = True
                self.blocked_heirs['GRANDDAUGHTER'] = 'Two or more daughters exhaust 2/3 share (استغراق البنات للثلثين)'

        # 4. Daughters/Granddaughters block maternal siblings
        if self._has_children():
            for m in ['MATERNAL_BROTHER', 'MATERNAL_SISTER']:
                if m in self.heirs:
                    self.heirs[m].is_blocked = True
                    self.blocked_heirs[m] = 'Blocked by descendants (حجب حرمان بوجود الفرع الوارث)'

        # 5. Father blocks grandfather, paternal grandmother, all siblings, nephews, uncles, cousins
        if 'FATHER' in self.heirs:
            blocked_by_father = [
                'PATERNAL_GRANDFATHER', 'PATERNAL_GRANDMOTHER',
                'FULL_BROTHER', 'FULL_SISTER', 'PATERNAL_BROTHER',
                'PATERNAL_SISTER', 'MATERNAL_BROTHER', 'MATERNAL_SISTER',
                'NEPHEW_FULL', 'NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN'
            ]
            for b in blocked_by_father:
                if b in self.heirs:
                    self.heirs[b].is_blocked = True
                    self.blocked_heirs[b] = 'Blocked by Father (حجب حرمان بالأب)'

        # 6. Mother blocks both grandmothers
        if 'MOTHER' in self.heirs:
            for gm in ['PATERNAL_GRANDMOTHER', 'MATERNAL_GRANDMOTHER']:
                if gm in self.heirs:
                    self.heirs[gm].is_blocked = True
                    self.blocked_heirs[gm] = 'Blocked by Mother (حجب حرمان بالأم)'

        # 7. Paternal Grandfather blocks maternal siblings, nephews, uncles, cousins, and distant agnates
        if self._is_eligible('PATERNAL_GRANDFATHER'):
            for m in ['MATERNAL_BROTHER', 'MATERNAL_SISTER', 'NEPHEW_FULL', 'NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN']:
                if m in self.heirs:
                    self.heirs[m].is_blocked = True
                    self.blocked_heirs[m] = 'Blocked by Grandfather (حجب حرمان بالجد)'

        # 8. Full Brother blocks paternal siblings, nephews, uncles, cousins
        if self._is_eligible('FULL_BROTHER'):
            blocked_by_fb = [
                'PATERNAL_BROTHER', 'PATERNAL_SISTER',
                'NEPHEW_FULL', 'NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN'
            ]
            for b in blocked_by_fb:
                if b in self.heirs:
                    self.heirs[b].is_blocked = True
                    self.blocked_heirs[b] = 'Blocked by Full Brother (حجب حرمان بالأخ الشقيق)'

        # 9. Two or more Full Sisters block Paternal Sister unless Paternal Brother is present
        if self._is_eligible('FULL_SISTER') and self.heirs['FULL_SISTER'].count >= 2:
            if 'PATERNAL_SISTER' in self.heirs and not self._is_eligible('PATERNAL_BROTHER'):
                self.heirs['PATERNAL_SISTER'].is_blocked = True
                self.blocked_heirs['PATERNAL_SISTER'] = 'Two full sisters exhaust 2/3 share (استغراق الأخوات الشقيقات للثلثين)'

        # 10. Paternal Brother blocks nephews, uncles, cousins
        if self._is_eligible('PATERNAL_BROTHER'):
            for b in ['NEPHEW_FULL', 'NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN']:
                if b in self.heirs:
                    self.heirs[b].is_blocked = True
                    self.blocked_heirs[b] = 'Blocked by Paternal Brother (حجب حرمان بالأخ لأب)'

        # 11. Full Nephew blocks Paternal Nephew, Uncles, Cousins
        if self._is_eligible('NEPHEW_FULL'):
            for b in ['NEPHEW_PATERNAL', 'PATERNAL_UNCLE', 'COUSIN']:
                if b in self.heirs:
                    self.heirs[b].is_blocked = True
                    self.blocked_heirs[b] = 'Blocked by Full Nephew (حجب بابن الأخ الشقيق)'

        # 12. Paternal Nephew blocks Uncles, Cousins
        if self._is_eligible('NEPHEW_PATERNAL'):
            for b in ['PATERNAL_UNCLE', 'COUSIN']:
                if b in self.heirs:
                    self.heirs[b].is_blocked = True
                    self.blocked_heirs[b] = 'Blocked by Paternal Nephew (حجب بابن الأخ لأب)'

        # 13. Paternal Uncle blocks Cousin
        if self._is_eligible('PATERNAL_UNCLE'):
            if 'COUSIN' in self.heirs:
                self.heirs['COUSIN'].is_blocked = True
                self.blocked_heirs['COUSIN'] = 'Blocked by Paternal Uncle (حجب بالعم الشقيق/لأب)'

    def _calculate_fixed_shares(self):
        shares = {}
        has_children = self._has_children()
        total_siblings = self._count_all_siblings()

        # 1. Husband
        if self._is_eligible('HUSBAND'):
            share = Fraction(1, 4) if has_children else Fraction(1, 2)
            shares['HUSBAND'] = {
                'share': share,
                'count': 1,
                'dalil': 'Quran 4:12 - Husband (1/4 with children, 1/2 without)',
            }

        # 2. Wife / Wives
        if self._is_eligible('WIFE'):
            count = self.heirs['WIFE'].count
            share = Fraction(1, 8) if has_children else Fraction(1, 4)
            shares['WIFE'] = {
                'share': share,
                'count': count,
                'dalil': f'Quran 4:12 - Wife/Wives (1/8 with children, 1/4 without, shared across {count})',
            }

        # 3. Mother
        if self._is_eligible('MOTHER'):
            # Check Umariyyatan case: Spouse + Mother + Father (no children, no 2+ siblings)
            is_umariyya_husband = ('HUSBAND' in shares and self._is_eligible('FATHER') and not has_children and total_siblings < 2)
            is_umariyya_wife = ('WIFE' in shares and self._is_eligible('FATHER') and not has_children and total_siblings < 2)

            if is_umariyya_husband:
                # 1/3 of remainder after husband's 1/2 = 1/6
                self.umariyyatan_applied = True
                shares['MOTHER'] = {
                    'share': Fraction(1, 6),
                    'count': 1,
                    'dalil': 'Umariyyatan Consensus - Mother receives 1/3 of remainder after husband (1/6 of total)',
                }
            elif is_umariyya_wife:
                # 1/3 of remainder after wife's 1/4 = 1/4
                self.umariyyatan_applied = True
                shares['MOTHER'] = {
                    'share': Fraction(1, 4),
                    'count': 1,
                    'dalil': 'Umariyyatan Consensus - Mother receives 1/3 of remainder after wife (1/4 of total)',
                }
            elif has_children or total_siblings >= 2:
                shares['MOTHER'] = {
                    'share': Fraction(1, 6),
                    'count': 1,
                    'dalil': 'Quran 4:11 - Mother receives 1/6 (due to children or multiple siblings)',
                }
            else:
                shares['MOTHER'] = {
                    'share': Fraction(1, 3),
                    'count': 1,
                    'dalil': 'Quran 4:11 - Mother receives 1/3 (absence of children and multiple siblings)',
                }

        # 4. Father: Fixed share 1/6 if children exist
        if self._is_eligible('FATHER') and has_children:
            shares['FATHER'] = {
                'share': Fraction(1, 6),
                'count': 1,
                'dalil': 'Quran 4:11 - Father receives 1/6 fixed share with descendants',
            }

        # 5. Paternal Grandfather: Fixed share 1/6 if children exist (and Father absent)
        if self._is_eligible('PATERNAL_GRANDFATHER') and has_children and not self._is_eligible('FATHER'):
            shares['PATERNAL_GRANDFATHER'] = {
                'share': Fraction(1, 6),
                'count': 1,
                'dalil': 'Sunnah / Ijma - Grandfather inherits 1/6 fixed share with descendants in absence of Father',
            }

        # 6. Grandmothers (Paternal & Maternal)
        eligible_gms = [gm for gm in ['PATERNAL_GRANDMOTHER', 'MATERNAL_GRANDMOTHER'] if self._is_eligible(gm)]
        if eligible_gms:
            share_each = Fraction(1, 6) / len(eligible_gms)
            for gm in eligible_gms:
                shares[gm] = {
                    'share': share_each,
                    'count': 1,
                    'dalil': f'Sunnah - Grandmothers share 1/6 equally ({len(eligible_gms)} eligible)',
                }

        # 7. Daughters (when no Son)
        if self._is_eligible('DAUGHTER') and not self._is_eligible('SON'):
            count = self.heirs['DAUGHTER'].count
            share = Fraction(1, 2) if count == 1 else Fraction(2, 3)
            shares['DAUGHTER'] = {
                'share': share,
                'count': count,
                'dalil': f"Quran 4:11 - {'Single daughter receives 1/2' if count == 1 else 'Multiple daughters share 2/3'}",
            }

        # 8. Granddaughters (when no Son, no Grandson, and not blocked)
        if self._is_eligible('GRANDDAUGHTER') and not self._is_eligible('SON') and not self._is_eligible('GRANDSON'):
            count = self.heirs['GRANDDAUGHTER'].count
            daughter_count = self.heirs['DAUGHTER'].count if self._is_eligible('DAUGHTER') else 0
            if daughter_count == 0:
                share = Fraction(1, 2) if count == 1 else Fraction(2, 3)
                shares['GRANDDAUGHTER'] = {
                    'share': share,
                    'count': count,
                    'dalil': f"Sunnah - Granddaughter(s) take daughter position: {'1/2' if count == 1 else '2/3'}",
                }
            elif daughter_count == 1:
                shares['GRANDDAUGHTER'] = {
                    'share': Fraction(1, 6),
                    'count': count,
                    'dalil': 'Sunnah - Granddaughter receives 1/6 to complete 2/3 with single daughter (تكملة الثلثين)',
                }

        # 9. Full Sister (when no children, no father, no grandfather, and no full brother)
        if (
            self._is_eligible('FULL_SISTER')
            and not has_children
            and not self._is_eligible('FATHER')
            and not self._is_eligible('PATERNAL_GRANDFATHER')
            and not self._is_eligible('FULL_BROTHER')
        ):
            count = self.heirs['FULL_SISTER'].count
            share = Fraction(1, 2) if count == 1 else Fraction(2, 3)
            shares['FULL_SISTER'] = {
                'share': share,
                'count': count,
                'dalil': f"Quran 4:176 - Full Sister(s): {'1/2 for single' if count == 1 else '2/3 for multiple'}",
            }

        # 10. Paternal Sister (when no children, no father/grandfather, no full brother, and no paternal brother)
        if (
            self._is_eligible('PATERNAL_SISTER')
            and not has_children
            and not self._is_eligible('FATHER')
            and not self._is_eligible('PATERNAL_GRANDFATHER')
            and not self._is_eligible('FULL_BROTHER')
            and not self._is_eligible('PATERNAL_BROTHER')
        ):
            count = self.heirs['PATERNAL_SISTER'].count
            full_sister_count = self.heirs['FULL_SISTER'].count if self._is_eligible('FULL_SISTER') else 0

            if full_sister_count == 0:
                share = Fraction(1, 2) if count == 1 else Fraction(2, 3)
                shares['PATERNAL_SISTER'] = {
                    'share': share,
                    'count': count,
                    'dalil': f"Quran 4:176 - Paternal Sister(s): {'1/2' if count == 1 else '2/3'}",
                }
            elif full_sister_count == 1:
                shares['PATERNAL_SISTER'] = {
                    'share': Fraction(1, 6),
                    'count': count,
                    'dalil': 'Sunnah - Paternal Sister receives 1/6 to complete 2/3 with single full sister (تكملة الثلثين)',
                }

        # 11. Maternal Siblings (Brother/Sister): Share equally 1:1, blocked by children, father, grandfather
        maternal_eligible = [m for m in ['MATERNAL_BROTHER', 'MATERNAL_SISTER'] if self._is_eligible(m)]
        if maternal_eligible and not has_children and not self._is_eligible('FATHER') and not self._is_eligible('PATERNAL_GRANDFATHER'):
            total_maternal_count = sum(self.heirs[m].count for m in maternal_eligible)
            total_maternal_share = Fraction(1, 6) if total_maternal_count == 1 else Fraction(1, 3)

            for m in maternal_eligible:
                count = self.heirs[m].count
                portion = total_maternal_share * Fraction(count, total_maternal_count)
                shares[m] = {
                    'share': portion,
                    'count': count,
                    'dalil': f"Quran 4:12 - Maternal siblings share 1:1 ({'1/6 for single' if total_maternal_count == 1 else '1/3 shared'})",
                }

        return shares

    def _distribute_residue(self, remaining):
        """Distribute residue to Asabah. Returns True if any residue was allocated."""
        if remaining <= Fraction(0):
            return False

        # Priority 1: Son (+ Daughter as Asabah bil-Ghayr)
        if self._is_eligible('SON'):
            son_count = self.heirs['SON'].count
            daughter_count = self.heirs['DAUGHTER'].count if self._is_eligible('DAUGHTER') else 0
            total_parts = (son_count * 2) + daughter_count

            self.results['SON'] = {
                'share': remaining * Fraction(son_count * 2, total_parts),
                'original_share': remaining * Fraction(son_count * 2, total_parts),
                'count': son_count,
                'type': 'TASIB',
                'dalil': 'Quran 4:11 - Son inherits residue as Asabah bi-Nafsih',
            }
            if daughter_count > 0:
                self.results['DAUGHTER'] = {
                    'share': remaining * Fraction(daughter_count, total_parts),
                    'original_share': remaining * Fraction(daughter_count, total_parts),
                    'count': daughter_count,
                    'type': 'TASIB',
                    'dalil': 'Quran 4:11 - Daughter inherits residue alongside brother at 2:1 ratio (Asabah bil-Ghayr)',
                }
            return True

        # Priority 2: Grandson (+ Granddaughter as Asabah bil-Ghayr)
        if self._is_eligible('GRANDSON'):
            grandson_count = self.heirs['GRANDSON'].count
            granddaughter_count = self.heirs['GRANDDAUGHTER'].count if self._is_eligible('GRANDDAUGHTER') else 0
            total_parts = (grandson_count * 2) + granddaughter_count

            self.results['GRANDSON'] = {
                'share': remaining * Fraction(grandson_count * 2, total_parts),
                'original_share': remaining * Fraction(grandson_count * 2, total_parts),
                'count': grandson_count,
                'type': 'TASIB',
                'dalil': 'Sunnah - Grandson inherits residue as Asabah',
            }
            if granddaughter_count > 0:
                self.results['GRANDDAUGHTER'] = {
                    'share': remaining * Fraction(granddaughter_count, total_parts),
                    'original_share': remaining * Fraction(granddaughter_count, total_parts),
                    'count': granddaughter_count,
                    'type': 'TASIB',
                    'dalil': 'Sunnah - Granddaughter inherits residue alongside grandson (Asabah bil-Ghayr)',
                }
            return True

        # Priority 3: Father
        if self._is_eligible('FATHER'):
            if 'FATHER' in self.results:
                # Father had fixed 1/6 (due to female descendants) and now takes remainder as Asabah
                self.results['FATHER']['share'] += remaining
                self.results['FATHER']['type'] = 'FARD_AND_TASIB'
                self.results['FATHER']['dalil'] += ' + residue as Asabah'
            else:
                self.results['FATHER'] = {
                    'share': remaining,
                    'original_share': remaining,
                    'count': 1,
                    'type': 'TASIB',
                    'dalil': 'Quran 4:11 - Father inherits entire residue as Asabah in absence of children',
                }
            return True

        # Priority 4: Paternal Grandfather
        if self._is_eligible('PATERNAL_GRANDFATHER'):
            if 'PATERNAL_GRANDFATHER' in self.results:
                self.results['PATERNAL_GRANDFATHER']['share'] += remaining
                self.results['PATERNAL_GRANDFATHER']['type'] = 'FARD_AND_TASIB'
                self.results['PATERNAL_GRANDFATHER']['dalil'] += ' + residue as Asabah'
            else:
                self.results['PATERNAL_GRANDFATHER'] = {
                    'share': remaining,
                    'original_share': remaining,
                    'count': 1,
                    'type': 'TASIB',
                    'dalil': 'Sunnah - Paternal Grandfather inherits residue in absence of Father',
                }
            return True

        # Priority 5: Full Brother (+ Full Sister as Asabah bil-Ghayr)
        if self._is_eligible('FULL_BROTHER'):
            fb_count = self.heirs['FULL_BROTHER'].count
            fs_count = self.heirs['FULL_SISTER'].count if self._is_eligible('FULL_SISTER') else 0
            total_parts = (fb_count * 2) + fs_count

            self.results['FULL_BROTHER'] = {
                'share': remaining * Fraction(fb_count * 2, total_parts),
                'original_share': remaining * Fraction(fb_count * 2, total_parts),
                'count': fb_count,
                'type': 'TASIB',
                'dalil': 'Quran 4:176 - Full Brother inherits residue as Asabah bi-Nafsih',
            }
            if fs_count > 0:
                self.results['FULL_SISTER'] = {
                    'share': remaining * Fraction(fs_count, total_parts),
                    'original_share': remaining * Fraction(fs_count, total_parts),
                    'count': fs_count,
                    'type': 'TASIB',
                    'dalil': 'Quran 4:176 - Full Sister inherits residue alongside brother at 2:1 (Asabah bil-Ghayr)',
                }
            return True

        # Priority 6: Full Sister with Daughters/Granddaughters (Asabah ma'a al-Ghayr)
        if self._is_eligible('FULL_SISTER') and self._has_female_descendants_only():
            fs_count = self.heirs['FULL_SISTER'].count
            self.results['FULL_SISTER'] = {
                'share': remaining,
                'original_share': remaining,
                'count': fs_count,
                'type': 'TASIB',
                'dalil': 'Prophetic Hadith - Full Sister becomes Asabah alongside daughters (عصبة مع الغير)',
            }
            return True

        # Priority 7: Paternal Brother (+ Paternal Sister as Asabah bil-Ghayr)
        if self._is_eligible('PATERNAL_BROTHER'):
            pb_count = self.heirs['PATERNAL_BROTHER'].count
            ps_count = self.heirs['PATERNAL_SISTER'].count if self._is_eligible('PATERNAL_SISTER') else 0
            total_parts = (pb_count * 2) + ps_count

            self.results['PATERNAL_BROTHER'] = {
                'share': remaining * Fraction(pb_count * 2, total_parts),
                'original_share': remaining * Fraction(pb_count * 2, total_parts),
                'count': pb_count,
                'type': 'TASIB',
                'dalil': 'Quran 4:176 - Paternal Brother inherits residue as Asabah',
            }
            if ps_count > 0:
                self.results['PATERNAL_SISTER'] = {
                    'share': remaining * Fraction(ps_count, total_parts),
                    'original_share': remaining * Fraction(ps_count, total_parts),
                    'count': ps_count,
                    'type': 'TASIB',
                    'dalil': 'Quran 4:176 - Paternal Sister inherits residue alongside brother (Asabah bil-Ghayr)',
                }
            return True

        # Priority 8: Paternal Sister with Daughters/Granddaughters (Asabah ma'a al-Ghayr)
        if self._is_eligible('PATERNAL_SISTER') and self._has_female_descendants_only():
            ps_count = self.heirs['PATERNAL_SISTER'].count
            self.results['PATERNAL_SISTER'] = {
                'share': remaining,
                'original_share': remaining,
                'count': ps_count,
                'type': 'TASIB',
                'dalil': 'Prophetic Hadith - Paternal Sister becomes Asabah alongside daughters (عصبة مع الغير)',
            }
            return True

        # Priority 9-12: Extended male agnates (Full Nephew, Paternal Nephew, Uncle, Cousin)
        for rel, title in [
            ('NEPHEW_FULL', "Full Brother's Son"),
            ('NEPHEW_PATERNAL', "Paternal Brother's Son"),
            ('PATERNAL_UNCLE', 'Paternal Uncle'),
            ('COUSIN', "Paternal Uncle's Son"),
        ]:
            if self._is_eligible(rel):
                self.results[rel] = {
                    'share': remaining,
                    'original_share': remaining,
                    'count': self.heirs[rel].count,
                    'type': 'TASIB',
                    'dalil': f'Sunnah - {title} inherits residue as Asabah bi-Nafsih',
                }
                return True

        return False

    def _apply_radd(self, remaining):
        """
        Radd (الرد - Surplus):
        Redistribute surplus to Quranic heirs in proportion to their shares.
        In majority Sunni jurisprudence, spouses do not participate in Radd if other heirs exist.
        """
        self.radd_applied = True
        non_spouse_heirs = {k: v for k, v in self.results.items() if k not in ['HUSBAND', 'WIFE']}

        if non_spouse_heirs:
            sum_non_spouse = sum(v['share'] for v in non_spouse_heirs.values())
            for rel, data in non_spouse_heirs.items():
                radd_boost = remaining * (data['share'] / sum_non_spouse)
                self.results[rel]['share'] += radd_boost
                self.results[rel]['type'] = 'RADD'
                self.results[rel]['dalil'] += ' + Surplus returned via Radd (رد الفائض)'
        else:
            # Only spouse exists: Under modern legal codes (e.g. Algerian Family Code Art 167, Egyptian Law 77/1943),
            # the spouse receives the full remainder before public treasury.
            spouse_key = 'HUSBAND' if 'HUSBAND' in self.results else 'WIFE'
            if spouse_key in self.results:
                self.results[spouse_key]['share'] += remaining
                self.results[spouse_key]['type'] = 'RADD'
                self.results[spouse_key]['dalil'] += ' + Remainder returned via Radd (رد على الزوج)'

    def _calculate_asl_al_masala(self):
        denominators = [data['share'].denominator for data in self.results.values()]
        if not denominators:
            return 1
        curr = denominators[0]
        for d in denominators[1:]:
            curr = lcm(curr, d)
        return curr

    def _prepare_results(self):
        distributions = []
        self.asl_al_masala = self._calculate_asl_al_masala()

        for relationship, data in self.results.items():
            share_fraction = data['share']
            count = data['count']

            # Exact rational calculation for currency: estate * numerator / denominator
            num = self.net_estate * Decimal(share_fraction.numerator)
            den = Decimal(share_fraction.denominator)
            total_value = num / den
            per_person_value = total_value / Decimal(count) if count > 0 else Decimal('0')

            heir_obj = self.heirs.get(relationship)
            display_name = heir_obj.get_relationship_display() if heir_obj else relationship

            percentage = float(share_fraction) * 100

            distributions.append({
                'relationship': relationship,
                'relationship_display': display_name,
                'count': count,
                'share_fraction': str(share_fraction),
                'percentage': round(percentage, 4),
                'total_value': str(round(total_value, 2)),
                'per_person_value': str(round(per_person_value, 2)),
                'share_type': data.get('type', 'FARD'),
                'dalil': data.get('dalil', ''),
            })

        blocked_list = [
            {
                'relationship': rel,
                'relationship_display': self.heirs[rel].get_relationship_display(),
                'reason': reason,
            }
            for rel, reason in self.blocked_heirs.items()
        ]

        return {
            'case_id': self.case.id,
            'deceased_name': self.case.name,
            'total_estate': str(self.case.total_estate_value),
            'deductions': str(self.case.funeral_expenses + self.case.debts),
            'net_estate': str(self.net_estate),
            'asl_al_masala': self.asl_al_masala,
            'awl_applied': self.awl_applied,
            'radd_applied': self.radd_applied,
            'umariyyatan_applied': self.umariyyatan_applied,
            'distributions': sorted(distributions, key=lambda x: -float(x['percentage'])),
            'blocked_heirs': blocked_list,
        }
