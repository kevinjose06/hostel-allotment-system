import asyncio
from app.config.supabase import supabase_admin

async def final_sync():
    print("🚀 FINAL SYNC: Repairing database context for triggers...")
    
    # 1. Purge null applications
    print("Cleanup: Deleting corrupted records...")
    await asyncio.to_thread(lambda: supabase_admin.table('application').delete().is_('student_id', 'null').execute())
    
    # 2. Ensure class 6 has advisor 1 (for simulation)
    print("Config: Mapping class 6 to advisor 1...")
    await asyncio.to_thread(lambda: supabase_admin.table('class').update({'advisor_id': 1}).eq('class_id', 6).execute())
    
    # 3. Mass-Update students to class 6 if they have no class
    print("Repair: Assigning class 6 to all unassigned students...")
    await asyncio.to_thread(lambda: supabase_admin.table('student').update({'class_id': 6}).is_('class_id', 'null').execute())

    print("✅ System synchronized. Trigger context is now valid.")

if __name__ == "__main__":
    asyncio.run(final_sync())
