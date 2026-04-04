import asyncio
import os
from app.services.allotment_engine import run_hostel_allotment
from app.config.supabase import supabase_admin

async def main():
    academic_year = "2026-2027"
    print(f"--- Full Allotment Reset & Re-run for {academic_year} ---")
    
    # 1. Fetch all hostels
    hostels = supabase_admin.table("hostel").select("*").execute().data
    print(f"Found {len(hostels)} hostels.")
    
    # 2. CLEAR ALL ALLOCATIONS for this year to start fresh
    print("Clearing ALL current active allocations for this year...")
    # Fetch all active allocations to filter manually
    raw_allocs = supabase_admin.table("allocation")\
        .select("allocation_id, application_id, application(academic_year)")\
        .eq("status", "Active")\
        .execute().data
    
    ids = []
    if raw_allocs:
        for item in raw_allocs:
            app_data = item.get("application")
            if isinstance(app_data, list) and len(app_data) > 0:
                app_data = app_data[0]
            
            if isinstance(app_data, dict):
                ay = str(app_data.get("academic_year", "")).strip()
                if ay == academic_year.strip():
                    ids.append(item["allocation_id"])

    if ids:
        print(f"Deleting {len(ids)} allocations...")
        # Break into chunks of 100 to avoid long URLs
        for i in range(0, len(ids), 100):
            chunk = ids[i:i+100]
            supabase_admin.table("allocation").delete().in_("allocation_id", chunk).execute()
        print("All previous allocations cleared.")
    else:
        print("No allocations found to clear.")

    # 3. RE-RUN for each hostel
    # Sort hostels to run MH then LH or vice versa, but usually order doesn't matter if we start fresh
    for h in hostels:
        hid = h["hostel_id"]
        hname = h["hostel_name"]
        print(f"\nRunning allotment for {hname} (Capacity: {h['total_capacity']})...")
        try:
            res = await run_hostel_allotment(hid, academic_year)
            print(f"SUCCESS: {res['total_allocated']} students allotted.")
        except Exception as e:
            print(f"FAILED: {hname} - {str(e)}")

    print("\n--- Process Complete ---")

if __name__ == "__main__":
    asyncio.run(main())
