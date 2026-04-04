import asyncio
from app.services.allotment_engine import run_hostel_allotment
from app.config.supabase import supabase_admin

async def rectify():
    # 1. Fetch all hostels
    hostels_resp = supabase_admin.table("hostel").select("hostel_id, hostel_name").execute()
    hostels = hostels_resp.data
    
    # 2. Define academic year (Adjust if necessary, usually it's the current year)
    academic_year = "2026-2027"
    
    print(f"🚀 Starting Rectification for Academic Year: {academic_year}")
    
    # 3. Clean and Run Allotment for each hostel sequentially
    # Running sequentially ensures that the 'already allotted' check works correctly between hostels
    for h in hostels:
        hid = h["hostel_id"]
        hname = h["hostel_name"]
        print(f"\nProcessing {hname} (ID: {hid})...")
        try:
            result = await run_hostel_allotment(hid, academic_year)
            print(f"Result: {result['message']}")
            print(f"Stats: Total={result['total_allocated']}, Reserved={result['reserved_allocated']}, General={result['general_allocated']}")
        except Exception as e:
            print(f"[ERROR] processing {hname}: {str(e)}")

    print("\n--- Rectification complete. Please check the dashboard.")

if __name__ == "__main__":
    asyncio.run(rectify())
