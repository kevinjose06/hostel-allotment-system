import json
import random
import asyncio
import uuid
import sys
from app.config.supabase import supabase_admin

async def generate_mock_data():
    print("🚀 Starting Extended Mock Data Generation (800+ students)...")
    
    # 1. Fetch Benefit Categories
    cat_resp = await asyncio.to_thread(lambda: supabase_admin.table("benefit_category").select("id").eq("is_active", True).execute())
    category_ids = [c["id"] for c in getattr(cat_resp, 'data', [])]
    
    # 2. Configurations
    active_year = "2026-2027"
    count_male = 450
    count_female = 350
    total = count_male + count_female
    
    print(f"Generating {count_male} Male and {count_female} Female records for {active_year}...")
    
    # Batch processing to avoid timeouts
    batch_size = 50
    for b in range(0, total, batch_size):
        end = min(b + batch_size, total)
        current_batch_count = end - b
        print(f"Processing batch {b//batch_size + 1}: Students {b+1} to {end}...")
        
        students = []
        app_data_list = []
        
        for i in range(b + 1, end + 1):
            gender = "Male" if i <= count_male else "Female"
            
            # Create Auth User (Slow but necessary for Foreign Key)
            try:
                user_resp = await asyncio.to_thread(
                    lambda: supabase_admin.auth.admin.create_user({
                        'email': f'mock.student.{i}.{uuid.uuid4().hex[:6]}@rit.ac.in',
                        'password': 'Password123',
                        'email_confirm': True
                    })
                )
                auth_uid = user_resp.user.id
            except Exception as e:
                print(f"Error creating auth user {i}: {e}")
                continue

            # Student Info
            student = {
                "college_id": f"24BR{i:04d}",
                "first_name": "Mock",
                "last_name": f"Student {i:03d}",
                "gender": gender,
                "email": f"mock{i}@rit.ac.in",
                "contact_number": f"{random.randint(7000000000, 9999999999)}",
                "date_of_birth": "2005-01-01",
                "auth_uid": auth_uid,
                "class_id": 1 # Default Class
            }

            
            income = random.randint(20000, 800000)
            distance = random.randint(40, 750)
            
            selected_cats = []
            if random.random() < 0.35:
                num_cats = random.randint(1, min(2, len(category_ids)))
                selected_cats = random.sample(category_ids, num_cats) if category_ids else []

            app_info = {
                "college_id": f"24BR{i:04d}", # Temporary for mapping
                "academic_year": active_year,
                "advisor_id": 1, # Default Advisor
                "status": "Approved",
                "application_date": "2026-04-03",
                "family_annual_income": income,
                "distance_from_college": distance,
                "home_address": f"Mock Address {i}",
                "guardian_name": f"Guardian {i}",
                "guardian_contact": "9447000000",
                "selected_category_ids": selected_cats,
                "bpl_status": any(cid == 1 for cid in selected_cats),
                "sc_st_status": any(cid == 2 for cid in selected_cats)
            }
            
            students.append(student)
            app_data_list.append(app_info)

        if not students: continue

        # Batch Upsert Students
        await asyncio.to_thread(lambda: supabase_admin.table("student").upsert(students, on_conflict="college_id").execute())
        
        # Total Lockdown: Refetch ALL real database IDs for this batch
        all_cids = [s["college_id"] for s in students]
        refetch = await asyncio.to_thread(lambda: supabase_admin.table("student").select("college_id, student_id").in_("college_id", all_cids).execute())
        student_id_map = {s["college_id"]: s.get("student_id") for s in (refetch.data or [])}
        
        # Prepare final applications with hard assertions
        final_apps = []
        for app in app_data_list:
            cid = app.pop("college_id")
            sid = student_id_map.get(cid)
            
            if sid:
                app["student_id"] = sid
                if not app.get("advisor_id"): app["advisor_id"] = 1
                if not app.get("academic_year"): app["academic_year"] = active_year
                final_apps.append(app)
            else:
                print(f"   ⚠️  CRITICAL ERROR: Student {cid} exists in batch but has NO database ID. Skipping.")
            
        # Batch Upsert Applications
        if final_apps:
            try:
                await asyncio.to_thread(lambda: supabase_admin.table("application").upsert(final_apps, on_conflict="student_id,academic_year").execute())
            except Exception as e:
                print(f"   ❌ FAILED to insert applications for batch. Error: {e}")
                # Log a few details for debugging
                if final_apps: print(f"   Sample data point: {final_apps[0]}")
                raise e
        
        print(f"✅ Batch complete. Applications Processed: {len(final_apps)}")

    print(f"🎉 SUCCESS: Generated ~{total} mock records.")

if __name__ == "__main__":
    asyncio.run(generate_mock_data())
