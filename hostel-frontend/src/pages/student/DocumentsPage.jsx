import { UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentsPage() {
  const mockUpload = () => {
    toast.success('Document uploaded successfully in Demo Mode');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-primary tracking-tight">Document Repository</h1>
        <p className="font-sans text-on-surface-variant mt-2 text-base">Upload the scanned copies of your official certificates for verification.</p>
      </div>

      <div className="card">
        <h2 className="font-sans font-semibold text-primary uppercase tracking-[0.1em] text-xs border-b border-surface-container pb-4 mb-8">
          Required Documents
        </h2>
        
        <div className="space-y-4">
          {/* Document Item */}
          <div className="border border-surface-container rounded-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-outline-variant/50 transition-colors bg-surface-container-lowest">
            <div>
              <p className="font-serif text-xl text-primary">Income Certificate</p>
              <p className="text-sm text-on-surface-variant mt-1.5">Required for accurate merit assessment. (PDF or JPG, max 5MB)</p>
            </div>
            <button onClick={mockUpload} className="px-6 py-2.5 bg-surface-container-low text-primary font-medium rounded-md text-sm flex items-center justify-center gap-2 hover:bg-surface-container transition-colors shrink-0">
              <UploadCloud className="w-4 h-4" />
              Upload File
            </button>
          </div>

          <div className="border border-surface-container rounded-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-outline-variant/50 transition-colors bg-surface-container-lowest">
            <div>
              <p className="font-serif text-xl text-primary">Residential Certificate</p>
              <p className="text-sm text-on-surface-variant mt-1.5">Official proof of distance from college. (PDF or JPG, max 5MB)</p>
            </div>
            <button onClick={mockUpload} className="px-6 py-2.5 bg-surface-container-low text-primary font-medium rounded-md text-sm flex items-center justify-center gap-2 hover:bg-surface-container transition-colors shrink-0">
              <UploadCloud className="w-4 h-4" />
              Upload File
            </button>
          </div>
        </div>

        <div className="mt-8 bg-surface-container-low rounded-md p-5 border-l-4 border-secondary">
          <p className="text-sm text-on-surface-variant font-medium">Demo Note: File uploading is simulated. Clicking "Upload File" will trigger a mock success action in this current environment.</p>
        </div>
      </div>
    </div>
  );
}
