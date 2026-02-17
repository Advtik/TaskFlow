import { ChevronLeft, Users, Shield } from "lucide-react";
import AddMemberSearch from "./AddMemberSearch";

function BoardHeader({title,onBack,onShowMembers,onAddMember,members = [],searchQuery,onSearch,searchResults,showSearchDropdown,setSelectedTask,setShowSearchDropdown}) {

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

      
      <div className="relative w-full max-w-md mx-auto my-4">
        
        <div className="relative flex items-center group">
          <div className="absolute left-4 flex items-center pointer-events-none">
            <svg 
              className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            type="text"
            placeholder="Search your tasks..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-base shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:shadow-md"
          />
        </div>

        {showSearchDropdown && searchQuery.length > 0 && (
          <div className="absolute top-full mt-3 w-full bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-50">
            <div className="max-h-[400px] overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTask({ ...task, listId: task.list_id });
                      setShowSearchDropdown(false);
                    }}
                    className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <p className="font-medium text-slate-700">{task.title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center">
                  <p className="text-slate-400">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        )}
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