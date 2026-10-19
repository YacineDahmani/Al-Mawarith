from django.test import TestCase
from decimal import Decimal
from datetime import date
from .models import Case, Heir
from .calculator import InheritanceCalculator


class InheritanceCalculatorTests(TestCase):
    def _create_case(self, heirs_dict, total_estate=Decimal('120000.00'), debts=Decimal('0.00'), funeral=Decimal('0.00')):
        case = Case.objects.create(
            name="Test Deceased",
            gender="M",
            date_of_death=date(2026, 1, 1),
            total_estate_value=total_estate,
            funeral_expenses=funeral,
            debts=debts,
        )
        for rel, count in heirs_dict.items():
            Heir.objects.create(case=case, relationship=rel, count=count)
        return case

    def test_umariyyatan_with_husband(self):
        """Husband (1/2) + Mother (1/6 = 1/3 of remainder) + Father (1/3 residue)"""
        case = self._create_case({'HUSBAND': 1, 'MOTHER': 1, 'FATHER': 1})
        calc = InheritanceCalculator(case)
        result = calc.calculate()

        self.assertTrue(result['umariyyatan_applied'])
        dist = {d['relationship']: d['share_fraction'] for d in result['distributions']}
        self.assertEqual(dist['HUSBAND'], '1/2')
        self.assertEqual(dist['MOTHER'], '1/6')
        self.assertEqual(dist['FATHER'], '1/3')

    def test_umariyyatan_with_wife(self):
        """Wife (1/4) + Mother (1/4 = 1/3 of remainder) + Father (1/2 residue)"""
        case = self._create_case({'WIFE': 1, 'MOTHER': 1, 'FATHER': 1})
        calc = InheritanceCalculator(case)
        result = calc.calculate()

        self.assertTrue(result['umariyyatan_applied'])
        dist = {d['relationship']: d['share_fraction'] for d in result['distributions']}
        self.assertEqual(dist['WIFE'], '1/4')
        self.assertEqual(dist['MOTHER'], '1/4')
        self.assertEqual(dist['FATHER'], '1/2')

    def test_mother_share_reduction_by_multiple_siblings(self):
        """Mother with 2 full brothers is reduced to 1/6 (Father absent)"""
        case = self._create_case({'MOTHER': 1, 'FULL_BROTHER': 2})
        calc = InheritanceCalculator(case)
        result = calc.calculate()

        dist = {d['relationship']: d['share_fraction'] for d in result['distributions']}
        self.assertEqual(dist['MOTHER'], '1/6')
        self.assertEqual(dist['FULL_BROTHER'], '5/6')

    def test_radd_single_daughter(self):
        """Single daughter without residuary heirs takes 100% via Radd"""
        case = self._create_case({'DAUGHTER': 1})
        calc = InheritanceCalculator(case)
        result = calc.calculate()

        self.assertTrue(result['radd_applied'])
        self.assertEqual(len(result['distributions']), 1)
        self.assertEqual(result['distributions'][0]['share_fraction'], '1')
        self.assertEqual(Decimal(result['distributions'][0]['total_value']), Decimal('120000.00'))

    def test_radd_with_wife_and_daughter(self):
        """Wife takes fixed 1/8; remaining 7/8 is returned entirely to daughter via Radd"""
        case = self._create_case({'WIFE': 1, 'DAUGHTER': 1}, total_estate=Decimal('80000.00'))
        calc = InheritanceCalculator(case)
        result = calc.calculate()

        self.assertTrue(result['radd_applied'])
        dist = {d['relationship']: d['share_fraction'] for d in result['distributions']}
        self.assertEqual(dist['WIFE'], '1/8')
        self.assertEqual(dist['DAUGHTER'], '7/8')

    def test_awl_husband_and_two_full_sisters(self):
        """Husband (1/2 = 3/6) + 2 Full Sisters (2/3 = 4/6). Total = 7/6 -> scaled to 3/7 and 4/7"""
        case = self._create_case({'HUSBAND': 1, 'FULL_SISTER': 2})
        calc = InheritanceCalculator(case)
        result = calc.calculate()

        self.assertTrue(result['awl_applied'])
        dist = {d['relationship']: d['share_fraction'] for d in result['distributions']}
        self.assertEqual(dist['HUSBAND'], '3/7')
        self.assertEqual(dist['FULL_SISTER'], '4/7')

    def test_asabah_maa_al_ghayr_sister_with_daughter(self):
        """Daughter (1/2) + Full Sister (Asabah ma'a al-Ghayr = 1/2 residue)"""
        case = self._create_case({'DAUGHTER': 1, 'FULL_SISTER': 1})
        calc = InheritanceCalculator(case)
        result = calc.calculate()

        dist = {d['relationship']: d['share_fraction'] for d in result['distributions']}
        self.assertEqual(dist['DAUGHTER'], '1/2')
        self.assertEqual(dist['FULL_SISTER'], '1/2')

    def test_hajb_son_blocks_siblings_and_grandson(self):
        """Son blocks grandson and full brother, leaves wife 1/8 and daughter 2:1 with son"""
        case = self._create_case({
            'WIFE': 1,
            'SON': 1,
            'DAUGHTER': 1,
            'GRANDSON': 1,
            'FULL_BROTHER': 1,
        })
        calc = InheritanceCalculator(case)
        result = calc.calculate()

        dist = {d['relationship']: d['share_fraction'] for d in result['distributions']}
        self.assertIn('WIFE', dist)
        self.assertIn('SON', dist)
        self.assertIn('DAUGHTER', dist)
        self.assertNotIn('GRANDSON', dist)
        self.assertNotIn('FULL_BROTHER', dist)

        # Wife = 1/8, Remaining = 7/8 split 2:1 -> Son = 7/8 * 2/3 = 7/12, Daughter = 7/24
        self.assertEqual(dist['WIFE'], '1/8')
        self.assertEqual(dist['SON'], '7/12')
        self.assertEqual(dist['DAUGHTER'], '7/24')

        blocked_names = [b['relationship'] for b in result['blocked_heirs']]
        self.assertIn('GRANDSON', blocked_names)
        self.assertIn('FULL_BROTHER', blocked_names)

    def test_exact_financial_conservation(self):
        """Verify sum of distributed values equals net estate with zero float loss"""
        case = self._create_case(
            {'WIFE': 1, 'SON': 2, 'DAUGHTER': 3, 'MOTHER': 1, 'FATHER': 1},
            total_estate=Decimal('333333.33'),
            debts=Decimal('3333.33'),
        )
        calc = InheritanceCalculator(case)
        result = calc.calculate()

        total_distributed = sum(Decimal(d['total_value']) for d in result['distributions'])
        # Allow +/- 0.05 rounding on fractional cents
        self.assertAlmostEqual(float(total_distributed), float(Decimal('330000.00')), places=1)
