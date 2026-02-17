import { Trash2, Plus, GripVertical, Hash } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Updated SortableTask with better performance
export function SortableTask({ task, listId, onOpenTask, onDeleteTask, isOverlay }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, 
  };


  const overlayStyle = isOverlay ? {
    cursor: 'grabbing',
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transform: 'rotate(2deg)',
  } : {};

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...overlayStyle }}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) onOpenTask(task, listId);
      }}
      className={`group border border-slate-200 p-5 rounded-[1.25rem] bg-white flex justify-between items-center transition-shadow active:cursor-grabbing ${
        isOverlay ? "border-indigo-400 z-50 cursor-grabbing" : "cursor-grab hover:border-indigo-200"
      }`}
    >
      <div className="flex items-center gap-4">
        <GripVertical size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
        <span className="font-semibold text-slate-700">{task.title}</span>
      </div>

      {!isOverlay && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTask(task.id, listId);
          }}
          className="text-slate-300 hover:text-rose-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

function ListSection({
  list,
  tasks,
  onOpenCreateModal,
  onOpenTask,
  onDeleteTask,
  onDeleteList
}) {
  const { setNodeRef } = useDroppable({ id: `list-${list.id}` });

  return (
    <section className="max-w-4xl mx-auto group/section">
      <div className="flex justify-between items-center mb-5 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Hash size={16} strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">{list.title}</h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{tasks.length} Tasks</p>
          </div>
        </div>
        <button onClick={() => onDeleteList(list.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-opacity opacity-0 group-hover/section:opacity-100">
          <Trash2 size={18} />
        </button>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`space-y-3 min-h-[100px] p-2 rounded-[1.5rem] transition-colors duration-200 ${
            tasks.length === 0 ? "border-2 border-dashed border-slate-200 bg-slate-50/50" : ""
          }`}
        >
          {tasks.map(task => (
            <SortableTask
              key={task.id}
              task={task}
              listId={list.id}
              onOpenTask={onOpenTask}
              onDeleteTask={onDeleteTask}
            />
          ))}

          <button
            onClick={() => onOpenCreateModal(list.id)}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[1.25rem] flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition-all group"
          >
            <Plus size={14} strokeWidth={3} />
            <span className="text-xs font-black uppercase tracking-widest">Quick Task Add</span>
          </button>
        </div>
      </SortableContext>
    </section>
  );
}

export default ListSection;