import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

// Components
import BoardHeader from "../components/board/BoardHeader";
import ListSection, { SortableTask } from "../components/board/ListSection";
import ActivityPanel from "../components/board/ActivityPanel";
import BoardMembersModal from "../components/board/BoardMembersModal";
import AddList from "../components/board/AddList";
import TaskModal from "../components/board/TaskModal";

// DND Kit Core
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";

// DND Kit Helpers
import { arrayMove } from "@dnd-kit/sortable";

import socket from "../socket";


function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [boardTitle, setBoardTitle] = useState("");
  const [lists, setLists] = useState([]);
  const [tasksMap, setTasksMap] = useState({});
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [creatingForList, setCreatingForList] = useState(null);
  const [activeTask, setActiveTask] = useState(null); // For smooth DragOverlay

  // --- Fetching Data ---
  const fetchBoardData = useCallback(async () => {
    try {
      setLoading(true);
      const [boardRes, listRes, activityRes, memberRes] = await Promise.all([
        api.get(`/boards/${boardId}`),
        api.get(`/lists/${boardId}`),
        api.get(`/boards/${boardId}/activity`),
        api.get(`/boards/${boardId}/members`),
      ]);

      setBoardTitle(boardRes.data.board.title);
      const fetchedLists = listRes.data.lists;
      setLists(fetchedLists);

      const tasksObj = {};
      for (let list of fetchedLists) {
        const taskRes = await api.get(`/tasks/list/${list.id}`);
        tasksObj[list.id] = taskRes.data.tasks;
      }
      setTasksMap(tasksObj);
      setActivities(activityRes.data.activities);
      setMembers(memberRes.data.members);
    } catch (err) {
      console.error("Failed to load board", err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  useEffect(() => {
  socket.connect();

  socket.emit("joinBoard", boardId);

  socket.on("taskCreated", (task) => {
    setTasksMap(prev => ({
      ...prev,
      [task.list_id]: [...(prev[task.list_id] || []), task]
    }));
  });

  socket.on("taskDeleted", ({ taskId, listId }) => {
    setTasksMap(prev => ({
      ...prev,
      [listId]: prev[listId].filter(t => t.id !== taskId)
    }));
  });

  socket.on("taskMoved", ({ taskId, sourceListId, targetListId, newPosition }) => {
    fetchBoardData(); // easiest safe approach for now
  });

  socket.on("taskAssigned", ({ taskId, userId }) => {
    console.log("Task assigned:", taskId, userId);
  });

  socket.on("activity:new", (activity) => {
    setActivities(prev => [activity, ...prev]);
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  return () => {
    socket.off("taskCreated");
    socket.off("taskDeleted");
    socket.off("taskMoved");
    socket.off("taskAssigned");
    socket.off("activity:new");
    socket.disconnect();
  };
}, [boardId]);




  // --- DND Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Fixes the click vs drag conflict
      },
    })
  );

  // --- Drag Logic ---
  const handleDragStart = (event) => {
    const { active } = event;
    // Find the task object being dragged to show in the Overlay
    let taskFound = null;
    for (const listId in tasksMap) {
      const task = tasksMap[listId].find((t) => t.id === active.id);
      if (task) {
        taskFound = { ...task, listId };
        break;
      }
    }
    setActiveTask(taskFound);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null); // Hide the overlay card
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    let sourceListId = null;
    let targetListId = null;

    // Find source
    for (let listId in tasksMap) {
      if (tasksMap[listId].some((t) => t.id === activeId)) {
        sourceListId = listId;
      }
    }

    // Detect target
    if (overId.toString().startsWith("list-")) {
      targetListId = overId.replace("list-", "");
    } else {
      for (let listId in tasksMap) {
        if (tasksMap[listId].some((t) => t.id === overId)) {
          targetListId = listId;
        }
      }
    }

    if (!sourceListId || !targetListId) return;

    const sourceTasks = tasksMap[sourceListId];
    const targetTasks = tasksMap[targetListId];
    const oldIndex = sourceTasks.findIndex((t) => t.id === activeId);

    let newIndex;
    if (overId.toString().startsWith("list-")) {
      newIndex = 0;
    } else {
      newIndex = targetTasks.findIndex((t) => t.id === overId);
    }

    // Local State Update
    const updated = { ...tasksMap };
    if (sourceListId === targetListId) {
      updated[sourceListId] = arrayMove(sourceTasks, oldIndex, newIndex);
    } else {
      const movingTask = sourceTasks[oldIndex];
      updated[sourceListId] = sourceTasks.filter((t) => t.id !== activeId);
      updated[targetListId] = [
        ...targetTasks.slice(0, newIndex),
        { ...movingTask, listId: targetListId },
        ...targetTasks.slice(newIndex),
      ];
    }
    setTasksMap(updated);

    // Persist to API
    try {
      await api.patch(`/tasks/${activeId}/move`, {
        targetListId,
        newPosition: newIndex + 1,
      });
    } catch (err) {
      console.error("Move failed", err);
      fetchBoardData(); // Revert on failure
    }
  };

  // --- CRUD Operations ---
  const createList = async (title) => {
    const res = await api.post("/lists", { boardId, title });
    setLists((prev) => [...prev, res.data.list]);
    setTasksMap((prev) => ({ ...prev, [res.data.list.id]: [] }));
  };

  const deleteList = async (listId) => {
    if (!window.confirm("Delete this entire list?")) return;
    setLists((prev) => prev.filter((l) => l.id !== listId));
    await api.delete(`/lists/${listId}`);
  };

  const deleteTask = async (taskId, listId) => {
  if (!window.confirm("Delete this task?")) return;

  try {
    await api.delete(`/tasks/${taskId}`);

    // Only remove from UI AFTER success
    setTasksMap(prev => ({
      ...prev,
      [listId]: prev[listId].filter(t => t.id !== taskId),
    }));

  } catch (err) {
    if (err.response?.status === 403) {
      alert("You are not allowed to delete this task.");
    } else {
      alert("Something went wrong while deleting.");
    }
  }
};

  // --- Loading State ---
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">
          Loading Workspace...
        </p>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden font-sans">
      <BoardHeader
        title={boardTitle}
        onBack={() => navigate("/dashboard")}
        onShowMembers={() => setShowMembersModal(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-10">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="max-w-5xl mx-auto space-y-12">
              <AddList onCreateList={createList} />

              {lists.map((list) => (
                <ListSection
                  key={list.id}
                  list={list}
                  tasks={tasksMap[list.id] || []}
                  onOpenCreateModal={(id) => setCreatingForList(id)}
                  onOpenTask={(task, lId) => setSelectedTask({ ...task, listId: lId })}
                  onDeleteTask={deleteTask}
                  onDeleteList={deleteList}
                />
              ))}

              <div className="h-20" />
            </div>

            {/* 🔥 This is what makes DND smooth */}
            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: { active: { opacity: "0.5" } },
                }),
              }}
            >
              {activeTask ? (
                <SortableTask
                  task={activeTask}
                  listId={activeTask.listId}
                  isOverlay={true}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>

        <aside className="hidden xl:block w-96 border-l border-slate-200 bg-white">
          <ActivityPanel activities={activities} />
        </aside>
      </div>

      {/* Modals */}
      {showMembersModal && (
        <BoardMembersModal
          members={members}
          onClose={() => setShowMembersModal(false)}
          onRemove={(uid) => console.log("Remove logic here", uid)}
        />
      )}

      {creatingForList && (
        <TaskModal
          listId={creatingForList}
          members={members}
          onClose={() => setCreatingForList(null)}
          onCreated={(task) =>
            setTasksMap((prev) => ({
              ...prev,
              [creatingForList]: [...(prev[creatingForList] || []), task],
            }))
          }
        />
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          listId={selectedTask.listId}
          members={members}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

export default BoardPage;