import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Search, UserPlus, Mail, Loader2 } from "lucide-react";

function AddMemberSearch({ onAddMember }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim()) search();
      else setResults([]);
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  const search = async () => {
    setIsSearching(true);
    try {
      const res = await api.get(`/users/search?query=${query}`);
      setResults(res.data.users);
    } catch (err) {
      console.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative group w-full max-w-sm">
      {/* --- SEARCH INPUT CONTAINER --- */}
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          {isSearching ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
        </div>
        <input
          type="text"
          placeholder="Add Board Members"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
        />
      </div>

      {/* --- FLOATING RESULTS DROPDOWN --- */}
      {results.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 shadow-2xl shadow-indigo-500/10 rounded-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 max-h-64 overflow-y-auto">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] px-3 py-2">
              Suggested Users
            </p>
            
            {results.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  onAddMember(user.id);
                  setQuery("");
                  setResults([]);
                }}
                className="flex items-center gap-3 p-3 hover:bg-indigo-50/50 rounded-xl cursor-pointer transition-colors group/item"
              >
                {/* User Avatar Placeholder */}
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-colors">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate group-hover/item:text-indigo-700 transition-colors">
                    {user.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
                    <Mail size={10} />
                    {user.email}
                  </div>
                </div>

                <div className="p-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <UserPlus size={16} className="text-indigo-600" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-50 p-3 border-t border-slate-100">
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight">
              Tip: Select a user to add them instantly
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddMemberSearch; 