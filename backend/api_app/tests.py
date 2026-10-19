from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from inheritance_engine.models import Case


class ApiAppTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_case_and_calculate_success(self):
        payload = {
            "name": "Ibrahim Al-Mansour",
            "gender": "M",
            "date_of_death": "2026-03-15",
            "total_estate_value": "200000.00",
            "funeral_expenses": "5000.00",
            "debts": "15000.00",
            "heirs": [
                {"relationship": "WIFE", "count": 1},
                {"relationship": "SON", "count": 2},
                {"relationship": "DAUGHTER", "count": 1},
            ],
            "assets": [
                {"name": "Real Estate", "asset_type": "REAL_ESTATE", "value": "150000.00", "is_divisible": True},
                {"name": "Bank Savings", "asset_type": "LIQUID", "value": "50000.00", "is_divisible": True},
            ]
        }

        response = self.client.post('/api/cases/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        case_id = response.data['id']

        # Verify calculate endpoint
        calc_resp = self.client.get(f'/api/cases/{case_id}/calculate/')
        self.assertEqual(calc_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(calc_resp.data['net_estate'], '180000.00')
        self.assertEqual(len(calc_resp.data['distributions']), 3)

    def test_reject_debts_exceeding_estate(self):
        payload = {
            "name": "Insolvent Estate",
            "gender": "M",
            "date_of_death": "2026-01-10",
            "total_estate_value": "50000.00",
            "funeral_expenses": "20000.00",
            "debts": "40000.00",
            "heirs": [{"relationship": "SON", "count": 1}],
            "assets": [{"name": "Cash", "asset_type": "LIQUID", "value": "50000.00", "is_divisible": True}]
        }

        response = self.client.post('/api/cases/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Debts and funeral expenses cannot exceed total estate value", str(response.data))
