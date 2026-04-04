import asyncio
from app.config.supabase import supabase_admin

async def backfill():
    print("🧹 Backfilling Class & Advisor IDs for Mock Students...")
    
    # 1. Update all students with 'Mock' in their first name to have class_id = 1
    resp = await asyncio.to_thread(lambda: supabase_admin.table("student")
        .update({"class_id": 1})
        .ilike("first_name", "%Mock%")
        .execute())
    
    upserted_count = len(getattr(resp, 'data', []))
    print(f"✅ Updated {upserted_count} students with class_id = 1")

    # 2. Update all applications for those students to have advisor_id = 1
    # We fetch students first to get their IDs
    student_ids = [s["student_id"] for s in resp.data]
    
    if student_ids:
        # Batch update applications in chunks to avoid URL length limits
        chunk_size = 100
        for i in range(0, len(student_ids), chunk_size):
            chunk = student_ids[i:i+chunk_size]
            a_resp = await asyncio.to_thread(lambda: supabase_admin.table("application")
                .update({"advisor_id": 1})
                .in_("student_id", chunk)
                .execute())
            print(f"✅ Updated applications for batch {i//chunk_size + 1}")

    print("🎉 Backfill Complete!")

if __name__ == "__main__":
    asyncio.run(backfill())
