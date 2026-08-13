import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    print("Testing /api/health...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("Health check response:", res.json())

    print("\nTesting GET /api/products...")
    res = client.get("/api/products")
    assert res.status_code == 200, f"Get products failed: {res.text}"
    products = res.json()
    print(f"Retrieved {len(products)} pharmaceutical products:")
    for p in products:
        print(f" - [{p['product_type']}] {p['product_code']}: {p['product_name']}")

    print("\nTesting GET /api/complaints...")
    res = client.get("/api/complaints")
    assert res.status_code == 200, f"Get complaints failed: {res.text}"
    complaints = res.json()
    print(f"Retrieved {len(complaints)} historical QMS complaints:")
    for c in complaints:
        print(f" - {c['complaint_number']} | Batch: {c['batch_number']} | Defect: {c['defect_category']}")

    print("\nTesting GET /api/complaints/dashboard/stats...")
    res = client.get("/api/complaints/dashboard/stats")
    assert res.status_code == 200, f"Dashboard stats failed: {res.text}"
    print("Dashboard metrics:", res.json())

    print("\nALL CORE REST API ENDPOINTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api()
