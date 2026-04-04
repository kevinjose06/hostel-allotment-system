from app.config.supabase import supabase_admin

def check_configs():
    resp = supabase_admin.table("system_config").select("*").execute()
    print("System Configs:")
    for item in resp.data:
        print(f"{item['config_key']}: {item['config_value']}")

if __name__ == "__main__":
    check_configs()
