"""
Backfill script: Populates student_academics and student_document tables
from existing application data and storage bucket files.
"""
from app.config.supabase import supabase_admin as s

def backfill_academics():
    """Populate student_academics from existing applications."""
    apps = s.table("application").select("student_id, family_annual_income, distance_from_college, bpl_status, pwd_status, sc_st_status").execute().data or []
    
    for app in apps:
        # Get student's year from class
        stu = s.table("student").select("class(year)").eq("student_id", app["student_id"]).single().execute()
        cls = stu.data.get("class", {}) if stu.data else {}
        if isinstance(cls, list): cls = cls[0] if cls else {}
        year = cls.get("year", 1)

        row = {
            "student_id": app["student_id"],
            "year_of_study": year,
            "family_annual_income": app["family_annual_income"],
            "distance_from_college": app["distance_from_college"],
            "bpl_status": app["bpl_status"],
            "pwd_status": app["pwd_status"],
            "sc_st_status": app["sc_st_status"],
        }
        try:
            s.table("student_academics").upsert(row, on_conflict="student_id").execute()
            print(f"  ✓ Academics for student {app['student_id']}")
        except Exception as e:
            print(f"  ✗ Student {app['student_id']}: {e}")


def backfill_documents():
    """Populate student_document from storage bucket files."""
    # List all folders (each is a student's auth_uid or student_id)
    try:
        folders = s.storage.from_("student-documents").list("")
    except Exception as e:
        print(f"  ✗ Cannot list bucket: {e}")
        return

    for folder in folders:
        folder_name = folder.get("name", "")
        if not folder_name:
            continue

        # List files inside this folder
        try:
            files = s.storage.from_("student-documents").list(folder_name)
        except:
            continue

        # Try to find the student_id from auth_uid or directly
        stu = s.table("student").select("student_id").eq("auth_uid", folder_name).maybe_single().execute()
        if not stu or not stu.data:
            # Try as student_id directly
            try:
                sid = int(folder_name)
                stu_check = s.table("student").select("student_id").eq("student_id", sid).maybe_single().execute()
                if stu_check and stu_check.data:
                    student_id = sid
                else:
                    continue
            except:
                continue
        else:
            student_id = stu.data["student_id"]

        for f in files:
            fname = f.get("name", "")
            if not fname or f.get("id") is None:
                # It's a subfolder, list its contents
                subfolder_path = f"{folder_name}/{fname}"
                try:
                    subfiles = s.storage.from_("student-documents").list(subfolder_path)
                except:
                    continue
                for sf in subfiles:
                    sfname = sf.get("name", "")
                    if not sfname: continue
                    file_path = f"{subfolder_path}/{sfname}"
                    doc_type = fname  # subfolder name is the doc type
                    _upsert_doc(student_id, doc_type, file_path)
            else:
                # Direct file in folder
                file_path = f"{folder_name}/{fname}"
                # Extract doc type from filename
                doc_type = fname.split("_")[0] if "_" in fname else "Other"
                _upsert_doc(student_id, doc_type, file_path)


def _upsert_doc(student_id, raw_type, file_path):
    # Map raw folder/file prefixes to DB enums
    doc_type_map = {
        'income_certificate': 'Income_Certificate',
        'residential_certificate': 'Distance_Proof',
        'pwd_certificate': 'PWD_Certificate',
        'bpl_certificate': 'BPL_Certificate',
        'sc_st_certificate': 'Caste_Certificate'
    }
    document_type = doc_type_map.get(raw_type.lower(), 'Other')
    
    try:
        s.table("student_document").upsert({
            "student_id": student_id,
            "document_type": document_type,
            "file_path": file_path,
            "verification_status": "Pending",
        }, on_conflict="student_id,document_type").execute()
        print(f"  ✓ Doc [{document_type}] for student {student_id}")
    except Exception as e:
        print(f"  ✗ Doc [{document_type}] student {student_id}: {e}")


if __name__ == "__main__":
    print("=== Backfilling student_academics ===")
    backfill_academics()
    print("\n=== Backfilling student_document ===")
    backfill_documents()
    print("\nDone!")
