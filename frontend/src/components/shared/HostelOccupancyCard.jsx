import { Building2 } from 'lucide-react';

export default function HostelOccupancyCard({ hostel }) {
  const pct = Math.round((hostel.current_occupancy / hostel.total_capacity) * 100);

  return (
    <div className="bg-surface-container-lowest rounded-md shadow-ambient border border-outline-variant/10 p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-5">
        <div className="h-14 w-14 bg-primary/10 text-primary border border-primary/20 rounded-sm flex items-center justify-center shrink-0">
          <Building2 className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif font-bold text-primary text-2xl leading-tight">{hostel.hostel_name}</h3>
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-sm border ${
              hostel.hostel_type === 'LH' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20'
            }`}>
              {hostel.hostel_type === 'LH' ? "Ladies" : "Mens"}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider mb-5">Warden: {hostel.warden_name}</p>
          
          <div className="w-full bg-surface-container border border-outline-variant/10 shadow-inner rounded-sm h-3 mb-3 overflow-hidden">
            <div
              className={`h-full rounded-sm transition-all duration-1000 ${pct > 90 ? 'bg-error' : pct > 70 ? 'bg-secondary' : 'bg-primary'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span>{hostel.current_occupancy} / {hostel.total_capacity} Full</span>
            <span className={pct > 90 ? 'text-error' : pct > 70 ? 'text-secondary' : 'text-primary'}>{hostel.available_seats} Left</span>
          </div>
        </div>
      </div>
    </div>
  );
}
