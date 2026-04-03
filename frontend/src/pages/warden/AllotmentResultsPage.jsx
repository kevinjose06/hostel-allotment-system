import { useQuery } from '@tanstack/react-query';
import { FileText, Download, User, Calendar, Building2, Hash, Sparkles } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AllotmentResultsPage() {
  const { data: wardenProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['warden-me'],
    queryFn: () => api.get('/admin/warden/me').then(r => r.data.data)
  });

  const { data: configs } = useQuery({
    queryKey: ['system-configs'],
    queryFn: () => api.get('/admin/config').then(r => r.data.data)
  });

  const hostelId = wardenProfile?.hostel_id;
  const sysYear = configs?.academic_year || '2026-2027';

  const { data: results = [], isLoading: isResultsLoading } = useQuery({
    queryKey: ['allotment-results', hostelId, sysYear],
    queryFn: () => api.get(`/allotment/hostel/${hostelId}?academic_year=${sysYear}`).then(r => r.data.data),
    enabled: !!hostelId
  });

  const downloadReport = () => {
    if (results.length === 0) {
      toast.error('No allotment results found to export.');
      return;
    }

    try {
      const doc = new jsPDF();
      const hostelName = results[0]?.hostel_name || 'Hostel';
      const academicYear = sysYear; // Forcibly use global config year for official reports
      const today = new Date().toLocaleDateString('en-IN');

      // Header
      doc.setFontSize(22);
      doc.setTextColor(26, 54, 93); // Primary color
      doc.text('RIT Kottayam', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('Hostel Allotment List', 105, 30, { align: 'center' });
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 35, 190, 35);

      // Meta Info
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Hostel: ${hostelName}`, 20, 45);
      doc.text(`Academic Session: ${academicYear}`, 20, 50);
      doc.text(`Generated On: ${today}`, 190, 45, { align: 'right' });
      doc.text(`Total Allotted: ${results.length}`, 190, 50, { align: 'right' });

      // Table mapping for PDF
      const tableColumn = ["Sl No", "Student Name", "Department"];
      const tableRows = results.map((res, index) => [
        index + 1,
        res.student_name,
        res.department || 'N/A'
      ]);

      // Using autoTable import correctly
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 60 },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 80 },
          2: { cellWidth: 70 }
        }
      });

      // Footer numbering
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} - RIT Hostel Management System`, 105, 285, { align: 'center' });
      }

      doc.save(`Hostel_Allotment_List_${hostelName.replace(/ /g, '_')}_${academicYear.replace(/-/g, '_')}.pdf`);
      toast.success('Allotment list exported successfully!');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to export PDF. Check console for details.');
    }
  };

  if (isProfileLoading || isResultsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-outline-variant/10 pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2 block">Reporting Engine</span>
          <h1 className="font-serif text-4xl text-primary tracking-tight">Allocation Manifest</h1>
          <p className="font-sans text-on-surface-variant mt-2 text-base">Hostel residential mapping for session {sysYear}.</p>
        </div>
        <button 
          onClick={downloadReport} 
          disabled={results.length === 0}
          className="btn-primary py-3 px-6 shrink-0 flex items-center justify-center gap-2 shadow-ambient disabled:opacity-50"
        >
          <Download className="w-5 h-5" /> Execute PDF Export
        </button>
      </div>

      {results.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-md border border-outline-variant/10 p-16 text-center shadow-ambient">
          <div className="p-6 bg-surface-container rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
             <Hash className="w-10 h-10 text-on-surface-variant/30" />
          </div>
          <p className="font-serif font-bold text-2xl text-primary mb-2">No Allocations Found</p>
          <p className="text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            There are no room assignments recorded for your hostel for the {sysYear} session. Please run the allotment engine first.
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
          <div className="overflow-x-auto border-t border-outline-variant/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-primary uppercase text-[10px] font-bold tracking-widest border-b border-outline-variant/20">
                  <th className="px-6 py-5">Sl No</th>
                  <th className="px-6 py-5">Student Name</th>
                  <th className="px-6 py-5">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {results.map((res, index) => (
                  <tr key={index} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-5 text-sm font-medium text-on-surface-variant tracking-wider">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center font-serif text-sm font-bold border border-primary/20">
                          {res.student_name?.[0]}
                        </div>
                        <span className="text-sm font-bold text-primary tracking-tight">{res.student_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-on-surface-variant">
                      {res.department || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
