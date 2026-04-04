from app.config.supabase import supabase_admin
import json

def fetch_info():
    try:
        # Check if allocation_status is an enum
        res = supabase_admin.rpc('sql', {'query': "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'allocation_status' ORDER BY enumsortorder"}).execute()
        print("allocation_status ENUM:")
        print(res)
    except Exception as e:
        print("RPC ERROR:", e)

    try:
        # Check an allocation row
        res2 = supabase_admin.table('allocation').select('*').limit(1).execute()
        print("ROW:", json.dumps(res2.data))
    except Exception as e:
        print("TABLE ERROR:", e)

if __name__ == "__main__":
    fetch_info()
