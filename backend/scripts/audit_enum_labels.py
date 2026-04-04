from app.config.supabase import supabase_admin
import json

def audit_enum():
    # Final, definitive check of the 'allocation_category' enum
    q = "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'allocation_category' ORDER BY enumsortorder"
    try:
        resp = supabase_admin.rpc('sql', {'query': q}).execute()
        labels = [r['enumlabel'] for r in (resp.data or [])]
        print(f"ALL_LABELS_FOUND: {json.dumps(labels)}")
    except Exception as e:
        print(f"AUDIT_FAILED: {e}")

if __name__ == "__main__":
    audit_enum()
