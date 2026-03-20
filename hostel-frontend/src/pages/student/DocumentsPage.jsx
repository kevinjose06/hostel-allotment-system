import { UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentsPage() {
  const mockUpload = () => {
    toast.success('Document uploaded successfully in Demo Mode');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Documents</h1>
        <p className="text-gray-500 mt-2">Upload the scanned copies of your certificates for verification.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Required Documents</h2>
        
        <div className="space-y-6">
          {/* Document Item */}
          <div className="border border-gray-100 rounded-xl p-5 flex items-center justify-between group hover:border-blue-200 transition-colors bg-gray-50/50">
            <div>
              <p className="font-semibold text-gray-900">Income Certificate</p>
              <p className="text-xs text-gray-500 mt-1">Required for accurate merit assessment. (PDF or JPG, max 5MB)</p>
            </div>
            <button onClick={mockUpload} className="px-4 py-2 border border-gray-200 bg-white text-gray-700 font-medium rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 hover:border-blue-300 transition-colors">
              <UploadCloud className="w-4 h-4 text-gray-400" />
              Upload
            </button>
          </div>

          <div className="border border-gray-100 rounded-xl p-5 flex items-center justify-between group hover:border-blue-200 transition-colors bg-gray-50/50">
            <div>
              <p className="font-semibold text-gray-900">Residential Certificate</p>
              <p className="text-xs text-gray-500 mt-1">Proof of distance from college. (PDF or JPG, max 5MB)</p>
            </div>
            <button onClick={mockUpload} className="px-4 py-2 border border-gray-200 bg-white text-gray-700 font-medium rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 hover:border-blue-300 transition-colors">
              <UploadCloud className="w-4 h-4 text-gray-400" />
              Upload
            </button>
          </div>
        </div>

        <div className="mt-8 bg-amber-50 rounded-xl p-5 border border-amber-100">
          <p className="text-sm text-amber-800 font-medium">Demo Note: File uploading is simulated. Clicking "Upload" will trigger a mock success action in this current environment.</p>
        </div>
      </div>
    </div>
  );
}
