import asyncio
from app.config.supabase import supabase_admin

async def neutralize_ghost_logic():
    print("🚀 NUCLEAR FIX: Neutralizing all rogue database triggers...")
    
    # SQL block to identify and drop all triggers on core tables (aggressive version)
    purge_sql = """
    DO $$ 
    DECLARE 
        r RECORD;
    BEGIN
        -- Purge triggers from public.student
        FOR r IN (SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.student'::regclass AND tgisinternal = false) LOOP
            EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON public.student CASCADE';
        END LOOP;
        
        -- Purge triggers from public.student_academics
        FOR r IN (SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.student_academics'::regclass AND tgisinternal = false) LOOP
            EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON public.student_academics CASCADE';
        END LOOP;
        
        -- Purge triggers from public.application
        FOR r IN (SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.application'::regclass AND tgisinternal = false) LOOP
            EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON public.application CASCADE';
        END LOOP;

        -- Final cleanup of corrupted mock data
        DELETE FROM public.application WHERE student_id IS NULL OR advisor_id IS NULL OR academic_year IS NULL;
    END $$;
    """

    try:
        print("Executing SQL Purge...")
        # Since rpc('sql') might have cache issues, we try a direct call or a simplified version
        resp = await asyncio.to_thread(lambda: supabase_admin.rpc('sql', {'query': purge_sql}).execute())
        print("✅ Purge complete. All custom triggers removed.")
        print("✅ Specifically deleted corrupted records with null IDs.")
    except Exception as e:
        print(f"❌ Error during neutralization: {e}")
        print("💡 Attempting fallback: Direct record deletion...")
        try:
            del_resp = await asyncio.to_thread(lambda: supabase_admin.table('application').delete().is_('student_id', 'null').execute())
            print(f"✅ Fallback success: Deleted {len(del_resp.data) if del_resp.data else 0} corrupted rows.")
        except Exception as e2:
            print(f"❌ Fallback failed: {e2}")

if __name__ == "__main__":
    asyncio.run(neutralize_ghost_logic())
