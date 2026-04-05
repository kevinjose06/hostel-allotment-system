# 🏰 Hostel Allotment System: Institutional Management Portal

### **Overview & Abstract**
The **Hostel Allotment System** is an end-to-end digital infrastructure designed for **RIT Kottayam** to modernize and automate the student housing lifecycle. By replacing manual, labor-intensive processes with a high-performance, merit-based engine, the system ensures 100% transparency, administrative efficiency, and institutional fairness in seat allocation.

Built on a robust architecture combining **FastAPI** for core business logic and **Supabase** for secure real-time data management, the platform serves as a "Single Source of Truth" for students and institutional staff including Wardens, Class Advisors, and Administrators.

---

### **✨ Core Architectural Pillars**

#### **1. The Two-Phase Allotment Engine**
The hallmark of the system is its automated allotment algorithm. It calculates a normalized **Merit Score** based on family annual income (inverse-weighted) and physical distance from the campus. 
- **Phase 1 (Reserved Seats):** Allocates the first 20% of capacity to students with verified reservation benefits (PWD, BPL, SC/ST, etc.) ranked by merit.
- **Phase 2 (General Seats):** Allocates the remaining 80% to all remaining approved applicants based strictly on their merit ranking.

#### **2. Distributed Decision Workflow**
The system distributes administrative burden by involving **Class Advisors** directly. Advisors act as the primary auditors for their respective student batches, reviewing identity and reservation documents before a student enters the final allotment pool.

#### **3. Security & Data Integrity**
- **JWT-Based Authentication:** Managed identity via Supabase Auth with custom role enforcement.
- **PostgreSQL Row-Level Security (RLS):** Database-level rules that isolate student data and ensure staff can only access records relevant to their department or hostel.
- **Encrypted Document Storage:** Secure vault for sensitive institutional certificates.

---

### **🚀 Global Tech Stack**

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | **React (Vite)**, Tailwind CSS, Framer Motion, React Hook Form |
| **Backend Logic** | **FastAPI (Python)**, Pydantic, HTTPX, Uvicorn |
| **Data & Auth** | **Supabase (PostgreSQL)**, PostgREST, RLS, Storage |
| **Aesthetics** | **Refined Governmental Modernism** (Standardized institutional UI) |

---

### **👥 Role-Specific Capabilities**

- **Students:** Manage digital profiles, upload mandatory certificates, and track allotment status in real-time.
- **Class Advisors:** Review and verify departmental applications; provide "Return-for-Clarification" feedback to students.
- **Wardens:** Manage hostel capacity, trigger the automated allotment engine, and oversee residency status (Vacate/Active).
- **Admins:** Provision staff accounts, manage global system configurations (deadlines, reservation quotas), and audit system integrity.

---

### **📂 Project Repository Structure**

- `/frontend`: Responsive React Single-Page Application (SPA).
- `/backend`: Scalable FastAPI server handling the Allotment Engine and Staff APIs.
- `/backend/scripts`: Standalone Python suite for data backfilling, stress testing, and DBA maintenance.

---

### **🛠 Technical Setup & Development**

#### **1. Database Configuration**
Before running either layer, ensure you have a **Supabase** project configured. Use the provided schema to initialize your tables and authentication metadata.

#### **2. Backend (FastAPI)**
Navigate to the `/backend` directory and install the required Python environment:
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the logic server
python main.py
```
*Port: `http://localhost:8000`*

#### **3. Frontend (React + Vite)**
Navigate to the `/frontend` directory and initialize the React environment:
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
*Port: `http://localhost:5173`*

#### **4. Environment Variables (.env)**
Ensure both layers have their respective `.env` files configured with your **Supabase URL**, **Anon Key**, and **Service Role Key**.

---

### **Institutional Governance**
This software was developed specifically to meet the high standards of accuracy and fairness required for institutional housing allocation. It stands as a production-grade blueprint for modernizing university resource management.

---
**Developed for RIT Kottayam** | **2026**
