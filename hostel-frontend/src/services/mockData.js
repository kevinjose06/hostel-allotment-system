export const mockDataStore = {
  student: {
    student_id: 1,
    college_id: 'KTE24CS079',
    first_name: 'John',
    last_name: 'Doe',
    email: 'student@rgit.ac.in',
    gender: 'Male',
    date_of_birth: '2004-05-15',
    contact_number: '9876543210',
    family_annual_income: 150000,
    distance_from_college: 45.5,
    bpl_status: false,
    pwd_status: false,
    sc_st_status: false,
    class: {
      class_id: 1,
      department: 'Computer Science',
      semester: 3
    }
  },
  applications: [
    {
      application_id: 101,
      academic_year: 2024,
      family_annual_income: 150000,
      distance_from_college: 45.5,
      status: 'Pending',
      application_date: '2024-06-12T10:00:00Z',
      merit_score: 82.5,
      student_id: 1,
      student: {
        college_id: 'KTE24CS079',
        first_name: 'John',
        last_name: 'Doe',
        email: 'student@rgit.ac.in',
        gender: 'Male',
        contact_number: '9876543210',
        family_annual_income: 150000,
        distance_from_college: 45.5,
        bpl_status: false,
        pwd_status: false,
        sc_st_status: false,
        class: { department: 'Computer Science' }
      }
    },
    {
      application_id: 102,
      academic_year: 2024,
      family_annual_income: 50000,
      distance_from_college: 120.0,
      status: 'Approved',
      application_date: '2024-06-10T14:30:00Z',
      merit_score: 95.0,
      student_id: 2,
      student: {
        college_id: 'KTE24EC012',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@rgit.ac.in',
        gender: 'Female',
        contact_number: '9123456780',
        family_annual_income: 50000,
        distance_from_college: 120.0,
        bpl_status: true,
        pwd_status: false,
        sc_st_status: false,
        class: { department: 'Electronics' }
      }
    }
  ],
  hostels: [
    {
      hostel_id: 1,
      hostel_name: 'Mens Hostel 1',
      hostel_type: 'MH',
      total_capacity: 100,
      current_occupancy: 85,
      available_seats: 15,
      warden_name: 'Dr. Rajesh Kumar'
    },
    {
      hostel_id: 2,
      hostel_name: 'Ladies Hostel 1',
      hostel_type: 'LH',
      total_capacity: 150,
      current_occupancy: 140,
      available_seats: 10,
      warden_name: 'Prof. Anitha S'
    }
  ],
  classes: [
    { class_id: 1, name: 'S3 CS', department: 'Computer Science', semester: 3 },
    { class_id: 2, name: 'S3 EC', department: 'Electronics', semester: 3 }
  ],
  advisors: [
    { advisor_id: 1, name: 'Dr. Sarah', department: 'Computer Science' }
  ]
};
