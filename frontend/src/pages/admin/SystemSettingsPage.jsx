import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Save, Calendar, Percent, Clock, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    academic_year: '',
    reservation_percentage: '',
    application_deadline: ''
  });

  const { data: configs, isLoading } = useQuery({
    queryKey: ['system-configs'],
    queryFn: () => api.get('/admin/config').then(r => r.data.data)
  });

  const { data: categories } = useQuery({
    queryKey: ['reservation-categories'],
    queryFn: () => api.get('/admin/reservation-categories').then(r => r.data.data)
  });

  useEffect(() => {
    if (configs) {
      setFormData({
        academic_year: configs.academic_year || '',
        reservation_percentage: configs.reservation_percentage || '',
        application_deadline: configs.application_deadline ? configs.application_deadline.split('T')[0] : ''
      });
    }
  }, [configs]);

  const deleteCategoryMutation = useMutation({
    mutationFn: (catId) => api.delete(`/admin/reservation-categories/${catId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['reservation-categories']);
      toast.success('Category deleted successfully');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.post('/admin/config', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['system-configs']);
      toast.success('Configuration updated successfully');
    },
    onError: () => {
      toast.error('Failed to update configuration');
    }
  });

  const handleSubmit = (key, value) => {
    // If it's a deadline, ensure it's stored in ISO format
    let finalValue = value;
    if (key === 'application_deadline') {
        // If picking '2026-04-06', store as '2026-04-06T00:00:00'
        // This ensures it closes at the very start of the selected date in LOCAL time.
        finalValue = `${value}T00:00:00`;
    }
    updateMutation.mutate({ config_key: key, config_value: finalValue });
  };

  if (isLoading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="font-serif text-4xl text-primary tracking-tight">System Configuration</h1>
        <p className="font-sans text-on-surface-variant mt-2 text-base">
          Manage core institutional parameters for the hostel allotment process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Academic Year */}
        <div className="bg-surface-container-lowest p-8 rounded-md border border-outline-variant/10 shadow-ambient space-y-6">
          <div className="flex items-center gap-4 text-primary">
            <Calendar className="h-6 w-6" />
            <h2 className="font-serif text-xl font-bold">Active Academic Year</h2>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Sets the default year for all new applications and allotment runs.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              className="input flex-1 h-12"
              value={formData.academic_year}
              onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
              placeholder="e.g. 2024-2025"
            />
            <button 
              onClick={() => handleSubmit('academic_year', formData.academic_year)}
              disabled={updateMutation.isPending}
              className="btn btn-primary h-12 px-6"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          </div>
        </div>

        {/* Reservation Percentage */}
        <div className="bg-surface-container-lowest p-8 rounded-md border border-outline-variant/10 shadow-ambient space-y-6">
          <div className="flex items-center gap-4 text-primary">
            <Percent className="h-6 w-6" />
            <h2 className="font-serif text-xl font-bold">Reservation Percentage</h2>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            The percentage of seats reserved for PWD, BPL, and SC/ST categories globally.
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                className="input h-12 w-full pr-10"
                value={formData.reservation_percentage}
                onChange={e => setFormData({ ...formData, reservation_percentage: e.target.value })}
                placeholder="e.g. 20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 font-bold">%</span>
            </div>
            <button 
              onClick={() => handleSubmit('reservation_percentage', formData.reservation_percentage)}
              disabled={updateMutation.isPending}
              className="btn btn-primary h-12 px-6"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          </div>
        </div>

        {/* Application Deadline */}
        <div className="bg-surface-container-lowest p-8 rounded-md border border-outline-variant/10 shadow-ambient space-y-6 md:col-span-2">
          <div className="flex items-center gap-4 text-primary">
            <Clock className="h-6 w-6" />
            <h2 className="font-serif text-xl font-bold">Submission Deadline</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                After this date, students will be blocked from submitting or re-submitting applications. 
                Applications not submitted by this date will be excluded from allotment.
              </p>
              <div className="flex gap-3">
                <input
                  type="date"
                  className="input flex-1 h-12"
                  value={formData.application_deadline}
                  onChange={e => setFormData({ ...formData, application_deadline: e.target.value })}
                />
                <button 
                  onClick={() => handleSubmit('application_deadline', formData.application_deadline)}
                  disabled={updateMutation.isPending}
                  className="btn btn-primary h-12 px-6"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Deadline
                </button>
              </div>
            </div>

            <div className="w-full md:w-80 p-4 rounded-md bg-surface-container-low border border-outline-variant/20 flex gap-4">
              <AlertCircle className="h-5 w-5 text-secondary shrink-0" />
              <div className="text-xs space-y-2">
                <p className="font-bold text-on-surface uppercase tracking-widest">Enforcement Note</p>
                <p className="text-on-surface-variant leading-normal">
                  The system enforces this deadline at the server level. Ensure you communicate the date to students clearly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Categories Management */}
      <div className="bg-surface-container-lowest p-8 rounded-md border border-outline-variant/10 shadow-ambient space-y-8 md:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-primary">
            <CheckCircle2 className="h-6 w-6" />
            <h2 className="font-serif text-xl font-bold">Manage Reservation Categories</h2>
          </div>
          <button 
            onClick={() => {
              const name = prompt('Category Name (e.g. Ex-Servicemen):');
              if (name) {
                // Send name only; backend will slugify if code is missing
                api.post('/admin/reservation-categories', { name, is_active: true, requires_doc: true })
                  .then(() => {
                    queryClient.invalidateQueries(['reservation-categories']);
                    toast.success('Category added successfully');
                  });
              }
            }}
            className="btn btn-primary btn-sm"
          >
            + Add New Category
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.map(cat => (
            <div key={cat.id} className={`p-4 rounded-md border transition-all ${cat.is_active ? 'bg-surface-container-low border-outline-variant/20' : 'bg-surface-container-high opacity-50 grayscale'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-primary">{cat.name}</p>
                  <p className="text-[10px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">{cat.code}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <input 
                    type="checkbox" 
                    checked={cat.is_active} 
                    onChange={() => {
                      api.post('/admin/reservation-categories', { ...cat, is_active: !cat.is_active })
                        .then(() => queryClient.invalidateQueries(['reservation-categories']));
                    }}
                    className="rounded-sm border-primary text-primary focus:ring-primary h-4 w-4"
                  />
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete the "${cat.name}" category?`)) {
                        deleteCategoryMutation.mutate(cat.id);
                      }
                    }}
                    className="p-1.5 hover:bg-error/10 text-error/40 hover:text-error rounded-sm transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-error/30 group-hover:text-error" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${cat.is_active ? 'bg-primary animate-pulse' : 'bg-outline-variant'}`}></span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">
                  {cat.is_active ? 'Active on Forms' : 'Hidden'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary / Health Check */}
      <div className="bg-primary/5 p-6 rounded-md border border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <div>
            <p className="font-serif text-lg font-bold text-primary">Configuration Active</p>
            <p className="text-sm text-primary/70 font-medium">All parameters are currently being enforced by the backend engine.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Last System Update</p>
          <p className="text-xs font-mono text-on-surface-variant">{new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
