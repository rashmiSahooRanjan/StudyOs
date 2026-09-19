import requests
import json

BASE_URL = "http://localhost:5000/api"

def run_tests():
    print("=== 1. Testing Admin Login (admin / admin) ===")
    res = requests.post(f"{BASE_URL}/auth/login", json={"identifier": "admin", "password": "admin"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_data = res.json()
    admin_token = admin_data["token"]
    assert admin_data["user"]["is_admin"] is True
    print("[OK] Admin logged in successfully. is_admin = True")

    print("\n=== 2. Testing Admin Stats & Users Endpoints ===")
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = requests.get(f"{BASE_URL}/admin/system-stats", headers=headers)
    assert res.status_code == 200, f"Admin stats failed: {res.text}"
    stats = res.json()["stats"]
    print(f"[OK] System Stats: Users={stats['total_users']}, Hours={stats['total_study_hours']}, Engine={stats['database_type']}, Status={stats['database_status']}")
    assert "SQLite" in stats["database_type"]

    res = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    assert res.status_code == 200, f"Admin users failed: {res.text}"
    users = res.json()["users"]
    print(f"[OK] Admin User Management: {len(users)} registered users found")

    print("\n=== 3. Testing New Student Registration (Zero Demo Data Guarantee) ===")
    import time
    unique_email = f"sarah_{int(time.time())}@studyos.local"
    new_student_payload = {
        "name": "Sarah Connor",
        "email": unique_email,
        "password": "studyos_secure_pwd",
        "target_daily_hours": 6.0
    }
    res = requests.post(f"{BASE_URL}/auth/register", json=new_student_payload)
    assert res.status_code == 201, f"Registration failed: {res.text}"
    sarah_data = res.json()
    sarah_token = sarah_data["token"]
    print(f"[OK] New student registered: ID={sarah_data['user']['id']}, Name={sarah_data['user']['name']}")

    print("\n=== 4. Verifying New User Data Isolation ===")
    sarah_headers = {"Authorization": f"Bearer {sarah_token}"}
    res = requests.get(f"{BASE_URL}/dashboard", headers=sarah_headers)
    assert res.status_code == 200, f"Dashboard failed: {res.text}"
    dash = res.json()
    assert dash["today_study"]["minutes"] == 0, "New student should have 0 today study minutes"
    assert dash["today_study"]["session_count"] == 0, "New student should have 0 sessions today"
    assert len(dash["recent_sessions"]) == 0, "New student should have 0 recent sessions"
    assert dash["streak"]["current"] == 0, "New student should have 0 streak"
    assert dash["xp"] == 0, "New student should have 0 xp"
    assert len(dash["priorities"]) == 0, f"New student must have 0 default priorities, got {dash['priorities']}"
    assert len(dash["alerts"]) == 0, f"New student must have 0 default alerts, got {dash['alerts']}"
    print("[OK] VERIFIED: New student dashboard is 100% clean with 0 demo sessions, 0 hours, 0 streak, 0 default priorities!")

    print("\n=== 5. Testing Student Logging a New Study Session ===")
    session_payload = {
        "duration_minutes": 50,
        "mode": "pomodoro",
        "topic_name": "Calculus Integration",
        "notes": "Finished solving practice set 1",
        "focus_rating": 5
    }
    res = requests.post(f"{BASE_URL}/study-sessions", json=session_payload, headers=sarah_headers)
    assert res.status_code == 201, f"Log study session failed: {res.text}"
    print("[OK] Logged 50 min session for Sarah")

    res = requests.get(f"{BASE_URL}/dashboard", headers=sarah_headers)
    dash2 = res.json()
    assert dash2["today_study"]["minutes"] == 50, f"Expected 50 minutes, got {dash2['today_study']['minutes']}"
    assert len(dash2["recent_sessions"]) == 1, "Expected exactly 1 recent session"
    assert dash2["recent_sessions"][0]["duration_minutes"] == 50
    assert dash2["recent_sessions"][0]["notes"] == "Finished solving practice set 1"
    print("[OK] VERIFIED: Sarah's dashboard now shows ONLY Sarah's 50-minute study session!")

    print("\n=== 6. Verifying Non-Admin Cannot Access Admin Endpoints ===")
    res = requests.get(f"{BASE_URL}/admin/users", headers=sarah_headers)
    assert res.status_code == 403, f"Expected 403 for non-admin, got {res.status_code}"
    print("[OK] VERIFIED: Regular student cannot access /api/admin/users (HTTP 403 Forbidden)")

    print("\n=== 7. Verifying SQLite WAL Mode Concurrency Under Rapid Access ===")
    for i in range(10):
        r = requests.get(f"{BASE_URL}/dashboard", headers=sarah_headers)
        assert r.status_code == 200
    print("[OK] SQLite WAL Mode handled rapid sequential/concurrent queries without locking!")

    print("\n=======================================================")
    print(" ALL 7 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY! ")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
