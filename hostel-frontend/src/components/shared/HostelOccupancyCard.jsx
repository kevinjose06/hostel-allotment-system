import { Building2 } from 'lucide-react';

export default function HostelOccupancyCard({ hostel }) {
  const pct = Math.round((hostel.current_occupancy / hostel.total_capacity) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-gray-800 text-lg leading-tight">{hostel.hostel_name}</h3>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider ${
              hostel.hostel_type === 'LH' ? 'bg-pink-50 text-pink-700 border border-pink-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
            }`}>
              {hostel.hostel_type === 'LH' ? "Ladies" : "Mens"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3 font-medium">Warden: {hostel.warden_name}</p>
          
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-400' : 'bg-green-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs font-medium text-gray-600">
            <span>{hostel.current_occupancy} / {hostel.total_capacity} full</span>
            <span className={pct > 90 ? 'text-red-600' : 'text-green-600'}>{hostel.available_seats} left</span>
          </div>
        </div>
      </div>
    </div>
  );
}
