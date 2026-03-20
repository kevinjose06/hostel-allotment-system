import { Building2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageHostelsPage() {
  const mockFunction = () => toast.success('Action triggered in Demo Mode.');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Hostels</h1>
          <p className="text-gray-500 mt-1">Define properties, capacity constraints, and designate wardens.</p>
        </div>
        <button onClick={mockFunction} className="btn-primary py-2.5 px-5 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm">
          <Plus className="w-5 h-5" /> Add Hostel Wing
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
           <Building2 className="w-16 h-16 text-gray-200 mb-4" />
           <p className="font-medium text-lg text-gray-900 mb-2">Hostel Infrastructure Data</p>
           <p className="max-w-md mx-auto mb-6">Create the infrastructure database where allocations happen. This form relies heavily on the backend, thus stubbed in UI demo format.</p>
           <button onClick={mockFunction} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors">
              Simulate Config Form
           </button>
        </div>
      </div>
    </div>
  );
}
