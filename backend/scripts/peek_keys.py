from app.config.supabase import supabase_admin
import json

def fetch_info():
    try:
        # Check an allocation row
        res2 = supabase_admin.table('allocation').select('*').limit(1).execute()
        with open('output.json', 'w') as f:
            json.dump({
                "keys": list(res2.data[0].keys()),
                "values": res2.data[0]
            }, f, indent=2)
    except Exception as e:
        with open('output.json', 'w') as f:
             json.dump({"error": str(e)}, f)

if __name__ == "__main__":
    fetch_info()
