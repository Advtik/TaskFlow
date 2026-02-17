import { ChevronLeft, Users, Shield } from "lucide-react";
import AddMemberSearch from "./AddMemberSearch";

function BoardHeader({ title, onBack, onShowMembers, onAddMember, members = [] }) {
  return (
    <header className="h-20 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack} 
          className="p-2.5 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 text-slate-500 transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block" />
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic italic">
            {title}
          </h1>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1.5 flex items-center gap-1">
            <Shield size={10} /> Private Workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <AddMemberSearch onAddMember={onAddMember} />

        <button
          onClick={onShowMembers}
          className="group flex items-center gap-4 bg-white border border-slate-200 pl-4 pr-5 py-4 rounded-2xl hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all active:scale-95 shrink-0"
        >

          <div className="flex flex-col border-l border-slate-100 pl-4">
            <span className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none">
              Board Members
            </span>
            
          </div>
        </button>
      </div>
    </header>
  );
}

export default BoardHeader;