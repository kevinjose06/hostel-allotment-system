import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('application').insert({
    student_id: 1, // Just dummy data to see the SCHEMA error, not FK error
    academic_year: 2026,
    family_annual_income: 500000,
    distance_from_college: 125,
    bpl_status: false,
    pwd_status: false,
    sc_st_status: false,
    home_address: "Dummy address very long",
    guardian_name: "Dummy Name",
    guardian_contact: "1234567890",
    status: 'Pending',
    advisor_id: 1,
    merit_score: 50.5
  });
  console.log("Error:", error);
}

test();
