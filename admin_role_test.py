#!/usr/bin/env python3
"""
RetailPro SaaS ADMIN Role Integration Tests (Test 29)
Tests specific ADMIN role permissions and access control
"""

import requests
import sys
import json
from typing import Dict, Any, Optional

class AdminRoleIntegrationTester:
    def __init__(self, base_url: str = "https://1d2b9b4c-04fc-4439-957f-86f6ed48c297.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        
        # Test tracking
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.critical_failures = []
        
        # Sessions for different roles
        self.admin_session = requests.Session()
        self.platform_admin_session = requests.Session()
        self.owner_session = requests.Session()
        
        # Test data
        self.admin_user_data = None
        self.platform_admin_data = None
        self.owner_user_data = None
        self.test_owner_id = None

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

    def make_request(self, session: requests.Session, method: str, endpoint: str, 
                    data: Optional[Dict] = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make API request and return success status and response data"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        
        try:
            if method.upper() == 'GET':
                response = session.get(url)
            elif method.upper() == 'POST':
                response = session.post(url, json=data, headers={'Content-Type': 'application/json'})
            elif method.upper() == 'PUT':
                response = session.put(url, json=data, headers={'Content-Type': 'application/json'})
            elif method.upper() == 'DELETE':
                response = session.delete(url)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}
            
            if not success:
                response_data["status_code"] = response.status_code
                response_data["expected_status"] = expected_status
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_admin_login(self):
        """Test 1: Login as ADMIN"""
        print("🔐 Testing ADMIN Login...")
        
        try:
            response = self.admin_session.post(
                f"{self.api_url}/auth/login",
                json={"email": "admin@retailpro.com", "password": "AdminRP@123"},
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_user_data = data
                
                # Check expected fields
                role = data.get('role')
                is_admin = data.get('is_admin')
                
                if role == 'ADMIN' and is_admin == True:
                    self.log_test("ADMIN Login", True, f"Logged in as {data.get('name')} - Role: {role}, is_admin: {is_admin}")
                    return True
                else:
                    self.log_test("ADMIN Login", False, f"Expected role=ADMIN, is_admin=true, got role={role}, is_admin={is_admin}")
                    return False
            else:
                self.log_test("ADMIN Login", False, f"Login failed: Status {response.status_code} - {response.text}", critical=True)
                return False
                
        except Exception as e:
            self.log_test("ADMIN Login", False, f"Login error: {str(e)}", critical=True)
            return False

    def test_admin_auth_me(self):
        """Test 2: ADMIN GET /api/auth/me"""
        print("👤 Testing ADMIN Auth Me...")
        
        success, data = self.make_request(self.admin_session, 'GET', '/auth/me')
        
        if success:
            role = data.get('role')
            is_admin = data.get('is_admin')
            
            if role == 'ADMIN' and is_admin == True:
                self.log_test("ADMIN Auth Me", True, f"User: {data.get('email')} - Role: {role}, is_admin: {is_admin}")
                return True
            else:
                self.log_test("ADMIN Auth Me", False, f"Expected role=ADMIN, is_admin=true, got role={role}, is_admin={is_admin}")
                return False
        else:
            self.log_test("ADMIN Auth Me", False, f"Failed: {data}")
            return False

    def test_admin_analytics_access(self):
        """Test 3-7: ADMIN can access analytics endpoints"""
        print("📊 Testing ADMIN Analytics Access...")
        
        analytics_endpoints = [
            ('/analytics/owner/customer-insights', 'Customer Insights'),
            ('/analytics/owner/usage-heatmap', 'Usage Heatmap'),
            ('/analytics/realtime', 'Realtime Analytics'),
            ('/analytics/export?type=revenue&period=30d', 'Analytics Export'),
            ('/analytics/platform/overview', 'Platform Overview')
        ]
        
        all_passed = True
        for endpoint, name in analytics_endpoints:
            success, data = self.make_request(self.admin_session, 'GET', endpoint)
            
            if success:
                self.log_test(f"ADMIN {name}", True, f"Access granted to {endpoint}")
            else:
                self.log_test(f"ADMIN {name}", False, f"Access denied to {endpoint}: {data}")
                all_passed = False
        
        return all_passed

    def test_admin_platform_features(self):
        """Test 8-9: ADMIN can access platform features"""
        print("🏢 Testing ADMIN Platform Features...")
        
        platform_endpoints = [
            ('/platform/tenants', 'Platform Tenants'),
            ('/platform/stats', 'Platform Stats')
        ]
        
        all_passed = True
        for endpoint, name in platform_endpoints:
            success, data = self.make_request(self.admin_session, 'GET', endpoint)
            
            if success:
                self.log_test(f"ADMIN {name}", True, f"Access granted to {endpoint}")
            else:
                self.log_test(f"ADMIN {name}", False, f"Access denied to {endpoint}: {data}")
                all_passed = False
        
        return all_passed

    def test_admin_create_owner(self):
        """Test 10: ADMIN can create owners"""
        print("👑 Testing ADMIN Create Owner...")
        
        import time
        unique_suffix = str(int(time.time()))[-6:]
        
        owner_data = {
            "email": f"testowner{unique_suffix}@test.com",
            "password": "Test@123",
            "name": "Test Owner",
            "shop_name": "Test Shop"
        }
        
        success, data = self.make_request(self.admin_session, 'POST', '/platform/create-owner', owner_data)
        
        if success:
            if 'tenant_id' in data or 'id' in data:
                self.test_owner_id = data.get('tenant_id') or data.get('id')
                self.log_test("ADMIN Create Owner", True, f"Created owner: {owner_data['email']}")
                return True
            else:
                self.log_test("ADMIN Create Owner", False, f"Success but missing tenant_id/id: {data}")
                return False
        else:
            self.log_test("ADMIN Create Owner", False, f"Failed: {data}")
            return False

    def test_admin_cannot_manage_admins(self):
        """Test 11-12: ADMIN CANNOT manage other admins"""
        print("🚫 Testing ADMIN Cannot Manage Admins...")
        
        # Test 11: GET /api/platform/admins should return 403
        success, data = self.make_request(self.admin_session, 'GET', '/platform/admins', expected_status=403)
        
        if success:
            self.log_test("ADMIN Cannot List Admins", True, "Correctly blocked from listing admins (403)")
        else:
            if data.get('status_code') == 403:
                self.log_test("ADMIN Cannot List Admins", True, "Correctly blocked from listing admins (403)")
            else:
                self.log_test("ADMIN Cannot List Admins", False, f"Expected 403, got {data.get('status_code')}: {data}")
        
        # Test 12: POST /api/platform/create-admin should return 403
        admin_data = {
            "email": "test@test.com",
            "password": "Test@123",
            "name": "Test"
        }
        
        success, data = self.make_request(self.admin_session, 'POST', '/platform/create-admin', admin_data, expected_status=403)
        
        if success:
            self.log_test("ADMIN Cannot Create Admin", True, "Correctly blocked from creating admins (403)")
            return True
        else:
            if data.get('status_code') == 403:
                self.log_test("ADMIN Cannot Create Admin", True, "Correctly blocked from creating admins (403)")
                return True
            else:
                self.log_test("ADMIN Cannot Create Admin", False, f"Expected 403, got {data.get('status_code')}: {data}")
                return False

    def test_platform_admin_login(self):
        """Test 13: Login as Platform Admin"""
        print("🔐 Testing Platform Admin Login...")
        
        try:
            response = self.platform_admin_session.post(
                f"{self.api_url}/auth/login",
                json={"email": "platform@retailpro.com", "password": "Platform@123"},
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.platform_admin_data = data
                
                # Check expected fields
                is_platform_admin = data.get('is_platform_admin')
                
                if is_platform_admin == True:
                    self.log_test("Platform Admin Login", True, f"Logged in as {data.get('name')} - is_platform_admin: {is_platform_admin}")
                    return True
                else:
                    self.log_test("Platform Admin Login", False, f"Expected is_platform_admin=true, got {is_platform_admin}")
                    return False
            else:
                self.log_test("Platform Admin Login", False, f"Login failed: Status {response.status_code} - {response.text}", critical=True)
                return False
                
        except Exception as e:
            self.log_test("Platform Admin Login", False, f"Login error: {str(e)}", critical=True)
            return False

    def test_platform_admin_manage_admins(self):
        """Test 14-15: Platform Admin can manage admins"""
        print("👥 Testing Platform Admin Manage Admins...")
        
        # Test 14: GET /api/platform/admins should return 200
        success, data = self.make_request(self.platform_admin_session, 'GET', '/platform/admins')
        
        if success:
            admins = data.get('admins', [])
            self.log_test("Platform Admin List Admins", True, f"Listed {len(admins)} admins")
        else:
            self.log_test("Platform Admin List Admins", False, f"Failed: {data}")
        
        # Test 15: POST /api/platform/create-admin should return 200
        import time
        unique_suffix = str(int(time.time()))[-6:]
        
        admin_data = {
            "email": f"newadmin{unique_suffix}@retailpro.com",
            "password": "NewAdmin@123",
            "name": "New Admin"
        }
        
        success, data = self.make_request(self.platform_admin_session, 'POST', '/platform/create-admin', admin_data)
        
        if success:
            self.log_test("Platform Admin Create Admin", True, f"Created admin: {admin_data['email']}")
            return True
        else:
            self.log_test("Platform Admin Create Admin", False, f"Failed: {data}")
            return False

    def test_owner_login(self):
        """Test 16: Login as OWNER"""
        print("🔐 Testing OWNER Login...")
        
        try:
            response = self.owner_session.post(
                f"{self.api_url}/auth/login",
                json={"email": "admin@retailsaas.com", "password": "Admin@123"},
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.owner_user_data = data
                
                # Check expected fields
                role = data.get('role')
                
                if role == 'OWNER':
                    self.log_test("OWNER Login", True, f"Logged in as {data.get('name')} - Role: {role}")
                    return True
                else:
                    self.log_test("OWNER Login", False, f"Expected role=OWNER, got role={role}")
                    return False
            else:
                self.log_test("OWNER Login", False, f"Login failed: Status {response.status_code} - {response.text}", critical=True)
                return False
                
        except Exception as e:
            self.log_test("OWNER Login", False, f"Login error: {str(e)}", critical=True)
            return False

    def test_owner_analytics_restrictions(self):
        """Test 17-18: OWNER restrictions on analytics"""
        print("🚫 Testing OWNER Analytics Restrictions...")
        
        # Test 17: GET /api/analytics/owner/customer-insights should return 403
        success, data = self.make_request(self.owner_session, 'GET', '/analytics/owner/customer-insights', expected_status=403)
        
        if success or data.get('status_code') == 403:
            self.log_test("OWNER Blocked Customer Insights", True, "Correctly blocked from customer insights (403)")
        else:
            self.log_test("OWNER Blocked Customer Insights", False, f"Expected 403, got {data.get('status_code')}: {data}")
        
        # Test 18: GET /api/analytics/realtime should return 403
        success, data = self.make_request(self.owner_session, 'GET', '/analytics/realtime', expected_status=403)
        
        if success or data.get('status_code') == 403:
            self.log_test("OWNER Blocked Realtime Analytics", True, "Correctly blocked from realtime analytics (403)")
            return True
        else:
            self.log_test("OWNER Blocked Realtime Analytics", False, f"Expected 403, got {data.get('status_code')}: {data}")
            return False

    def test_owner_allowed_analytics(self):
        """Test 19: OWNER can still access allowed analytics"""
        print("✅ Testing OWNER Allowed Analytics...")
        
        # GET /api/analytics/owner/overview should return 200
        success, data = self.make_request(self.owner_session, 'GET', '/analytics/owner/overview')
        
        if success:
            self.log_test("OWNER Overview Analytics", True, "Can access owner overview analytics")
            return True
        else:
            self.log_test("OWNER Overview Analytics", False, f"Failed: {data}")
            return False

    def run_all_tests(self):
        """Run all ADMIN role integration tests"""
        print("🚀 Starting ADMIN Role Integration Tests (Test 29)")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_admin_login,                    # Test 1
            self.test_admin_auth_me,                  # Test 2
            self.test_admin_analytics_access,         # Tests 3-7
            self.test_admin_platform_features,       # Tests 8-9
            self.test_admin_create_owner,             # Test 10
            self.test_admin_cannot_manage_admins,     # Tests 11-12
            self.test_platform_admin_login,           # Test 13
            self.test_platform_admin_manage_admins,   # Tests 14-15
            self.test_owner_login,                    # Test 16
            self.test_owner_analytics_restrictions,   # Tests 17-18
            self.test_owner_allowed_analytics         # Test 19
        ]
        
        for test_method in tests:
            try:
                test_method()
            except Exception as e:
                self.log_test(test_method.__name__, False, f"Exception: {str(e)}", critical=True)

        # Print summary
        print("\n" + "=" * 60)
        print("🏁 ADMIN ROLE INTEGRATION TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Critical Failures: {len(self.critical_failures)}")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        if self.critical_failures:
            print("\n🚨 CRITICAL FAILURES:")
            for test in self.critical_failures:
                print(f"  - {test['name']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📊 Success Rate: {success_rate:.1f}%")
        
        return len(self.critical_failures) == 0 and len(self.failed_tests) == 0

if __name__ == "__main__":
    tester = AdminRoleIntegrationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)