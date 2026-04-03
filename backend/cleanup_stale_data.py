import asyncio
from app.config.supabase import supabase_admin
from app.services.allotment_engine import run_hostel_allotment

async def cleanup_stale_data():
    # 1. Fetch active session from system_config
    config_resp = supabase_admin.table('system_config').select('config_value').eq('config_key', 'academic_year').single().execute()
    if not config_resp or not config_resp.data:
        print("Error: No active academic year found in system_configs.")
        return

    active_year = config_resp.data['config_value']
    print(f"Active Academic Year: {active_year}")

    # 2. Identify stale applications (those NOT matching active year)
    stale_apps_resp = supabase_admin.table('application').select('application_id, academic_year').neq('academic_year', active_year).execute()
    stale_app_ids = [a['application_id'] for a in stale_apps_resp.data] if stale_apps_resp.data else []

    if stale_app_ids:
        print(f"Found {len(stale_app_ids)} stale applications for years other than {active_year}.")
        
        # 3. Delete related allocations first (to avoid FK constraints)
        del_alloc_resp = supabase_admin.table('allocation').delete().in_('application_id', stale_app_ids).execute()
        print(f"Deleted {len(del_alloc_resp.data) if del_alloc_resp.data else 0} stale allocations.")

        # 4. Delete stale applications
        del_app_resp = supabase_admin.table('application').delete().in_('application_id', stale_app_ids).execute()
        print(f"Deleted {len(del_app_resp.data) if del_app_resp.data else 0} stale applications.")
    else:
        print("No stale applications found. All existing data matches the current session.")

if __name__ == "__main__":
    asyncio.run(cleanup_stale_data())
