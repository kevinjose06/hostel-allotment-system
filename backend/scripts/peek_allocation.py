from app.config.supabase import supabase_admin
import json

def peek_categories():
    # Attempt to pull any existing allocation record to see its category label
    try:
        resp = supabase_admin.table('allocation').select('category').limit(5).execute()
        labels = [r['category'] for r in (resp.data or [])]
        print(f"EXISTING_LABELS: {json.dumps(labels)}")
    except Exception as e:
        print(f"PEEK_FAILED: {e}")

if __name__ == "__main__":
    peek_categories()
