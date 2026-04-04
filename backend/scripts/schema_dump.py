from app.config.supabase import supabase_admin
import json

def get_schema():
    q = """
    SELECT column_name, data_type, character_maximum_length, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'allocation';
    """
    try:
        resp = supabase_admin.rpc('sql', {'query': q}).execute()
        print(json.dumps(resp.data, indent=2))
        
        q2 = "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'allocation_status' ORDER BY enumsortorder"
        try:
             resp2 = supabase_admin.rpc('sql', {'query': q2}).execute()
             print(f"ENUM_LABELS: {json.dumps([r['enumlabel'] for r in (resp2.data or [])])}")
        except Exception as e:
             pass
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    get_schema()
