from app.config.supabase import supabase_admin

def test_status():
    try:
        # First get any row
        res = supabase_admin.table('allocation').select('allocation_id, status').limit(1).execute()
        if not res.data:
            print("No rows found")
            return
            
        row = res.data[0]
        aid = row['allocation_id']
        old_status = row['status']
        print(f"Testing with allocation_id: {aid}, current status: {old_status}")
        
        # Test updating to 'Vacated'
        update_res = supabase_admin.table('allocation').update({'status': 'Vacated'}).eq('allocation_id', aid).execute()
        print("UPDATE SUCCESS. STATUS IS:", update_res.data[0]['status'])
        
        # Revert back
        supabase_admin.table('allocation').update({'status': old_status}).eq('allocation_id', aid).execute()
        print("REVERTED.")
    except Exception as e:
        print("UPDATE FAILED:", repr(e))

if __name__ == "__main__":
    test_status()
