from app.config.supabase import supabase_admin
import json

def test_variations():
    # We try to test three variants against the Enum to see which one PostgreSQL likes
    variants = ["Reserved", "reserved", "RESERVED", "General", "general", "GENERAL"]
    results = {}
    
    # We use a dummy update on a non-existent ID to check for Enum validation errors
    for v in variants:
        try:
            # .update() on a random ID will still trigger Enum validation on the 'category' field
            resp = supabase_admin.table('allocation').update({"category": v}).eq('application_id', -999).execute()
            results[v] = "VALID (Accepted by Enum)"
        except Exception as e:
            results[v] = f"INVALID: {e}"
            
    print(f"CASE_AUDIT_RESULTS: {json.dumps(results, indent=2)}")

if __name__ == "__main__":
    test_variations()
