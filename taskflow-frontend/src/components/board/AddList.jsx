import { useState } from "react";
import { Plus, X, LayoutPanelTop, ArrowRight } from "lucide-react";

function AddList({ onCreateList }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const create = () => {
    if (!title.trim()) return;
    onCreateList(title);
    setTitle("");
    setAdding(false);
  };

  return (
    <section className="max-w-4xl mx-auto transition-all duration-300">
      {adding ? (
        <div className="bg-white border-2 border-indigo-600 rounded-[2rem] p-8 shadow-2xl shadow-indigo-500/10 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Plus size={20} strokeWidth={3} />
            </div>
            <div className="flex-1">
              <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-1">
                New Directory
              </h3>
              <input
                autoFocus
                className="w-full bg-transparent outline-none text-xl font-black text-slate-800 placeholder:text-slate-200 tracking-tight"
                placeholder="Enter list title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 border-t border-slate-50 pt-6">
            <button
              onClick={() => setAdding(false)}
              className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              <X size={14} /> Close
            </button>
            <button
              onClick={create}
              className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-95"
            >
              Create List
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full group flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/40 hover:bg-white hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
        >
          <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 transition-colors mb-4">
            <LayoutPanelTop size={24} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div className="text-center">
            <span className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600 transition-colors">
              Add New Category
            </span>
            <span className="text-[10px] font-bold text-slate-300 mt-1 block">
              Click to initialize a new task list
            </span>
          </div>
        </button>
      )}
    </section>
  );
}

export default AddList;