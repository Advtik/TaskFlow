import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Plus, Layout, LogOut, Search, Grid, Clock } from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [boards, setBoards] = useState([]);
  const [membersMap, setMembersMap] = useState({});
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("boards"); // "boards" | "recent"

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await api.get("/boards");
      setBoards(res.data.boards);

      // Fetch members for each board
      const membersData = {};
      for (let board of res.data.boards) {
        const memberRes = await api.get(`/boards/${board.id}/members`);
        membersData[board.id] = memberRes.data.members;
      }

      setMembersMap(membersData);
    } catch (err) {
      console.error("Failed to fetch boards");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await api.post("/boards", { title });
      setBoards(prev => [...prev, res.data.board]);
      setTitle("");
    } catch (err) {
      console.error("Failed to create board");
    }
  };

  // 🔎 Search filtering
  const filteredBoards = boards
    .filter(board =>
      board.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (view === "recent") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col p-6">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Layout size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">TaskFlow</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setView("boards")}
            className={`flex items-center gap-3 w-full p-3 rounded-xl ${
              view === "boards"
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Grid size={18} /> My Boards
          </button>

          <button
            onClick={() => setView("recent")}
            className={`flex items-center gap-3 w-full p-3 rounded-xl ${
              view === "recent"
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Clock size={18} /> Recent
          </button>
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full p-3 rounded-xl text-rose-500 hover:bg-rose-50 mt-auto"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 lg:p-12">

        {/* HEADER */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold">
              Welcome back, <span className="text-indigo-600">{user?.name}</span> 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your workspaces and stay productive.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search boards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </header>

        {/* CREATE BOARD */}
        <section className="mb-12">
          <form onSubmit={handleCreateBoard} className="flex gap-3 max-w-md">
            <input
              type="text"
              placeholder="Board name"
              className="flex-1 bg-white border p-3 rounded-xl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white p-3 rounded-xl"
            >
              <Plus size={20} />
            </button>
          </form>
        </section>

        {/* BOARD GRID */}
        <section>
          {filteredBoards.length === 0 && !loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              No boards found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBoards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/boards/${board.id}`)}
                  className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition cursor-pointer"
                >
                  <h2 className="text-lg font-bold text-slate-800">
                    {board.title}
                  </h2>

                  <p className="text-xs text-slate-400 mt-2">
                    Created {new Date(board.created_at).toLocaleDateString()}
                  </p>

                  {/* MEMBERS AVATARS */}
                  <div className="mt-4 flex -space-x-2">
                    {membersMap[board.id]?.slice(0, 3).map(member => (
                      <div
                        key={member.id}
                        className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold"
                      >
                        {member.name[0]}
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default Dashboard;
