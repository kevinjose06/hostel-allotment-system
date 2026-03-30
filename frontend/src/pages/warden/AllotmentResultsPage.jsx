import { FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AllotmentResultsPage() {
  const downloadReport = () => {
    toast.success('Downloading mock report PDF...');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl text-primary tracking-tight">Allocation Manifest</h1>
          <p className="font-sans text-on-surface-variant mt-2 text-base">Audit final spatial mapping and designated residential allocations.</p>
        </div>
        <button onClick={downloadReport} className="btn-primary py-3 px-6 shrink-0 flex items-center justify-center gap-2">
          <Download className="w-5 h-5" /> Execute PDF Export
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        <div className="p-16 text-center text-on-surface-variant flex flex-col items-center">
           <FileText className="w-16 h-16 text-primary mb-6" />
           <p className="font-serif font-bold text-2xl text-primary mb-3">Auditable Manifest Report Compiled</p>
           <p className="max-w-xl mx-auto mb-6 text-sm leading-relaxed">Since the algorithmic engine is structurally stubbed for demonstration purposes and emits randomized indices, rendering a strict tabular manifest is disabled to preserve spatial integrity logic within the UI prototype.</p>
        </div>
      </div>
    </div>
  );
}
