import { Activity, Clock, Circle } from "lucide-react";

function ActivityPanel({ activities }) {
  console.log(activities);
  return (
    <aside className="w-96 border-l border-slate-200 bg-white h-full flex flex-col shrink-0">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/30">
        <h3 className="text-s font-black uppercase text-slate-800 tracking-[0.2em] flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Activity size={16} />
          </div>
          Board Activity
        </h3>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {activities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Clock size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Quiet Workspace
            </p>
            <p className="text-xs text-slate-400 mt-1">
              New actions will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* The Vertical Line for the Timeline */}
            <div className="absolute left-2.5 top-2 bottom-2 w-[1px] bg-slate-100" />

            <div className="space-y-8">
              {activities.map((act) => (
                <div key={act.id} className="relative pl-10 group">
                  {/* The Timeline Node */}
                  <div className="absolute left-0 top-1.5 w-5 h-5 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center group-hover:border-indigo-500 transition-colors z-10">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-indigo-500 transition-colors" />
                  </div>

                  {/* Activity Info */}
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-bold text-slate-700 capitalize leading-snug group-hover:text-slate-900 transition-colors">
                      {act.action_type.replace(/_/g, " ")}
                    </div>
                    
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                      <Clock size={12} className="text-slate-300" />
                      {new Date(act.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-tighter">
          Autosync Enabled — {activities.length} total events
        </p>
      </div>
    </aside>
  );
}

export default ActivityPanel;