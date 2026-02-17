import { X, Trash2, Users, ShieldCheck, Mail } from "lucide-react";

function BoardMembersModal({ members, onClose, onRemove }) {
  // Simple helper to generate a consistent color based on user name
  const getAvatarColor = (name) => {
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-violet-500'];
    return colors[name.length % colors.length];
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-8 pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Team Access
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {members.length} Total Members
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {members.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Users size={40} className="mb-3 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">No members yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-sm`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{member.name}</span>
                        <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          <ShieldCheck size={10} /> {member.role}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-0.5">
                        <Mail size={10} />
                        {member.email}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                        if(window.confirm(`Revoke access for ${member.name}?`)) onRemove(member.id);
                    }}
                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                    title="Remove Member"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-center">
            <button 
                onClick={onClose}
                className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
                Close Management
            </button>
        </div>
      </div>
    </div>
  );
}

export default BoardMembersModal;