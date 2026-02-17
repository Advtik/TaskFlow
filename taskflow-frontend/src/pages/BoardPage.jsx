import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

import BoardHeader from "../components/board/BoardHeader";
import ListSection, { SortableTask } from "../components/board/ListSection";
import ActivityPanel from "../components/board/ActivityPanel";
import BoardMembersModal from "../components/board/BoardMembersModal";
import AddList from "../components/board/AddList";
import TaskModal from "../components/board/TaskModal";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";

import { arrayMove } from "@dnd-kit/sortable";

import socket from "../socket";

function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [boardTitle, setBoardTitle] = useState("");
  const [lists, setLists] = useState([]);
  const [tasksMap, setTasksMap] = useState({});
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [creatingForList, setCreatingForList] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);


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

    socket.on("taskUpdated", (updatedTask) => {
  setTasksMap(prev => {
    const updated = { ...prev };

    for (let listId in updated) {
      updated[listId] = updated[listId].map(task =>
        task.id === updatedTask.id ? updatedTask : task
      );
    }

    return updated;
  });
});

    socket.on("taskDeleted", ({ taskId, listId }) => {
      setTasksMap(prev => ({
        ...prev,
        [listId]: prev[listId].filter(t => t.id !== taskId)
      }));
    });

    socket.on("taskMoved", () => {
      fetchBoardData();
    });

    socket.on("activity:new", (activity) => {
      setActivities(prev => [activity, ...prev]);
    });

    socket.on("listCreated", (list) => {
  setLists(prev => {
    if (prev.some(l => l.id === list.id)) return prev; // prevent duplicates
    return [...prev, list];
  });

  setTasksMap(prev => ({
    ...prev,
    [list.id]: []
  }));
});

socket.on("listDeleted", (listId) => {
  setLists(prev => prev.filter(l => l.id !== listId));

  setTasksMap(prev => {
    const updated = { ...prev };
    delete updated[listId];
    return updated;
  });
});

    

    return () => {
      socket.off("taskCreated");
      socket.off("taskDeleted");
      socket.off("taskMoved");
      socket.off("taskUpdated");

      socket.off("activity:new");
      socket.off("listCreated");
socket.off("listDeleted");

      socket.disconnect();
    };
  }, [boardId, fetchBoardData]);

  const addMember = async (userId) => {
  try {
    await api.post(`/boards/${boardId}/members`, { userId });

    const memberRes = await api.get(`/boards/${boardId}/members`);
    setMembers(memberRes.data.members);

  } catch (err) {
    if (err.response?.status === 409) {
      alert("User is already a member.");
    } else {
      console.error("Failed to add member", err);
      alert("Could not add member.");
    }
  }
};


  const removeMember = async (userId) => {
    try {
      await api.delete(`/boards/${boardId}/members/${userId}`);
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch (err) {
      console.error("Failed to remove member", err);
      alert("Could not remove member.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
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
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    let sourceListId = null;
    let targetListId = null;

    for (let listId in tasksMap) {
      if (tasksMap[listId].some((t) => t.id === activeId)) {
        sourceListId = listId;
      }
    }

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

    try {
      await api.patch(`/tasks/${activeId}/move`, {
        targetListId,
        newPosition: newIndex + 1,
      });
    } catch (err) {
      console.error("Move failed", err);
      fetchBoardData();
    }
  };

  const createList = async (title) => {
    await api.post("/lists", { boardId, title });
    
  };

  const deleteList = async (listId) => {
    if (!window.confirm("Delete this entire list?")) return;
    setLists(prev => prev.filter(l => l.id !== listId));
    await api.delete(`/lists/${listId}`);
  };

  const updateTask = (updatedTask) => {
  setTasksMap(prev => {
    const updated = { ...prev };

    for (let listId in updated) {
      updated[listId] = updated[listId].map(task =>
        task.id === updatedTask.id ? updatedTask : task
      );
    }

    return updated;
  });
};


  const deleteTask = async (taskId, listId) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasksMap(prev => ({
        ...prev,
        [listId]: prev[listId].filter(t => t.id !== taskId),
      }));
    } catch (err) {
      alert("Something went wrong while deleting.");
    }
  };

  const handleSearch = async (value) => {
    setSearchQuery(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await api.get(`/tasks/search`, {
        params: {
          boardId,
          query: value,
          page: 1,
          limit: 5
        }
      });

      setSearchResults(res.data.tasks);
      setShowSearchDropdown(true);
    } catch (err) {
      console.error("Search failed", err);
    }
  };


  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading Workspace...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden font-sans">
      <BoardHeader
        title={boardTitle}
        onBack={() => navigate("/dashboard")}
        onShowMembers={() => setShowMembersModal(true)}
        onAddMember={addMember}
        members={members}

        searchQuery={searchQuery}
        onSearch={handleSearch}
        searchResults={searchResults}
        showSearchDropdown={showSearchDropdown}
        setSelectedTask={setSelectedTask}
        setShowSearchDropdown={setShowSearchDropdown}
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
            </div>

            <DragOverlay>
              {activeTask ? (
                <SortableTask
                  task={activeTask}
                  listId={activeTask.listId}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>

        <aside className="hidden xl:block w-96 border-l bg-white">
          <ActivityPanel activities={activities} />
        </aside>
      </div>

      {showMembersModal && (
        <BoardMembersModal
          members={members}
          onClose={() => setShowMembersModal(false)}
          onRemove={removeMember}
          onAddMember={addMember}
        />
      )}

      {creatingForList && (
        <TaskModal
          listId={creatingForList}
          members={members}
          onClose={() => setCreatingForList(null)}
        />
      )}

      {selectedTask && (
  <TaskModal
    task={selectedTask}
    listId={selectedTask.listId}
    members={members}
    onClose={() => setSelectedTask(null)}
    onUpdated={updateTask}
    onDeleted={(taskId) => {
      setTasksMap(prev => {
        const updated = { ...prev };
        updated[selectedTask.listId] =
          updated[selectedTask.listId].filter(t => t.id !== taskId);
        return updated;
      });
    }}
  />
)}

    </div>
  );
}

export default BoardPage;
