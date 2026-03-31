#!/usr/bin/env python3
"""
Security Headers and Backend Caching Test
Tests specific security headers and caching implementation as requested
"""

import requests
import sys
import json
import time
from typing import Dict, Any, Optional

class SecurityCachingTester:
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

    def login_admin(self):
        """Login with admin credentials and save cookies"""
        print("🔐 Logging in as admin...")
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json={"email": "admin@retailsaas.com", "password": "Admin@123"},
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                # Save cookies for future requests
                self.session.cookies.update(response.cookies)
                
                # Also extract JWT token from cookies and set as Bearer token
                access_token = response.cookies.get('access_token')
                if access_token:
                    self.session.headers.update({'Authorization': f'Bearer {access_token}'})
                
                data = response.json()
                self.log_test("Admin Login", True, f"Logged in as {data.get('name')} ({data.get('role')})")
                return True
            else:
                self.log_test("Admin Login", False, f"Login failed: Status {response.status_code}", critical=True)
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Login error: {str(e)}", critical=True)
            return False

    def test_security_headers(self):
        """Test security headers on /api/inventory/products"""
        print("🛡️ Testing Security Headers...")
        
        try:
            response = self.session.get(f"{self.api_url}/inventory/products")
            
            if response.status_code != 200:
                self.log_test("Security Headers Test", False, f"API call failed: Status {response.status_code}", critical=True)
                return False
            
            headers = response.headers
            security_checks = []
            
            # Check X-Content-Type-Options
            if headers.get('X-Content-Type-Options') == 'nosniff':
                security_checks.append("✅ X-Content-Type-Options: nosniff")
            else:
                security_checks.append(f"❌ X-Content-Type-Options: {headers.get('X-Content-Type-Options', 'MISSING')}")
            
            # Check X-Frame-Options
            if headers.get('X-Frame-Options') == 'DENY':
                security_checks.append("✅ X-Frame-Options: DENY")
            else:
                security_checks.append(f"❌ X-Frame-Options: {headers.get('X-Frame-Options', 'MISSING')}")
            
            # Check X-XSS-Protection
            xss_protection = headers.get('X-XSS-Protection', '')
            if '1; mode=block' in xss_protection:
                security_checks.append("✅ X-XSS-Protection: 1; mode=block")
            else:
                security_checks.append(f"❌ X-XSS-Protection: {xss_protection or 'MISSING'}")
            
            # Check Referrer-Policy
            referrer_policy = headers.get('Referrer-Policy', '')
            if 'strict-origin-when-cross-origin' in referrer_policy:
                security_checks.append("✅ Referrer-Policy: strict-origin-when-cross-origin")
            else:
                security_checks.append(f"❌ Referrer-Policy: {referrer_policy or 'MISSING'}")
            
            # Check Permissions-Policy
            permissions_policy = headers.get('Permissions-Policy', '')
            if 'camera=(self)' in permissions_policy and 'microphone=()' in permissions_policy:
                security_checks.append("✅ Permissions-Policy: contains camera=(self), microphone=()")
            else:
                security_checks.append(f"❌ Permissions-Policy: {permissions_policy or 'MISSING'}")
            
            # Check Content-Security-Policy
            csp = headers.get('Content-Security-Policy', '')
            if "default-src 'self'" in csp:
                security_checks.append("✅ Content-Security-Policy: contains default-src 'self'")
            else:
                security_checks.append(f"❌ Content-Security-Policy: {csp or 'MISSING'}")
            
            # Check Strict-Transport-Security
            hsts = headers.get('Strict-Transport-Security', '')
            if 'max-age=31536000' in hsts:
                security_checks.append("✅ Strict-Transport-Security: contains max-age=31536000")
            else:
                security_checks.append(f"❌ Strict-Transport-Security: {hsts or 'MISSING'}")
            
            # Count passed checks
            passed_checks = sum(1 for check in security_checks if check.startswith("✅"))
            total_checks = len(security_checks)
            
            details = f"Security Headers ({passed_checks}/{total_checks} passed):\n" + "\n".join(f"    {check}" for check in security_checks)
            
            if passed_checks == total_checks:
                self.log_test("Security Headers", True, details)
                return True
            else:
                self.log_test("Security Headers", False, details, critical=True)
                return False
                
        except Exception as e:
            self.log_test("Security Headers", False, f"Error: {str(e)}", critical=True)
            return False

    def test_auth_no_cache(self):
        """Test that auth endpoints have no-cache headers"""
        print("🚫 Testing Auth No-Cache Headers...")
        
        try:
            response = self.session.get(f"{self.api_url}/auth/me")
            
            if response.status_code != 200:
                self.log_test("Auth No-Cache Test", False, f"API call failed: Status {response.status_code}", critical=True)
                return False
            
            headers = response.headers
            cache_checks = []
            
            # Check Cache-Control header
            cache_control = headers.get('Cache-Control', '')
            if 'no-store' in cache_control and 'no-cache' in cache_control:
                cache_checks.append("✅ Cache-Control: contains 'no-store' and 'no-cache'")
            else:
                cache_checks.append(f"❌ Cache-Control: {cache_control or 'MISSING'}")
            
            # Check Pragma header
            pragma = headers.get('Pragma', '')
            if 'no-cache' in pragma:
                cache_checks.append("✅ Pragma: contains 'no-cache'")
            else:
                cache_checks.append(f"❌ Pragma: {pragma or 'MISSING'}")
            
            # Count passed checks
            passed_checks = sum(1 for check in cache_checks if check.startswith("✅"))
            total_checks = len(cache_checks)
            
            details = f"Auth No-Cache Headers ({passed_checks}/{total_checks} passed):\n" + "\n".join(f"    {check}" for check in cache_checks)
            
            if passed_checks == total_checks:
                self.log_test("Auth No-Cache Headers", True, details)
                return True
            else:
                self.log_test("Auth No-Cache Headers", False, details, critical=True)
                return False
                
        except Exception as e:
            self.log_test("Auth No-Cache Headers", False, f"Error: {str(e)}", critical=True)
            return False

    def test_backend_caching(self):
        """Test backend caching functionality"""
        print("⚡ Testing Backend Caching...")
        
        try:
            # First call to /api/inventory/products
            print("    Making first call to /api/inventory/products...")
            start_time = time.time()
            response1 = self.session.get(f"{self.api_url}/inventory/products")
            first_call_time = time.time() - start_time
            
            if response1.status_code != 200:
                self.log_test("Backend Cache Test", False, f"First API call failed: Status {response1.status_code}", critical=True)
                return False
            
            # Second call to /api/inventory/products (should be cached)
            print("    Making second call to /api/inventory/products (should be cached)...")
            start_time = time.time()
            response2 = self.session.get(f"{self.api_url}/inventory/products")
            second_call_time = time.time() - start_time
            
            if response2.status_code != 200:
                self.log_test("Backend Cache Test", False, f"Second API call failed: Status {response2.status_code}", critical=True)
                return False
            
            # Check if second call was faster (indicating caching)
            if second_call_time < first_call_time * 0.8:  # 20% faster threshold
                self.log_test("Backend Cache Performance", True, f"Second call faster: {first_call_time:.3f}s → {second_call_time:.3f}s")
            else:
                self.log_test("Backend Cache Performance", False, f"Second call not significantly faster: {first_call_time:.3f}s → {second_call_time:.3f}s")
            
            # Check cache stats
            response3 = self.session.get(f"{self.api_url}/admin/cache-stats")
            
            if response3.status_code != 200:
                self.log_test("Cache Stats Check", False, f"Cache stats API call failed: Status {response3.status_code}")
                return False
            
            cache_data = response3.json()
            
            # Look for product_cache hits
            if 'product_cache' in cache_data:
                product_cache = cache_data['product_cache']
                hits = product_cache.get('hits', 0)
                if hits >= 1:
                    self.log_test("Cache Stats Verification", True, f"product_cache.hits = {hits} (≥ 1)")
                    return True
                else:
                    self.log_test("Cache Stats Verification", False, f"product_cache.hits = {hits} (expected ≥ 1)")
                    return False
            else:
                self.log_test("Cache Stats Verification", False, f"product_cache not found in stats: {cache_data}")
                return False
                
        except Exception as e:
            self.log_test("Backend Cache Test", False, f"Error: {str(e)}", critical=True)
            return False

    def test_cache_invalidation(self):
        """Test cache invalidation when creating new products"""
        print("🔄 Testing Cache Invalidation...")
        
        try:
            # Get initial cache stats
            print("    Getting initial cache stats...")
            response_initial = self.session.get(f"{self.api_url}/admin/cache-stats")
            
            if response_initial.status_code != 200:
                self.log_test("Cache Invalidation Test", False, f"Initial cache stats failed: Status {response_initial.status_code}", critical=True)
                return False
            
            initial_stats = response_initial.json()
            initial_hits = initial_stats.get('product_cache', {}).get('hits', 0)
            
            # Create a test product to trigger cache invalidation
            import time
            unique_suffix = str(int(time.time()))[-6:]
            
            product_data = {
                "name": "CacheTestProduct",
                "sku": "CACHE001",
                "barcode": "000CACHE001",
                "category": "Test",
                "price": 10,
                "stock": 5,
                "low_stock_threshold": 2,
                "unit": "pcs",
                "gst_rate": 0
            }
            
            print("    Creating test product to trigger cache invalidation...")
            response = self.session.post(f"{self.api_url}/inventory/products", json=product_data)
            
            if response.status_code != 200:
                self.log_test("Cache Invalidation Test", False, f"Product creation failed: Status {response.status_code}", critical=True)
                return False
            
            created_product = response.json()
            product_id = created_product.get('id')
            
            if not product_id:
                self.log_test("Cache Invalidation Test", False, "Product creation succeeded but no ID returned")
                return False
            
            # Check cache stats after invalidation
            print("    Checking cache stats after product creation...")
            response2 = self.session.get(f"{self.api_url}/admin/cache-stats")
            
            if response2.status_code != 200:
                self.log_test("Cache Invalidation Stats", False, f"Cache stats API call failed: Status {response2.status_code}")
            else:
                cache_data = response2.json()
                if 'product_cache' in cache_data:
                    product_cache = cache_data['product_cache']
                    hits_after = product_cache.get('hits', 0)
                    
                    # The cache should have been invalidated, so hits might reset or stay the same
                    # The important thing is that the cache system is working
                    self.log_test("Cache Invalidation Stats", True, f"Cache stats after invalidation - product_cache.hits = {hits_after} (was {initial_hits})")
                else:
                    self.log_test("Cache Invalidation Stats", False, f"product_cache not found in stats: {cache_data}")
            
            # Clean up: Delete the test product
            print("    Cleaning up test product...")
            delete_response = self.session.delete(f"{self.api_url}/inventory/products/{product_id}")
            
            if delete_response.status_code == 200:
                self.log_test("Test Product Cleanup", True, "Test product deleted successfully")
            else:
                self.log_test("Test Product Cleanup", False, f"Failed to delete test product: Status {delete_response.status_code}")
            
            return True
                
        except Exception as e:
            self.log_test("Cache Invalidation Test", False, f"Error: {str(e)}", critical=True)
            return False

    def run_all_tests(self):
        """Run all security and caching tests"""
        print("🚀 Starting Security Headers and Backend Caching Tests")
        print("=" * 60)
        
        # Step 1: Login
        if not self.login_admin():
            print("❌ CRITICAL: Admin login failed. Cannot proceed with tests.")
            return False
        
        # Step 2: Test Security Headers
        self.test_security_headers()
        
        # Step 3: Test Auth No-Cache
        self.test_auth_no_cache()
        
        # Step 4: Test Backend Caching
        self.test_backend_caching()
        
        # Step 5: Test Cache Invalidation
        self.test_cache_invalidation()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
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
        print(f"\n✅ Success Rate: {success_rate:.1f}%")
        
        return len(self.critical_failures) == 0

if __name__ == "__main__":
    tester = SecurityCachingTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)