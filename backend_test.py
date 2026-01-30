import requests
import sys
import json
from datetime import datetime

class SafestPathAPITester:
    def __init__(self, base_url="https://safepathfinder.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
            self.log_test("API Root", success, details)
            return success
        except Exception as e:
            self.log_test("API Root", False, str(e))
            return False

    def test_get_incidents(self):
        """Test getting incidents"""
        try:
            response = requests.get(f"{self.api_url}/incidents", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Count: {len(data)} incidents"
                # Verify incident structure
                if data and len(data) > 0:
                    incident = data[0]
                    required_fields = ['id', 'lat', 'lng', 'incident_type', 'severity']
                    missing_fields = [field for field in required_fields if field not in incident]
                    if missing_fields:
                        success = False
                        details += f", Missing fields: {missing_fields}"
            self.log_test("Get Incidents", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test("Get Incidents", False, str(e))
            return False, []

    def test_get_tollgates(self):
        """Test getting toll gates"""
        try:
            response = requests.get(f"{self.api_url}/tollgates", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Count: {len(data)} tollgates"
                # Verify tollgate structure
                if data and len(data) > 0:
                    tollgate = data[0]
                    required_fields = ['id', 'lat', 'lng', 'name', 'monitored']
                    missing_fields = [field for field in required_fields if field not in tollgate]
                    if missing_fields:
                        success = False
                        details += f", Missing fields: {missing_fields}"
            self.log_test("Get Tollgates", success, details)
            return success, data if success else []
        except Exception as e:
            self.log_test("Get Tollgates", False, str(e))
            return False, []

    def test_create_incident(self):
        """Test creating a new incident"""
        try:
            test_incident = {
                "lat": 19.0760,
                "lng": 72.8777,
                "incident_type": "harassment",
                "severity": 3,
                "description": "Test incident for API testing"
            }
            
            response = requests.post(
                f"{self.api_url}/incidents", 
                json=test_incident,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Created incident ID: {data.get('id', 'No ID')}"
            else:
                details += f", Response: {response.text[:100]}"
            self.log_test("Create Incident", success, details)
            return success
        except Exception as e:
            self.log_test("Create Incident", False, str(e))
            return False

    def test_calculate_route(self):
        """Test route calculation"""
        try:
            route_request = {
                "start_lat": 19.0760,
                "start_lng": 72.8777,
                "end_lat": 19.1136,
                "end_lng": 72.8697
            }
            
            response = requests.post(
                f"{self.api_url}/routes/calculate",
                json=route_request,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                required_fields = ['safest_route', 'shortest_route', 'safety_score', 'distance_km']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Safety Score: {data.get('safety_score')}, Distance: {data.get('distance_km')}km"
            else:
                details += f", Response: {response.text[:100]}"
            self.log_test("Calculate Route", success, details)
            return success
        except Exception as e:
            self.log_test("Calculate Route", False, str(e))
            return False

    def test_get_emergency_contacts(self):
        """Test getting emergency contacts"""
        try:
            response = requests.get(f"{self.api_url}/emergency-contacts", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Count: {len(data)} contacts"
                # Verify contact structure
                if data and len(data) > 0:
                    contact = data[0]
                    required_fields = ['name', 'number', 'description']
                    missing_fields = [field for field in required_fields if field not in contact]
                    if missing_fields:
                        success = False
                        details += f", Missing fields: {missing_fields}"
                    else:
                        # Check for expected Indian emergency numbers
                        numbers = [c['number'] for c in data]
                        expected_numbers = ['181', '112', '1091', '100']
                        found_numbers = [num for num in expected_numbers if num in numbers]
                        details += f", Found emergency numbers: {found_numbers}"
            self.log_test("Get Emergency Contacts", success, details)
            return success
        except Exception as e:
            self.log_test("Get Emergency Contacts", False, str(e))
            return False

    def test_get_stats(self):
        """Test getting safety statistics"""
        try:
            response = requests.get(f"{self.api_url}/stats", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                required_fields = ['total_incidents', 'total_tollgates', 'high_risk_areas']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Incidents: {data.get('total_incidents')}, Tollgates: {data.get('total_tollgates')}, High Risk: {data.get('high_risk_areas')}"
            self.log_test("Get Safety Stats", success, details)
            return success
        except Exception as e:
            self.log_test("Get Safety Stats", False, str(e))
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting SafestPath API Tests")
        print(f"📍 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test API availability first
        if not self.test_api_root():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Test all endpoints
        self.test_get_incidents()
        self.test_get_tollgates()
        self.test_create_incident()
        self.test_calculate_route()
        self.test_get_emergency_contacts()
        self.test_get_stats()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return False

def main():
    tester = SafestPathAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())