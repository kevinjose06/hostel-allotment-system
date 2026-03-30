import { Building2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageHostelsPage() {
  const mockFunction = () => toast.success('Action triggered in Demo Mode.');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl text-primary tracking-tight">Infrastructure Management</h1>
          <p className="font-sans text-on-surface-variant mt-2 text-base">Define physical properties, capacity constraints, and designate authoritative personnel.</p>
        </div>
        <button onClick={mockFunction} className="btn-primary py-3 px-6 shrink-0">
          <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> Append Infrastructure Unit</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 overflow-hidden">
        <div className="p-16 text-center flex flex-col items-center">
           <Building2 className="w-16 h-16 text-primary mb-6" />
           <p className="font-serif font-bold text-2xl text-primary mb-3">Spatial Data Sub-System</p>
           <p className="max-w-xl mx-auto text-on-surface-variant leading-relaxed mb-8">This portal manages the physical properties wherein allotments are finalized. Database linkages are currently stubbed in demo format.</p>
           <button onClick={mockFunction} className="px-8 py-3.5 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 font-bold uppercase tracking-widest text-xs rounded-md transition-colors">
              Simulate Configuration Tool
           </button>
        </div>
      </div>
    </div>
  );
}
