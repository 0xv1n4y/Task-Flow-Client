import { useState } from "react";
import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  Sun,
  Moon,
  Menu,
  X,
  CheckSquare,
  Loader2,
} from "lucide-react";
import { useAuth, UserButton, useUser } from "@clerk/react";
import { useTasks } from "./store/useTasks";
import Dashboard from "./components/Dashboard";
import Tasks from "./components/Tasks";
import CalendarPage from "./components/CalendarPage";
import AuthPage from "./components/AuthPage";
import { cn } from "./lib/utils";
import { useToast } from "./components/ui/Toast";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "My Tasks", icon: ListTodo },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const toggle = () => {
    setDark((d) => {
      const next = !d;
      localStorage.setItem("theme", next ? "dark" : "light");
      if (next) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return next;
    });
  };

  // Apply on mount
  useState(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  });

  return { dark, toggle };
}

function AppShell() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dark, toggle: toggleTheme } = useTheme();
  const { tasks, loading, error: fetchError, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { user } = useUser();
  const { toast } = useToast();

  const handleAdd = async (data) => {
    try {
      await addTask(data);
      toast({ type: "success", title: "Task Added", message: `"${data.title}" added to your list.` });
    } catch (err) {
      toast({ type: "error", title: "Failed to Add Task", message: err.message || "Could not reach the server." });
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await updateTask(id, data);
      toast({ type: "info", title: "Task Updated", message: `"${data.title}" saved successfully.` });
    } catch (err) {
      toast({ type: "error", title: "Failed to Update Task", message: err.message || "Could not reach the server." });
    }
  };

  const handleDelete = async (id) => {
    const task = tasks.find((t) => t.id === id);
    try {
      await deleteTask(id);
      toast({ type: "error", title: "Task Deleted", message: task ? `"${task.title}" was removed.` : "Task removed." });
    } catch (err) {
      toast({ type: "error", title: "Failed to Delete Task", message: err.message || "Could not reach the server." });
    }
  };

  const handleToggle = async (id) => {
    const task = tasks.find((t) => t.id === id);
    const willComplete = !task?.completed;
    try {
      await toggleTask(id);
      if (willComplete) {
        toast({
          type: "success",
          title: "Task Completed!",
          message: `"${task?.title}" marked as done. Dashboard updated.`,
          duration: 5000,
          action: { label: "View Dashboard", onClick: () => setPage("dashboard") },
        });
      } else {
        toast({ type: "warning", title: "Task Reopened", message: `"${task?.title}" marked as pending.` });
      }
    } catch (err) {
      toast({ type: "error", title: "Failed to Update Task", message: err.message || "Could not reach the server." });
    }
  };

  const todayTotal = tasks.filter(
    (t) => t.createdAt === new Date().toISOString().slice(0, 10)
  ).length;
  const todayDone = tasks.filter(
    (t) => t.createdAt === new Date().toISOString().slice(0, 10) && t.completed
  ).length;

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-30 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-3 px-6 h-16 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckSquare size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">TaskFlow</span>
          <button
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable middle */}
        <div className="flex-1 overflow-y-auto">
          {/* Today's quick stat */}
          <div className="mx-4 mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary font-semibold uppercase tracking-wide">Today</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">
              {todayDone}
              <span className="text-muted-foreground text-base font-normal">/{todayTotal}</span>
            </p>
            <p className="text-xs text-muted-foreground">tasks completed</p>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${todayTotal > 0 ? (todayDone / todayTotal) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 mt-2 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setPage(id); setSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                page === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon size={18} />
              {label}
              {id === "tasks" && (
                <span
                  className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold",
                    page === id
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tasks.filter((t) => !t.completed).length}
                </span>
              )}
            </button>
          ))}
          </nav>
        </div>

        {/* Bottom — user info + theme */}
        <div className="px-4 py-3 border-t border-border shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <UserButton />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {tasks.length} total tasks
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <CheckSquare size={12} className="text-white" />
            </div>
            <span className="font-bold text-foreground">TaskFlow</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex shrink-0 sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-8 h-16 items-center gap-4">
          <div>
            <h2 className="font-semibold text-foreground capitalize">
              {NAV_ITEMS.find((n) => n.id === page)?.label}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <UserButton />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {fetchError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="font-medium">API error:</span> {fetchError} — make sure the backend server is running.
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm">Loading your tasks…</span>
            </div>
          ) : (
            <>
              {page === "dashboard" && <Dashboard tasks={tasks} />}
              {page === "tasks" && (
                <Tasks
                  tasks={tasks}
                  onAdd={handleAdd}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              )}
              {page === "calendar" && <CalendarPage tasks={tasks} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return isSignedIn ? <AppShell /> : <AuthPage />;
}
