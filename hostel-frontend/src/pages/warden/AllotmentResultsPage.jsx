import { FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AllotmentResultsPage() {
  const downloadReport = () => {
    toast.success('Downloading mock report PDF...');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Allocation Manifest</h1>
          <p className="text-gray-500 mt-1">View the finalized seat mapping data for all students.</p>
        </div>
        <button onClick={downloadReport} className="btn-primary py-2.5 px-5 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm bg-gray-900 hover:bg-black border-transparent">
          <Download className="w-5 h-5" /> Export PDF Report
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
           <FileText className="w-16 h-16 text-gray-200 mb-4" />
           <p className="font-medium text-lg text-gray-900 mb-2">Merit List Document Ready</p>
           <p className="max-w-md mx-auto mb-6 text-sm">Since the algorithm mock generated random totals, a tabular manifest is securely bypassed in this frontend demo to prevent mismatching data arrays.</p>
        </div>
      </div>
    </div>
  );
}
