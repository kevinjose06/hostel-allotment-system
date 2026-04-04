from app.config.supabase import supabase_admin
import json

def get_actual_enum_labels():
    # Definitively pulling the dictionary for 'allocation_category'
    q = "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'allocation_category'"
    try:
        resp = supabase_admin.rpc('sql', {'query': q}).execute()
        # RPC can return many things, we want the list of records
        data = resp.data
        if isinstance(data, list):
            labels = [r.get('enumlabel') for r in data if 'enumlabel' in r]
            print(f"THE_MAGIC_WORDS: {json.dumps(labels)}")
        else:
            print(f"UNEXPECTED_DATA_FORMAT: {data}")
    except Exception as e:
        print(f"SQL_QUERY_FAILED: {e}")

if __name__ == "__main__":
    get_actual_enum_labels()
