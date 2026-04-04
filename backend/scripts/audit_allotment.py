import asyncio
from app.config.supabase import supabase_admin
import pprint

async def audit_system():
    print("📋 Final Audit & Integrity Check...")
    
    # 1. Check for Duplicate Allotments
    print("Checking for duplicate allotments (One Student, One Seat Policy)...")
    alloc_resp = await asyncio.to_thread(
        lambda: supabase_admin.table("allocation")
        .select("application_id, hostel_id, category, application!inner(student_id, academic_year)")
        .execute()
    )

    
    allocations = getattr(alloc_resp, 'data', [])
    student_to_allocs = {}
    duplicates = []
    
    for a in allocations:
        app = a.get("application")
        if not app: continue
        sid = app.get("student_id")
        year = app.get("academic_year")
        
        key = (sid, year)
        if key in student_to_allocs:
            duplicates.append(sid)
        else:
            student_to_allocs[key] = a["application_id"]
            
    if duplicates:
        print(f"❌ AUDIT FAILURE: {len(duplicates)} students with multiple allotments found!")
    else:
        print("✅ PASS: No double-allotments detected. All students have only one seat.")

    # 2. Check Capacity Violations
    print("Checking for capacity violations...")
    hostels_resp = await asyncio.to_thread(lambda: supabase_admin.table("hostel").select("*").execute())
    hostels = getattr(hostels_resp, 'data', [])
    
    for h in hostels:
        hid = h["hostel_id"]
        hname = h["hostel_name"]
        tcap = h["total_capacity"]
        
        actual_count = len([a for a in allocations if a["hostel_id"] == hid])
        if actual_count > tcap:
            print(f"❌ AUDIT FAILURE: Hostel {hname} exceeded capacity! ({actual_count}/{tcap})")
        else:
            print(f"✅ PASS: Hostel {hname}: {actual_count}/{tcap} students.")

    # 3. Quota Integrity (Phase 1 vs Phase 2)
    print("Verifying Quota Integrity...")
    reserved_count = len([a for a in allocations if "Reserved" in a.get("category", "")])
    general_count = len([a for a in allocations if "General" in a.get("category", "")])
    
    print(f"Summary: Total {len(allocations)} allotted (Reserved: {reserved_count}, General: {general_count})")
    
    print("✨ Audit Complete!")

if __name__ == "__main__":
    asyncio.run(audit_system())
