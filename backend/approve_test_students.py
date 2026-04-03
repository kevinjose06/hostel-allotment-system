import asyncio
from app.config.supabase import supabase_admin

async def approve_test_students():
    # 1. Fetch active session
    config_resp = supabase_admin.table('system_config').select('config_value').eq('config_key', 'academic_year').single().execute()
    active_year = config_resp.data['config_value']
    print(f"Targeting Academic Year: {active_year}")

    # 2. Find 5 male students with applications in 2026-2027
    # Note: hostel_id 1 is MH, so we need gender = 'Male'
    apps_resp = (
        supabase_admin.table('application')
        .select('application_id, student:student(gender)')
        .eq('academic_year', active_year)
        .execute()
    )

    eligible_ids = []
    for a in apps_resp.data:
        if a.get('student', {}).get('gender') == 'Male':
            eligible_ids.append(a['application_id'])
            if len(eligible_ids) >= 5:
                break

    if not eligible_ids:
        print("No male students found for this session. Attempting to approve ANY 5 students regardless of gender for testing.")
        eligible_ids = [a['application_id'] for a in apps_resp.data[:5]]

    if eligible_ids:
        print(f"Approving {len(eligible_ids)} student applications: {eligible_ids}")
        update_resp = (
            supabase_admin.table('application')
            .update({'status': 'Approved'})
            .in_('application_id', eligible_ids)
            .execute()
        )
        print(f"Successfully approved {len(update_resp.data)} students.")
    else:
        print("No students found at all for this session. Please register students via the student portal first.")

if __name__ == "__main__":
    asyncio.run(approve_test_students())
