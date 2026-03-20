import { Users, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageAdvisorsPage() {
  const mockFunction = () => toast.success('Action triggered in Demo Mode.');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Advisors</h1>
          <p className="text-gray-500 mt-1">Add, edit, and assign class advisors to departments.</p>
        </div>
        <button onClick={mockFunction} className="btn-primary py-2.5 px-5 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm">
          <Plus className="w-5 h-5" /> Add Advisor
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
           <Users className="w-16 h-16 text-gray-200 mb-4" />
           <p className="font-medium text-lg text-gray-900 mb-2">Advisor Management</p>
           <p className="max-w-md mx-auto mb-6">This feature is fully mocked out in the frontend demo since it requires backend user invitation functionality.</p>
           <button onClick={mockFunction} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors">
              Simulate Action
           </button>
        </div>
      </div>
    </div>
  );
}
