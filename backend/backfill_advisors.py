import os
from app.config.supabase import supabase_admin as supabase

def backfill():
    print("🚀 Starting Advisor Backfill process...")
    
    # 1. Fetch Students with their class mapping
    print("Fetching student mapping...")
    resp = supabase.table("student").select("student_id, class(advisor_id)").execute()
    
    if not resp.data:
        print("No students found.")
        return

    # 2. Build mapping of student_id -> advisor_id
    mapping = {}
    for s in resp.data:
        # PostgREST join results can be objects or lists
        cls = s.get("class")
        if isinstance(cls, list) and len(cls) > 0:
            cls = cls[0]
        
        if cls and cls.get("advisor_id"):
            mapping[s["student_id"]] = cls["advisor_id"]

    if not mapping:
        print("No valid student-to-advisor mappings found in the 'class' table.")
        return

    print(f"Found class-advisor assignments for {len(mapping)} students.")

    # 3. Update applications where advisor_id is NULL
    print("Updating applications...")
    updated_count = 0
    for student_id, advisor_id in mapping.items():
        res = supabase.table("application") \
            .update({"advisor_id": advisor_id}) \
            .eq("student_id", student_id) \
            .is_("advisor_id", "null") \
            .execute()
        
        if res.data:
            updated_count += len(res.data)

    print(f"✅ Success! Backfilled advisor_id for {updated_count} application records.")

if __name__ == "__main__":
    backfill()
