import asyncio
from app.services.allotment_engine import run_hostel_allotment

async def test():
    hostel_id = 1
    academic_year = "2026-2027"
    print(f"Running test for Hostel {hostel_id}, Year {academic_year}...")
    try:
        result = await run_hostel_allotment(hostel_id, academic_year)
        import pprint
        pprint.pprint(result)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
