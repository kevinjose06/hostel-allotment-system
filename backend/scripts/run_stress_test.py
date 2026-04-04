import asyncio
import sys
import os

# Set PYTHONPATH to current dir
sys.path.append(os.getcwd())

from app.services.allotment_engine import run_hostel_allotment

async def main():
    # Hostel IDs: 1, 2, 5 (MH) and 3, 4 (LH)
    hostels = [1, 2, 3, 4, 5]
    academic_year = "2026-2027"
    
    print(f"🛠 Starting Internal Allotment Simulation for {academic_year}...")
    
    results = []
    for hid in hostels:
        print(f"🔄 Processing Hostel ID {hid}...")
        try:
            res = await run_hostel_allotment(hid, academic_year)
            results.append(res)
            print(f"✅ {res.get('hostel_name')}: {res.get('total_allocated')} assigned.")
        except Exception as e:
            print(f"❌ Hostel {hid} Failed: {e}")
            
    print("\n📊 Simulation Summary:")
    for res in results:
        if res:
            print(f"- {res.get('hostel_name')}: {res.get('total_allocated')} students")
            
    print("✨ Allotment Simulation Finished!")

if __name__ == "__main__":
    asyncio.run(main())
