import asyncio
from app.config.supabase import supabase_admin

async def identify_and_destroy_rogue_triggers():
    print("🔍 Investigating Database Triggers and functions...")
    
    # 1. Try to find triggers on 'student', 'student_academics', and 'application'
    tables = ["student", "student_academics", "application"]
    
    for table in tables:
        print(f"\nScanning table: {table}")
        # Note: We use a simplified query to avoid potential schema cache issues with complex joins
        query = f"SELECT tgname as name FROM pg_trigger WHERE tgrelid = '{table}'::regclass"
        try:
            resp = await asyncio.to_thread(lambda t=table: supabase_admin.rpc('sql', {'query': f"SELECT tgname FROM pg_trigger WHERE tgrelid = '{t}'::regclass AND tgisinternal = false"}).execute())
            if resp.data:
                for tg in resp.data:
                    tg_name = tg['tgname']
                    print(f"🚩 Found trigger: {tg_name}")
                    # Try to drop it
                    print(f"🗑️ Dropping trigger {tg_name} on {table}...")
                    drop_resp = await asyncio.to_thread(lambda t=table, n=tg_name: supabase_admin.rpc('sql', {'query': f"DROP TRIGGER IF EXISTS {n} ON {t} CASCADE"}).execute())
                    print(f"✅ Trigger dropped.")
            else:
                print("✨ No custom triggers found.")
        except Exception as e:
            print(f"❌ Error scanning {table}: {e}")

    # 2. Try to find functions that might be auto-creating applications
    print("\n🔍 Scanning for rogue functions...")
    func_query = "SELECT routine_name FROM information_schema.routines WHERE routine_definition ILIKE '%INSERT INTO application%'"
    try:
        resp = await asyncio.to_thread(lambda: supabase_admin.rpc('sql', {'query': func_query}).execute())
        if resp.data:
            for func in resp.data:
                func_name = func['routine_name']
                print(f"🚩 Found rogue function: {func_name}")
                # Try to drop it (we specify type since it's a routine)
                print(f"🗑️ Dropping function {func_name}...")
                drop_resp = await asyncio.to_thread(lambda n=func_name: supabase_admin.rpc('sql', {'query': f"DROP FUNCTION IF EXISTS {n} CASCADE"}).execute())
                print(f"✅ Function dropped.")
        else:
            print("✨ No rogue functions found.")
    except Exception as e:
        print(f"❌ Error scanning functions: {e}")

if __name__ == "__main__":
    asyncio.run(identify_and_destroy_rogue_triggers())
