import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import api from "../../api/axios";

function TaskModal({
  task,
  listId,
  members,
  onClose,
  onCreated,
  onUpdated,
  onDeleted
}) {
  const isEdit = !!task;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");


  useEffect(() => {
    if (isEdit) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
    }
  }, [task]);

  useEffect(() => {
    if (task) {
        fetchAssignees();
    }
  }, [task]);

  const handleSave = async () => {
    try {
      if (isEdit) {
        const res = await api.put(`/tasks/${task.id}`, {
          title,
          description,
          due_date: dueDate
        });

        onUpdated(res.data.task);
      } else {
        const res = await api.post("/tasks", {
          title,
          description,
          due_date: dueDate,
          listId
        });

        onCreated(res.data.task);
      }

      onClose();
    } catch (err) {
      console.error("Task save failed");
      if (err.response?.status === 403) {
        alert("You are not allowed to modify this task.");
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      onDeleted(task.id);
      onClose();
    } catch (err) {
      console.error("Delete failed");
      if (err.response?.status === 403) {
        alert("You are not allowed to delete this task.");
      }
      
    }
  };

  const fetchAssignees = async () => {
    try {
        const res = await api.get(`/tasks/${task.id}/assignees`);
        setAssignees(res.data.assignees);
    } catch (err) {
        console.error("Failed to fetch assignees");
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) return;

    try {
        await api.post(`/tasks/${task.id}/assign`, {
        userId: selectedUser
        });

        fetchAssignees();
        setSelectedUser("");
    } catch (err) {
        console.error("Assign failed");
    }
  };

  const handleUnassign = async (userId) => {
    try {
        await api.delete(`/tasks/${task.id}/assign/${userId}`);
        fetchAssignees();
    } catch (err) {
        console.error("Unassign failed");
    }
  };




  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 space-y-6">
        
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-700">
            {isEdit ? "Edit Task" : "Create Task"}
          </h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            className="w-full border p-3 rounded-xl"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full border p-3 rounded-xl"
            placeholder="Description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="date"
            className="w-full border p-3 rounded-xl"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Assigned Members
            </label>

            <div className="flex flex-wrap gap-2">
                {assignees.map(user => (
                <div
                    key={user.id}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs"
                >
                    {user.name}
                    <button
                    onClick={() => handleUnassign(user.id)}
                    className="text-indigo-400 hover:text-rose-500"
                    >
                    ✕
                    </button>
                </div>
                ))}
            </div>

            <div className="flex gap-2 mt-2">
                <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="flex-1 border p-2 rounded"
                >
                <option value="">Select board member</option>
                {members.map(member => (
                    <option key={member.id} value={member.id}>
                    {member.name}
                    </option>
                ))}
                </select>

                <button
                onClick={handleAssign}
                className="bg-indigo-600 text-white px-3 rounded"
                >
                Assign
                </button>
            </div>
        </div>


        <div className="flex justify-between items-center pt-4">
          {isEdit && (
            <button
              onClick={handleDelete}
              className="text-rose-500 flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete
            </button>
          )}

          <button
            onClick={handleSave}
            className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded-xl"
          >
            {isEdit ? "Update Task" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
