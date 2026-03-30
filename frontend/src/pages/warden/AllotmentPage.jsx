import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Sparkles, CheckCircle2, Users, AlertTriangle } from 'lucide-react';

// Generate academic year options like "2024-2025", "2025-2026", "2026-2027"
const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1].map(y => ({
    label: `${y}–${y + 1}`,
    value: y
  }));
};

export default function AllotmentPage() {
  const academicYears = generateAcademicYears();
  const [selectedHostel, setSelectedHostel] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState(null);
  const qc = useQueryClient();

  // Fetch the warden's own profile to pre-fill their hostel
  const { data: wardenProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['warden-me'],
    queryFn: () => api.get('/admin/warden/me').then(r => r.data.data),
    onSuccess: (data) => {
      if (data?.hostel_id) {
        setSelectedHostel(String(data.hostel_id));
      }
    }
  });

  // Fetch all hostels for the dropdown (warden may cover multiple or admin view)
  const { data: hostels = [], isLoading: isHostelsLoading } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => api.get('/hostel').then(r => r.data.data)
  });

  const allotmentMutation = useMutation({
    mutationFn: () => api.post('/allotment/run', {
      hostel_id: parseInt(selectedHostel),
      academic_year: parseInt(academicYear)
    }),
    onSuccess: (res) => {
      setResult(res.data.data);
      toast.success('Allotment completed successfully!');
      qc.invalidateQueries(['hostels']);
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Allotment failed. Please try again.');
    }
  });

  if (isProfileLoading || isHostelsLoading) return <LoadingSpinner />;

  const myHostel = wardenProfile?.hostel;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl text-primary tracking-tight">Run Hostel Allotment</h1>
        <p className="font-sans text-on-surface-variant mt-2 leading-relaxed">
          Select your hostel and academic year, then run the allotment engine. Rooms will be assigned based on student merit scores — reserved categories (PWD, BPL, SC/ST) are processed first, followed by general merit.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        <div className="p-8 space-y-6">

          {/* Hostel Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-primary mb-3">
              Select Hostel <span className="text-error">*</span>
            </label>
            {myHostel ? (
              // Show warden's own hostel as a highlighted card, not a dropdown
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-md">
                <div className="h-10 w-10 bg-primary/10 text-primary rounded-sm flex items-center justify-center font-bold font-serif text-lg">
                  {myHostel.hostel_name?.[0] || 'H'}
                </div>
                <div>
                  <p className="font-serif font-bold text-primary text-lg">{myHostel.hostel_name}</p>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest">{myHostel.hostel_type === 'MH' ? "Men's Hostel" : "Ladies' Hostel"}</p>
                </div>
              </div>
            ) : (
              // Fallback — warden not yet assigned to a hostel
              <select
                value={selectedHostel}
                onChange={e => setSelectedHostel(e.target.value)}
                className="input py-3 text-sm w-full"
              >
                <option value="">Select a hostel...</option>
                {hostels.map(h => (
                  <option key={h.hostel_id} value={h.hostel_id}>
                    {h.hostel_name} ({h.hostel_type === 'MH' ? "Men's" : "Ladies'"}) — {h.available_seats} seats available
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Academic Year Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-primary mb-3">
              Academic Year <span className="text-error">*</span>
            </label>
            <select
              value={academicYear}
              onChange={e => setAcademicYear(Number(e.target.value))}
              className="input py-3 text-sm w-full sm:w-64"
            >
              {academicYears.map(y => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-on-surface-variant/60 mt-2 italic">
              Select the academic year this allotment applies to.
            </p>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-5 flex gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Before You Proceed</p>
              <p className="text-sm text-amber-700 leading-relaxed mt-1">
                Running allotment will assign available rooms to approved applicants based on their merit scores. Make sure all student applications have been reviewed and approved by their class advisors before continuing.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => allotmentMutation.mutate()}
            disabled={!selectedHostel || allotmentMutation.isPending}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-xs rounded-md shadow-ambient transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {allotmentMutation.isPending
              ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />  Processing...</>
              : <><Sparkles className="w-4 h-4" />  Run Allotment</>
            }
          </button>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-md p-8 shadow-ambient">
            <div className="flex items-center gap-4 mb-6">
              <CheckCircle2 className="w-8 h-8 text-primary" />
              <h2 className="font-serif font-bold text-primary text-3xl tracking-tight">
                Allotment Complete
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="bg-surface-container-low p-5 rounded-sm border border-surface-container">
                <span className="text-on-surface-variant font-bold block uppercase tracking-widest text-[10px] mb-2">Hostel</span>
                <strong className="text-primary font-serif text-xl">{result.hostel_name}</strong>
              </div>
              <div className="bg-surface-container-low p-5 rounded-sm border border-surface-container">
                <span className="text-on-surface-variant font-bold block uppercase tracking-widest text-[10px] mb-2">Year</span>
                <strong className="text-primary font-serif text-xl">{result.academic_year}–{result.academic_year + 1}</strong>
              </div>
              <div className="bg-surface-container-low p-5 rounded-sm border border-surface-container">
                <span className="text-on-surface-variant font-bold block uppercase tracking-widest text-[10px] mb-2">Total Allotted</span>
                <strong className="text-primary font-serif text-3xl">{result.total_allocated}</strong>
              </div>
              <div className="bg-surface-container-low p-5 rounded-sm border border-surface-container">
                <span className="text-on-surface-variant font-bold block uppercase tracking-widest text-[10px] mb-2">Breakdown</span>
                <p className="text-xs font-semibold text-on-surface"><strong className="text-primary">{result.reserved_allocated}</strong> Reserved</p>
                <p className="text-xs font-semibold text-on-surface"><strong className="text-primary">{result.general_allocated}</strong> General Merit</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-surface-container">
              <a href="/warden/results" className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs hover:underline">
                View Full Results →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
