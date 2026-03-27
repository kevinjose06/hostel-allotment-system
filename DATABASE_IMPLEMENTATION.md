# DATABASE IMPLEMENTATION GUIDE
## Hostel Allotment System — Rajiv Gandhi Institute of Technology, Kottayam
### Supabase (PostgreSQL) Implementation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Database Architecture](#2-database-architecture)
3. [ER Diagram Summary](#3-er-diagram-summary)
4. [Hostel Seed Data](#4-hostel-seed-data)
5. [Full SQL Schema](#5-full-sql-schema)
6. [Row Level Security (RLS) Policies](#6-row-level-security-rls-policies)
7. [Indexes](#7-indexes)
8. [Views](#8-views)
9. [Database Functions & Stored Procedures](#9-database-functions--stored-procedures)
10. [Merit Score Algorithm](#10-merit-score-algorithm)
11. [Allocation Trigger Logic](#11-allocation-trigger-logic)
12. [Supabase Storage Buckets](#12-supabase-storage-buckets)
13. [Seeding & Initial Data](#13-seeding--initial-data)
14. [Integrity Constraints Summary](#14-integrity-constraints-summary)
15. [Supabase Setup Checklist](#15-supabase-setup-checklist)

---

## 1. Project Overview

This database supports the **Hostel Admission and Allocation System** for RGIT Kottayam. The system manages:

- Student hostel applications
- Class Advisor review workflow (Accept / Reject / Return for Clarification)
- Two-phase merit-based hostel allotment (Reserved category seats first, then General)
- Admin management of advisors and classes
- Warden management of hostel details
- Document uploads for eligibility verification

**Technology:** Supabase (PostgreSQL 15+) with Row Level Security, Edge Functions, and Storage.

---

## 2. Database Architecture

The database is organized around the following core entities derived from the ER diagram:

```
ADMIN
  └── manages ──► CLASS_ADVISOR (N per admin)
                      └── assigned_to ──► CLASS (1:1)
                                           └── contains ──► STUDENT (N)
                                                              ├── has ──► STUDENT_ACADEMICS (1:1)
                                                              ├── uploads ──► STUDENT_DOCUMENT (1:N)
                                                              └── submits ──► APPLICATION (1 per academic year)
                                                                               └── reviews ──► CLASS_ADVISOR
                                                                               └── results_in ──► ALLOCATION (0/1)
                                                                                                    └── receives ──► HOSTEL
                                                                                                                      └── managed_by ──► WARDEN
```

---

## 3. ER Diagram Summary

Based on the submitted ER diagram, the following entity-relationship mappings are implemented:

| Entity | Key Attributes |
|---|---|
| ADMIN | admin_id, name, email, contact_no |
| CLASS_ADVISOR | advisor_id, name, department, contact_no, email, admin_id |
| CLASS | class_id, degree_program, department, year, division, advisor_id |
| STUDENT | student_id, first_name, last_name, gender, date_of_birth, college_id, contact_number, email, distance_from_college, family_annual_income, bpl_status, pwd_status, sc_st_status |
| STUDENT_ACADEMICS | student_id, year_of_study, (age — derived) |
| STUDENT_DOCUMENT | document_id, student_id, document_type, file_path, uploaded_at, verification_status |
| APPLICATION | application_id, student_id, advisor_id, application_date, academic_year, status, reviewed_date, merit_score, merit_svarks, remarks, family_annual_income, merit_score |
| ALLOCATION | allocation_id, application_id, hostel_id, allocation_date, status |
| HOSTEL | hostel_id, hostel_name, hostel_type, hostel_seats, total_capacity, current_occupancy, available_seats |
| WARDEN | warden_id, name, contact_no, email, hostel_id |

---

## 4. Hostel Seed Data

The college has 5 government hostels. Assumed seat capacities (to be updated by admin):

| Hostel ID | Hostel Name | Type | Total Capacity | Reserved Seats (20%) |
|---|---|---|---|---|
| 1 | Ladies Hostel 1 | LH | 150 | 30 |
| 2 | Ladies Hostel 2 | LH | 120 | 24 |
| 3 | Ladies Hostel 3 | LH | 100 | 20 |
| 4 | Men's Hostel 1 | MH | 200 | 40 |
| 5 | Men's Hostel 2 | MH | 180 | 36 |

Reserved seats are split: PWD (priority), then BPL, then SC/ST within the 20% pool.

---

## 5. Full SQL Schema

Run the following SQL in the Supabase SQL Editor in order.

### 5.1 Enable Extensions

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable pgcrypto for password hashing (if not using Supabase Auth)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 5.2 ENUM Types

```sql
-- Application status
CREATE TYPE application_status AS ENUM (
  'Pending',
  'Under_Review',
  'Approved',
  'Rejected',
  'Returned',
  'Waitlisted'
);

-- Allocation status
CREATE TYPE allocation_status AS ENUM (
  'Active',
  'Cancelled',
  'Waitlisted'
);

-- Hostel type
CREATE TYPE hostel_type AS ENUM ('LH', 'MH');

-- Document types students can upload
CREATE TYPE document_type AS ENUM (
  'Income_Certificate',
  'Caste_Certificate',
  'BPL_Certificate',
  'PWD_Certificate',
  'Distance_Proof',
  'Photo_ID',
  'Other'
);

-- Verification status for documents
CREATE TYPE verification_status AS ENUM (
  'Pending',
  'Verified',
  'Rejected'
);

-- Degree programs
CREATE TYPE degree_program AS ENUM (
  'BTech',
  'MTech',
  'MCA',
  'BArch'
);

-- Departments
CREATE TYPE department_name AS ENUM (
  'Computer Science',
  'Electrical and Electronics',
  'Electronics and Communication',
  'Civil',
  'Mechanical',
  'Robotics',
  'Architecture'
);

-- Allocation category
CREATE TYPE allocation_category AS ENUM (
  'Reserved_PWD',
  'Reserved_BPL',
  'Reserved_SCST',
  'General'
);

-- User roles (for auth mapping)
CREATE TYPE user_role AS ENUM ('admin', 'advisor', 'student', 'warden');
```

### 5.3 ADMIN Table

```sql
CREATE TABLE admin (
  admin_id    SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  contact_no  VARCHAR(15),
  auth_uid    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE admin IS 'System administrators who manage advisors and overall system configuration.';
```

### 5.4 CLASS_ADVISOR Table

```sql
CREATE TABLE class_advisor (
  advisor_id  SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  department  department_name NOT NULL,
  contact_no  VARCHAR(15),
  email       VARCHAR(150) UNIQUE NOT NULL,
  admin_id    INT NOT NULL REFERENCES admin(admin_id) ON DELETE RESTRICT,
  auth_uid    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE class_advisor IS 'Class advisors who review and approve/reject student hostel applications.';
```

### 5.5 CLASS Table

```sql
CREATE TABLE class (
  class_id        SERIAL PRIMARY KEY,
  degree_program  degree_program NOT NULL,
  department      department_name NOT NULL,
  year            INT NOT NULL CHECK (year BETWEEN 1 AND 5),
  division        VARCHAR(10) NOT NULL,
  advisor_id      INT UNIQUE NOT NULL REFERENCES class_advisor(advisor_id) ON DELETE RESTRICT,
  academic_year   INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_class_unique UNIQUE (degree_program, department, year, division, academic_year)
);

COMMENT ON TABLE class IS 'Academic class groupings. Each class has exactly one class advisor.';
```

### 5.6 STUDENT Table

```sql
CREATE TABLE student (
  student_id            SERIAL PRIMARY KEY,
  college_id            VARCHAR(20) UNIQUE NOT NULL,  -- e.g., KTE24CS079
  first_name            VARCHAR(50) NOT NULL,
  last_name             VARCHAR(50) NOT NULL,
  gender                VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  date_of_birth         DATE NOT NULL,
  contact_number        VARCHAR(15) NOT NULL,
  email                 VARCHAR(150) UNIQUE NOT NULL,
  class_id              INT NOT NULL REFERENCES class(class_id) ON DELETE RESTRICT,

  -- Supabase Auth link
  auth_uid              UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE student IS 'Stores student personal, academic, and socioeconomic details.';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_updated_at
  BEFORE UPDATE ON student
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 5.7 STUDENT_ACADEMICS Table

```sql
CREATE TABLE student_academics (
  id              SERIAL PRIMARY KEY,
  student_id      INT UNIQUE NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
  year_of_study   INT NOT NULL CHECK (year_of_study BETWEEN 1 AND 5),
  cgpa            DECIMAL(4, 2) CHECK (cgpa BETWEEN 0 AND 10),
  semester        INT CHECK (semester BETWEEN 1 AND 10),
  
  -- Socioeconomic fields (Current Profile)
  family_annual_income  DECIMAL(12, 2) NOT NULL CHECK (family_annual_income >= 0),
  distance_from_college DECIMAL(7, 2) NOT NULL CHECK (distance_from_college >= 0),
  bpl_status            BOOLEAN NOT NULL DEFAULT FALSE,
  pwd_status            BOOLEAN NOT NULL DEFAULT FALSE,
  sc_st_status          BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_academics_updated_at
  BEFORE UPDATE ON student_academics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 5.8 STUDENT_DOCUMENT Table

```sql
CREATE TABLE student_document (
  document_id          SERIAL PRIMARY KEY,
  student_id           INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
  document_type        document_type NOT NULL,
  file_path            TEXT NOT NULL,  -- Supabase Storage path
  uploaded_at          TIMESTAMPTZ DEFAULT NOW(),
  verification_status  verification_status NOT NULL DEFAULT 'Pending',
  verified_by          INT REFERENCES class_advisor(advisor_id) ON DELETE SET NULL,
  verified_at          TIMESTAMPTZ,
  remarks              TEXT,

  CONSTRAINT uq_student_doc_type UNIQUE (student_id, document_type)
);

COMMENT ON TABLE student_document IS 'Documents uploaded by students for hostel eligibility verification.';
```

### 5.9 HOSTEL Table

```sql
CREATE TABLE hostel (
  hostel_id         SERIAL PRIMARY KEY,
  hostel_name       VARCHAR(100) NOT NULL UNIQUE,
  hostel_type       hostel_type NOT NULL,   -- 'LH' or 'MH'
  total_capacity    INT NOT NULL CHECK (total_capacity > 0),
  current_occupancy INT NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
  -- available_seats is a computed column
  reserved_seats    INT NOT NULL DEFAULT 0 CHECK (reserved_seats >= 0),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_occupancy_within_capacity CHECK (current_occupancy <= total_capacity),
  CONSTRAINT chk_reserved_within_capacity CHECK (reserved_seats <= total_capacity)
);

-- Computed column: available_seats
ALTER TABLE hostel ADD COLUMN available_seats INT
  GENERATED ALWAYS AS (total_capacity - current_occupancy) STORED;

CREATE TRIGGER trg_hostel_updated_at
  BEFORE UPDATE ON hostel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE hostel IS 'Government hostels. 3 Ladies Hostels (LH) and 2 Mens Hostels (MH).';
```

### 5.10 WARDEN Table

```sql
CREATE TABLE warden (
  warden_id   SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  contact_no  VARCHAR(15),
  email       VARCHAR(150) UNIQUE,
  hostel_id   INT UNIQUE NOT NULL REFERENCES hostel(hostel_id) ON DELETE RESTRICT,
  auth_uid    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE warden IS 'One warden manages exactly one hostel.';
```

### 5.11 APPLICATION Table

```sql
CREATE TABLE application (
  application_id        SERIAL PRIMARY KEY,
  student_id            INT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
  advisor_id            INT REFERENCES class_advisor(advisor_id) ON DELETE SET NULL,
  application_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  academic_year         INT NOT NULL,
  status                application_status NOT NULL DEFAULT 'Pending',
  reviewed_date         DATE,
  merit_score           DECIMAL(6, 4),       -- Computed after advisor approval
  merit_svarks          DECIMAL(6, 4),       -- Normalized income score component
  family_annual_income  DECIMAL(12, 2) NOT NULL,
  distance_from_college DECIMAL(7, 2) NOT NULL,
  remarks               TEXT,
  submitted_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  -- One application per student per academic year
  CONSTRAINT uq_student_academic_year UNIQUE (student_id, academic_year)
);

CREATE TRIGGER trg_application_updated_at
  BEFORE UPDATE ON application
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE application IS 'Hostel application submitted by students. One per academic year.';
```

### 5.12 ALLOCATION Table

```sql
CREATE TABLE allocation (
  allocation_id     SERIAL PRIMARY KEY,
  application_id    INT UNIQUE NOT NULL REFERENCES application(application_id) ON DELETE RESTRICT,
  hostel_id         INT NOT NULL REFERENCES hostel(hostel_id) ON DELETE RESTRICT,
  warden_id         INT REFERENCES warden(warden_id) ON DELETE SET NULL,
  allocation_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  status            allocation_status NOT NULL DEFAULT 'Active',
  category          allocation_category NOT NULL DEFAULT 'General',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_allocation_updated_at
  BEFORE UPDATE ON allocation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE allocation IS 'Hostel allocation records. A student can have at most one active allocation.';
```

---

## 6. Row Level Security (RLS) Policies

Enable RLS on all tables and define access policies per role. Supabase Auth metadata is used to determine `user_role`.

```sql
-- Enable RLS on all tables
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_advisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE class ENABLE ROW LEVEL SECURITY;
ALTER TABLE student ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_academics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel ENABLE ROW LEVEL SECURITY;
ALTER TABLE warden ENABLE ROW LEVEL SECURITY;
ALTER TABLE application ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation ENABLE ROW LEVEL SECURITY;
```

### Helper function to get current user role

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'student'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_student_id()
RETURNS INT AS $$
  SELECT student_id FROM student WHERE auth_uid = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_advisor_id()
RETURNS INT AS $$
  SELECT advisor_id FROM class_advisor WHERE auth_uid = auth.uid();
$$ LANGUAGE sql STABLE;
```

### Admin Policies

```sql
-- Admins can do everything
CREATE POLICY admin_all ON admin
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY admin_all_advisors ON class_advisor
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY admin_all_classes ON class
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');
```

### Student Policies

```sql
-- Students can view their own record
CREATE POLICY student_view_self ON student
  FOR SELECT TO authenticated
  USING (auth_uid = auth.uid() OR get_user_role() IN ('admin', 'advisor'));

-- Students can update their own profile
CREATE POLICY student_update_self ON student
  FOR UPDATE TO authenticated
  USING (auth_uid = auth.uid());

-- Students can insert their own application
CREATE POLICY student_insert_application ON application
  FOR INSERT TO authenticated
  WITH CHECK (student_id = get_student_id());

-- Students can view their own application
CREATE POLICY student_view_application ON application
  FOR SELECT TO authenticated
  USING (
    student_id = get_student_id()
    OR get_user_role() IN ('admin', 'advisor', 'warden')
  );

-- Students can upload their own documents
CREATE POLICY student_insert_docs ON student_document
  FOR INSERT TO authenticated
  WITH CHECK (student_id = get_student_id());

CREATE POLICY student_view_docs ON student_document
  FOR SELECT TO authenticated
  USING (
    student_id = get_student_id()
    OR get_user_role() IN ('admin', 'advisor')
  );
```

### Advisor Policies

```sql
-- Advisors can view applications for their assigned class
CREATE POLICY advisor_view_applications ON application
  FOR SELECT TO authenticated
  USING (
    advisor_id = get_advisor_id()
    OR get_user_role() = 'admin'
  );

-- Advisors can update application status (approve/reject/return)
CREATE POLICY advisor_update_application ON application
  FOR UPDATE TO authenticated
  USING (advisor_id = get_advisor_id())
  WITH CHECK (advisor_id = get_advisor_id());
```

### Hostel / Warden Policies

```sql
-- Anyone authenticated can view hostel info
CREATE POLICY hostel_view_all ON hostel
  FOR SELECT TO authenticated
  USING (true);

-- Only admin can insert/update hostels
CREATE POLICY hostel_admin_write ON hostel
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- Wardens can view their hostel's allocations
CREATE POLICY warden_view_allocation ON allocation
  FOR SELECT TO authenticated
  USING (
    warden_id = (SELECT warden_id FROM warden WHERE auth_uid = auth.uid())
    OR get_user_role() = 'admin'
  );
```

---

## 7. Indexes

```sql
-- Student lookups
CREATE INDEX idx_student_auth_uid ON student(auth_uid);
CREATE INDEX idx_student_class_id ON student(class_id);
CREATE INDEX idx_student_gender ON student(gender);
CREATE INDEX idx_student_bpl ON student(bpl_status) WHERE bpl_status = TRUE;
CREATE INDEX idx_student_pwd ON student(pwd_status) WHERE pwd_status = TRUE;
CREATE INDEX idx_student_scst ON student(sc_st_status) WHERE sc_st_status = TRUE;

-- Application lookups
CREATE INDEX idx_application_student ON application(student_id);
CREATE INDEX idx_application_advisor ON application(advisor_id);
CREATE INDEX idx_application_status ON application(status);
CREATE INDEX idx_application_year ON application(academic_year);
CREATE INDEX idx_application_merit ON application(merit_score DESC NULLS LAST);

-- Allocation lookups
CREATE INDEX idx_allocation_hostel ON allocation(hostel_id);
CREATE INDEX idx_allocation_status ON allocation(status);
CREATE INDEX idx_allocation_category ON allocation(category);

-- Class advisor
CREATE INDEX idx_advisor_auth_uid ON class_advisor(auth_uid);
CREATE INDEX idx_advisor_admin ON class_advisor(admin_id);

-- Documents
CREATE INDEX idx_doc_student ON student_document(student_id);
CREATE INDEX idx_doc_type ON student_document(document_type);
```

---

## 8. Views

### 8.1 Student Full Profile View

```sql
CREATE OR REPLACE VIEW v_student_profile AS
SELECT
  s.student_id,
  s.college_id,
  s.first_name || ' ' || s.last_name AS full_name,
  s.gender,
  DATE_PART('year', AGE(s.date_of_birth)) AS age,
  s.email,
  s.contact_number,
  c.degree_program,
  c.department,
  c.year AS class_year,
  c.division,
  sa.year_of_study,
  sa.cgpa,
  sa.family_annual_income,
  sa.distance_from_college,
  sa.bpl_status,
  sa.pwd_status,
  sa.sc_st_status,
  ca.name AS advisor_name,
  ca.email AS advisor_email
FROM student s
JOIN class c ON s.class_id = c.class_id
LEFT JOIN student_academics sa ON s.student_id = sa.student_id
LEFT JOIN class_advisor ca ON c.advisor_id = ca.advisor_id;
```

### 8.2 Application Status Dashboard View

```sql
CREATE OR REPLACE VIEW v_application_dashboard AS
SELECT
  a.application_id,
  a.academic_year,
  a.status,
  a.application_date,
  a.reviewed_date,
  a.merit_score,
  a.remarks,
  s.college_id,
  s.first_name || ' ' || s.last_name AS student_name,
  s.gender,
  sa.bpl_status,
  sa.pwd_status,
  sa.sc_st_status,
  a.family_annual_income,
  a.distance_from_college,
  c.degree_program,
  c.department,
  ca.name AS advisor_name
FROM application a
JOIN student s ON a.student_id = s.student_id
JOIN class c ON s.class_id = c.class_id
LEFT JOIN student_academics sa ON s.student_id = sa.student_id
LEFT JOIN class_advisor ca ON a.advisor_id = ca.advisor_id;
```

### 8.3 Hostel Occupancy View

```sql
CREATE OR REPLACE VIEW v_hostel_occupancy AS
SELECT
  h.hostel_id,
  h.hostel_name,
  h.hostel_type,
  h.total_capacity,
  h.current_occupancy,
  h.available_seats,
  h.reserved_seats,
  ROUND((h.current_occupancy::DECIMAL / h.total_capacity) * 100, 2) AS occupancy_pct,
  w.name AS warden_name,
  w.contact_no AS warden_contact
FROM hostel h
LEFT JOIN warden w ON h.hostel_id = w.hostel_id;
```

### 8.4 Allocation Result View

```sql
CREATE OR REPLACE VIEW v_allocation_result AS
SELECT
  al.allocation_id,
  al.allocation_date,
  al.status AS allocation_status,
  al.category,
  s.college_id,
  s.first_name || ' ' || s.last_name AS student_name,
  s.gender,
  h.hostel_name,
  h.hostel_type,
  a.academic_year,
  a.merit_score,
  w.name AS warden_name
FROM allocation al
JOIN application a ON al.application_id = a.application_id
JOIN student s ON a.student_id = s.student_id
JOIN hostel h ON al.hostel_id = h.hostel_id
LEFT JOIN warden w ON al.warden_id = w.warden_id;
```

---

## 9. Database Functions & Stored Procedures

### 9.1 Compute and Store Merit Score

The merit score is computed from two normalized values:
- **Income Score** = 1 - (income / max_income)  ← lower income = higher score
- **Distance Score** = distance / max_distance    ← higher distance = higher score
- **Merit Score** = 0.5 × income_score + 0.5 × distance_score  (equal weightage)

```sql
CREATE OR REPLACE FUNCTION compute_merit_scores(p_academic_year INT)
RETURNS VOID AS $$
DECLARE
  max_income   DECIMAL;
  max_distance DECIMAL;
BEGIN
  -- Get normalization bounds
  SELECT MAX(family_annual_income), MAX(distance_from_college)
  INTO max_income, max_distance
  FROM application
  WHERE academic_year = p_academic_year
    AND status = 'Approved';

  -- Guard against division by zero
  IF max_income = 0 THEN max_income := 1; END IF;
  IF max_distance = 0 THEN max_distance := 1; END IF;

  -- Update merit scores for all approved applications
  UPDATE application
  SET
    merit_svarks = ROUND(1.0 - (family_annual_income / max_income), 4),
    merit_score  = ROUND(
      0.5 * (1.0 - (family_annual_income / max_income)) +
      0.5 * (distance_from_college / max_distance),
    4)
  WHERE academic_year = p_academic_year
    AND status = 'Approved';
END;
$$ LANGUAGE plpgsql;
```

### 9.2 Auto-assign Advisor to Application on Submit

```sql
CREATE OR REPLACE FUNCTION assign_advisor_on_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically find the advisor for this student's class
  SELECT c.advisor_id
  INTO NEW.advisor_id
  FROM student s
  JOIN class c ON s.class_id = c.class_id
  WHERE s.student_id = NEW.student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assign_advisor
  BEFORE INSERT ON application
  FOR EACH ROW EXECUTE FUNCTION assign_advisor_on_application();
```

### 9.3 Prevent Duplicate Active Allocations

```sql
CREATE OR REPLACE FUNCTION check_single_active_allocation()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INT;
  v_student_id INT;
BEGIN
  SELECT a.student_id INTO v_student_id
  FROM application a WHERE a.application_id = NEW.application_id;

  SELECT COUNT(*) INTO existing_count
  FROM allocation al
  JOIN application ap ON al.application_id = ap.application_id
  WHERE ap.student_id = v_student_id
    AND al.status = 'Active';

  IF existing_count > 0 THEN
    RAISE EXCEPTION 'Student already has an active hostel allocation.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_allocation
  BEFORE INSERT ON allocation
  FOR EACH ROW EXECUTE FUNCTION check_single_active_allocation();
```

### 9.4 Enforce Gender-Hostel Constraint

```sql
CREATE OR REPLACE FUNCTION check_gender_hostel_match()
RETURNS TRIGGER AS $$
DECLARE
  v_gender      TEXT;
  v_hostel_type TEXT;
BEGIN
  SELECT s.gender INTO v_gender
  FROM application a JOIN student s ON a.student_id = s.student_id
  WHERE a.application_id = NEW.application_id;

  SELECT h.hostel_type INTO v_hostel_type
  FROM hostel h WHERE h.hostel_id = NEW.hostel_id;

  IF v_gender = 'Male' AND v_hostel_type = 'LH' THEN
    RAISE EXCEPTION 'Male students cannot be allocated to Ladies Hostels.';
  END IF;

  IF v_gender = 'Female' AND v_hostel_type = 'MH' THEN
    RAISE EXCEPTION 'Female students cannot be allocated to Mens Hostels.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gender_hostel_match
  BEFORE INSERT OR UPDATE ON allocation
  FOR EACH ROW EXECUTE FUNCTION check_gender_hostel_match();
```

### 9.5 Update Hostel Occupancy on Allocation

```sql
CREATE OR REPLACE FUNCTION update_hostel_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'Active' THEN
    UPDATE hostel
    SET current_occupancy = current_occupancy + 1
    WHERE hostel_id = NEW.hostel_id;

    -- Check capacity not exceeded
    IF (SELECT current_occupancy FROM hostel WHERE hostel_id = NEW.hostel_id) >
       (SELECT total_capacity FROM hostel WHERE hostel_id = NEW.hostel_id) THEN
      RAISE EXCEPTION 'Hostel capacity exceeded.';
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'Active' AND NEW.status = 'Cancelled' THEN
      UPDATE hostel
      SET current_occupancy = GREATEST(current_occupancy - 1, 0)
      WHERE hostel_id = OLD.hostel_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hostel_occupancy
  AFTER INSERT OR UPDATE ON allocation
  FOR EACH ROW EXECUTE FUNCTION update_hostel_occupancy();
```

---

## 10. Merit Score Algorithm

The full allotment algorithm is designed to be called as a Supabase Edge Function (Python/Node) or a Postgres stored procedure:

```sql
CREATE OR REPLACE FUNCTION run_hostel_allotment(
  p_academic_year INT,
  p_hostel_id     INT
)
RETURNS JSON AS $$
DECLARE
  v_hostel_type      TEXT;
  v_total_capacity   INT;
  v_reserved_seats   INT;
  v_gender_filter    TEXT;
  v_allocated_count  INT := 0;
  v_result           JSON;
  rec                RECORD;
BEGIN
  -- Get hostel info
  SELECT hostel_type, total_capacity, reserved_seats
  INTO v_hostel_type, v_total_capacity, v_reserved_seats
  FROM hostel WHERE hostel_id = p_hostel_id;

  -- Determine gender eligibility
  IF v_hostel_type = 'LH' THEN v_gender_filter := 'Female';
  ELSIF v_hostel_type = 'MH' THEN v_gender_filter := 'Male';
  END IF;

  -- Recompute merit scores
  PERFORM compute_merit_scores(p_academic_year);

  -- ================================================================
  -- PHASE 1: Reserved category allocation (PWD > BPL > SC/ST)
  -- ================================================================
  FOR rec IN
    SELECT
      a.application_id,
      s.student_id,
      sa.pwd_status,
      sa.bpl_status,
      sa.sc_st_status,
      a.merit_score,
      CASE
        WHEN sa.pwd_status THEN 1
        WHEN sa.bpl_status THEN 2
        WHEN sa.sc_st_status THEN 3
        ELSE 4
      END AS category_priority
    FROM application a
    JOIN student s ON a.student_id = s.student_id
    JOIN student_academics sa ON a.student_id = sa.student_id
    WHERE a.academic_year = p_academic_year
      AND a.status = 'Approved'
      AND s.gender = v_gender_filter
      AND (sa.pwd_status OR sa.bpl_status OR sa.sc_st_status)
      AND NOT EXISTS (
        SELECT 1 FROM allocation al WHERE al.application_id = a.application_id
      )
    ORDER BY category_priority ASC, a.merit_score DESC
    LIMIT v_reserved_seats
  LOOP
    IF v_allocated_count >= v_reserved_seats THEN EXIT; END IF;

    INSERT INTO allocation (application_id, hostel_id, allocation_date, status, category)
    VALUES (
      rec.application_id,
      p_hostel_id,
      CURRENT_DATE,
      'Active',
      CASE
        WHEN rec.pwd_status THEN 'Reserved_PWD'
        WHEN rec.bpl_status THEN 'Reserved_BPL'
        ELSE 'Reserved_SCST'
      END
    );

    -- Update application status
    UPDATE application SET status = 'Approved' WHERE application_id = rec.application_id;

    v_allocated_count := v_allocated_count + 1;
  END LOOP;

  -- ================================================================
  -- PHASE 2: General allocation (remaining seats)
  -- ================================================================
  FOR rec IN
    SELECT a.application_id, a.merit_score
    FROM application a
    JOIN student s ON a.student_id = s.student_id
    WHERE a.academic_year = p_academic_year
      AND a.status = 'Approved'
      AND s.gender = v_gender_filter
      AND NOT EXISTS (
        SELECT 1 FROM allocation al WHERE al.application_id = a.application_id
      )
    ORDER BY a.merit_score DESC
    LIMIT (v_total_capacity - v_allocated_count)
  LOOP
    INSERT INTO allocation (application_id, hostel_id, allocation_date, status, category)
    VALUES (rec.application_id, p_hostel_id, CURRENT_DATE, 'Active', 'General');

    v_allocated_count := v_allocated_count + 1;
  END LOOP;

  SELECT json_build_object(
    'hostel_id', p_hostel_id,
    'academic_year', p_academic_year,
    'total_allocated', v_allocated_count
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## 11. Allocation Trigger Logic

The full allotment is triggered when a warden (or admin) presses the "Allot" button in the frontend. The sequence is:

1. Frontend calls Supabase Edge Function `POST /functions/v1/run-allotment`
2. Edge Function validates the user is `admin` or `warden`
3. Edge Function calls `SELECT run_hostel_allotment(academic_year, hostel_id)`
4. Returns JSON summary of allocations made
5. Frontend displays results

---

## 12. Supabase Storage Buckets

```sql
-- Create storage bucket for student documents (via Supabase Dashboard or API)
-- Bucket name: student-documents
-- Access: Private (only authenticated users can access their own documents)

-- Policy: Students can upload to their own folder
-- Path structure: student-documents/{student_id}/{document_type}/{filename}
```

Storage bucket policies (set in Supabase Dashboard):

```
Bucket: student-documents
Policy: Allow authenticated users to upload to their own student_id folder
Rule: (storage.foldername(name))[1] = auth.uid()::text
```

---

## 13. Seeding & Initial Data

```sql
-- Insert hostels
INSERT INTO hostel (hostel_name, hostel_type, total_capacity, reserved_seats) VALUES
  ('Ladies Hostel 1',  'LH', 150, 30),
  ('Ladies Hostel 2',  'LH', 120, 24),
  ('Ladies Hostel 3',  'LH', 100, 20),
  ('Mens Hostel 1',    'MH', 200, 40),
  ('Mens Hostel 2',    'MH', 180, 36);

-- Insert system admin (after creating user in Supabase Auth)
-- UPDATE admin SET auth_uid = '<uuid-from-auth>' WHERE email = 'admin@rgit.ac.in';
```

---

## 14. Integrity Constraints Summary

| Constraint | Implementation |
|---|---|
| One application per student per academic year | `UNIQUE (student_id, academic_year)` on application |
| Male → MH only, Female → LH only | Trigger `trg_gender_hostel_match` |
| Capacity must not be exceeded | Trigger `trg_hostel_occupancy` + CHECK constraint |
| At most one active allocation per student | Trigger `trg_prevent_duplicate_allocation` |
| Allocation only after application approved | Application status check in allotment function |
| Each class has exactly one advisor | `UNIQUE` on `advisor_id` in class table |
| Warden manages exactly one hostel | `UNIQUE` on `hostel_id` in warden table |
| Income and distance must be non-negative | `CHECK` constraints on student and application tables |

---

## 15. Supabase Setup Checklist

- [ ] Create new Supabase project
- [ ] Run SQL schema in order (§5.2 → §5.12)
- [ ] Enable RLS (§6)
- [ ] Create indexes (§7)
- [ ] Create views (§8)
- [ ] Create functions and triggers (§9, §10)
- [ ] Create `student-documents` storage bucket (§12)
- [ ] Seed hostel data (§13)
- [ ] Create admin user via Supabase Auth Dashboard
- [ ] Update `admin.auth_uid` with the admin's Auth UUID
- [ ] Set up Supabase Edge Function for allotment trigger
- [ ] Configure email templates in Supabase Auth for registration/verification
- [ ] Enable Supabase Realtime on `application` and `allocation` tables for live updates
