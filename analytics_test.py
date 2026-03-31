#!/usr/bin/env python3
"""
Analytics & Monitoring System Testing
Tests the specific analytics endpoints as requested in the review request
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class AnalyticsSystemTester:
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Test tracking
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.critical_failures = []

    def log_test(self, name: str, success: bool, details: str = "", critical: bool = False):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"name": name, "details": details})
            if critical:
                self.critical_failures.append({"name": name, "details": details})
        print()

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200) -> tuple[bool, Dict]:
        """Make API request and return success status and response data"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text, "content_type": response.headers.get('content-type', '')}
            
            if not success:
                response_data["status_code"] = response.status_code
                response_data["expected_status"] = expected_status
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        print("🔐 Testing Admin Authentication...")
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json={"email": "admin@retailsaas.com", "password": "Admin@123"},
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                # Extract token from cookies if available
                cookies = response.cookies
                if 'access_token' in cookies:
                    token = cookies['access_token']
                    # Set authorization header for future requests
                    self.session.headers.update({'Authorization': f'Bearer {token}'})
                    self.log_test("Admin Login", True, f"Logged in as {data.get('name')} ({data.get('role')}) - Using Bearer token")
                    return True
                else:
                    # Try to use session cookies
                    self.session.cookies.update(response.cookies)
                    self.log_test("Admin Login", True, f"Logged in as {data.get('name')} ({data.get('role')}) - Using session cookies")
                    return True
            else:
                self.log_test("Admin Login", False, f"Login failed: Status {response.status_code}", critical=True)
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Login error: {str(e)}", critical=True)
            return False

    def test_owner_overview(self):
        """Test Owner Overview analytics endpoint"""
        print("📊 Testing Owner Overview Analytics...")
        
        success, data = self.make_request('GET', '/analytics/owner/overview?period=30d')
        
        if success:
            # Verify required fields
            required_fields = ['kpis']
            kpi_fields = ['total_revenue', 'total_invoices', 'avg_order_value', 'api_calls', 'avg_response_ms']
            
            missing_fields = []
            if 'kpis' not in data:
                missing_fields.append('kpis')
            else:
                kpis = data['kpis']
                for field in kpi_fields:
                    if field not in kpis:
                        missing_fields.append(f'kpis.{field}')
            
            if not missing_fields:
                api_calls = data['kpis'].get('api_calls', 0)
                if api_calls > 0:
                    self.log_test("Owner Overview", True, f"KPIs: Revenue=${data['kpis'].get('total_revenue', 0)}, Invoices={data['kpis'].get('total_invoices', 0)}, API calls={api_calls}")
                else:
                    self.log_test("Owner Overview", False, f"API calls should be > 0 but got {api_calls}")
            else:
                self.log_test("Owner Overview", False, f"Missing required fields: {missing_fields}")
        else:
            self.log_test("Owner Overview", False, f"Failed: {data}", critical=True)

    def test_revenue_trend(self):
        """Test Revenue Trend analytics endpoint"""
        print("📈 Testing Revenue Trend Analytics...")
        
        success, data = self.make_request('GET', '/analytics/owner/revenue-trend?period=7d')
        
        if success:
            if 'trend' in data and isinstance(data['trend'], list):
                trend = data['trend']
                if len(trend) == 7:
                    # Verify each trend entry has required fields
                    required_fields = ['date', 'label', 'revenue', 'orders']
                    valid_entries = 0
                    for entry in trend:
                        if all(field in entry for field in required_fields):
                            valid_entries += 1
                    
                    if valid_entries == 7:
                        self.log_test("Revenue Trend", True, f"7-day trend with all required fields: {valid_entries}/7 valid entries")
                    else:
                        self.log_test("Revenue Trend", False, f"Only {valid_entries}/7 entries have all required fields")
                else:
                    self.log_test("Revenue Trend", False, f"Expected 7 trend entries, got {len(trend)}")
            else:
                self.log_test("Revenue Trend", False, f"Missing or invalid 'trend' array: {data}")
        else:
            self.log_test("Revenue Trend", False, f"Failed: {data}", critical=True)

    def test_top_products(self):
        """Test Top Products analytics endpoint"""
        print("🏆 Testing Top Products Analytics...")
        
        success, data = self.make_request('GET', '/analytics/owner/top-products?period=30d')
        
        if success:
            required_fields = ['by_revenue', 'by_quantity']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                by_revenue = data['by_revenue']
                by_quantity = data['by_quantity']
                self.log_test("Top Products", True, f"Revenue leaders: {len(by_revenue)}, Quantity leaders: {len(by_quantity)}")
            else:
                self.log_test("Top Products", False, f"Missing required fields: {missing_fields}")
        else:
            self.log_test("Top Products", False, f"Failed: {data}", critical=True)

    def test_customer_insights(self):
        """Test Customer Insights analytics endpoint"""
        print("👥 Testing Customer Insights Analytics...")
        
        success, data = self.make_request('GET', '/analytics/owner/customer-insights?period=30d')
        
        if success:
            required_fields = ['top_customers', 'frequency_distribution', 'total_unique_customers', 'revenue_by_category']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                total_customers = data['total_unique_customers']
                top_customers_count = len(data['top_customers'])
                self.log_test("Customer Insights", True, f"Total customers: {total_customers}, Top customers: {top_customers_count}")
            else:
                self.log_test("Customer Insights", False, f"Missing required fields: {missing_fields}")
        else:
            self.log_test("Customer Insights", False, f"Failed: {data}", critical=True)

    def test_usage_heatmap(self):
        """Test Usage Heatmap analytics endpoint"""
        print("🔥 Testing Usage Heatmap Analytics...")
        
        success, data = self.make_request('GET', '/analytics/owner/usage-heatmap?period=30d')
        
        if success:
            required_fields = ['hourly_distribution', 'feature_breakdown', 'total_calls', 'error_rate']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                hourly_dist = data['hourly_distribution']
                if len(hourly_dist) == 24:
                    total_calls = data['total_calls']
                    error_rate = data['error_rate']
                    self.log_test("Usage Heatmap", True, f"24-hour distribution, Total calls: {total_calls}, Error rate: {error_rate}%")
                else:
                    self.log_test("Usage Heatmap", False, f"Expected 24 hourly entries, got {len(hourly_dist)}")
            else:
                self.log_test("Usage Heatmap", False, f"Missing required fields: {missing_fields}")
        else:
            self.log_test("Usage Heatmap", False, f"Failed: {data}", critical=True)

    def test_realtime_analytics(self):
        """Test Realtime analytics endpoint"""
        print("⚡ Testing Realtime Analytics...")
        
        success, data = self.make_request('GET', '/analytics/realtime')
        
        if success:
            required_fields = ['total_requests', 'requests_per_minute', 'error_rate', 'avg_response_ms', 'top_endpoints', 'recent_requests']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                total_requests = data['total_requests']
                rpm = data['requests_per_minute']
                error_rate = data['error_rate']
                avg_response = data['avg_response_ms']
                self.log_test("Realtime Analytics", True, f"Requests: {total_requests}, RPM: {rpm}, Error rate: {error_rate}%, Avg response: {avg_response}ms")
            else:
                self.log_test("Realtime Analytics", False, f"Missing required fields: {missing_fields}")
        else:
            self.log_test("Realtime Analytics", False, f"Failed: {data}", critical=True)

    def test_export_revenue_csv(self):
        """Test Export Revenue CSV"""
        print("📤 Testing Export Revenue CSV...")
        
        success, data = self.make_request('GET', '/analytics/export?type=revenue&period=30d')
        
        if success:
            # Check if response is CSV format
            if 'content_type' in data and 'text/csv' in data.get('content_type', ''):
                self.log_test("Export Revenue CSV", True, "CSV export successful with correct content type")
            elif 'raw_response' in data and isinstance(data['raw_response'], str):
                # Check if response looks like CSV
                csv_content = data['raw_response']
                if ',' in csv_content and '\n' in csv_content:
                    self.log_test("Export Revenue CSV", True, "CSV export successful (content format verified)")
                else:
                    self.log_test("Export Revenue CSV", False, "Response doesn't appear to be CSV format")
            else:
                self.log_test("Export Revenue CSV", False, f"Unexpected response format: {data}")
        else:
            self.log_test("Export Revenue CSV", False, f"Failed: {data}", critical=True)

    def test_export_api_usage_csv(self):
        """Test Export API Usage CSV"""
        print("📊 Testing Export API Usage CSV...")
        
        success, data = self.make_request('GET', '/analytics/export?type=api_usage&period=30d')
        
        if success:
            # Check if response is CSV format
            if 'content_type' in data and 'text/csv' in data.get('content_type', ''):
                self.log_test("Export API Usage CSV", True, "CSV export successful with correct content type")
            elif 'raw_response' in data and isinstance(data['raw_response'], str):
                # Check if response looks like CSV
                csv_content = data['raw_response']
                if ',' in csv_content and '\n' in csv_content:
                    self.log_test("Export API Usage CSV", True, "CSV export successful (content format verified)")
                else:
                    self.log_test("Export API Usage CSV", False, "Response doesn't appear to be CSV format")
            else:
                self.log_test("Export API Usage CSV", False, f"Unexpected response format: {data}")
        else:
            self.log_test("Export API Usage CSV", False, f"Failed: {data}", critical=True)

    def run_analytics_tests(self):
        """Run all analytics system tests"""
        print("🚀 Starting Analytics & Monitoring System Tests")
        print("=" * 60)
        
        # Login first
        if not self.test_admin_login():
            print("❌ CRITICAL: Admin login failed. Cannot proceed with analytics tests.")
            return False

        # Run analytics tests in order
        analytics_tests = [
            self.test_owner_overview,
            self.test_revenue_trend,
            self.test_top_products,
            self.test_customer_insights,
            self.test_usage_heatmap,
            self.test_realtime_analytics,
            self.test_export_revenue_csv,
            self.test_export_api_usage_csv
        ]
        
        for test_method in analytics_tests:
            try:
                test_method()
            except Exception as e:
                self.log_test(test_method.__name__, False, f"Exception: {str(e)}", critical=True)

        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📋 ANALYTICS SYSTEM TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.critical_failures:
            print(f"\n❌ CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"  - {failure['name']}: {failure['details']}")
        
        if self.failed_tests and not self.critical_failures:
            print(f"\n⚠️ NON-CRITICAL FAILURES ({len(self.failed_tests)}):")
            for failure in self.failed_tests:
                print(f"  - {failure['name']}: {failure['details']}")
        
        if self.tests_passed == self.tests_run:
            print("\n✅ ALL ANALYTICS TESTS PASSED!")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = AnalyticsSystemTester()
    success = tester.run_analytics_tests()
    tester.print_summary()
    
    sys.exit(0 if success else 1)