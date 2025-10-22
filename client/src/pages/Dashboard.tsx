import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import api from '../api';
import FocusMode from '../components/FocusMode';
import InsightsChart from '../components/InsightsChart';
import EchoJournal from '../components/EchoJournal';
import SnapshotCompare from '../components/SnapshotCompare';
import WeeklyDigestPreview from '../components/WeeklyDigestPreview';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeView, setActiveView] = useState<'tasks' | 'insights' | 'focus' | 'journal' | 'snapshots' | 'digest'>('tasks');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks?limit=50');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const response = await api.post('/tasks', {
        title: newTaskTitle,
        status: 'todo',
        priority: 'medium'
      });

      setTasks([response.data, ...tasks]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const response = await api.patch(`/tasks/${taskId}`, { status });
      setTasks(tasks.map(t => t.id === taskId ? response.data : t));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'archived');
  const completedTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Billow</h1>
              <p className="text-sm text-dark-muted">
                Welcome back, {user?.displayName || user?.email}
                {user?.isGuest && <span className="ml-2 badge badge-low">Guest</span>}
              </p>
            </div>
            <button onClick={logout} className="btn-secondary text-sm">
              Sign Out
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex gap-2 mt-4">
            {['tasks', 'insights', 'focus', 'journal', 'snapshots', 'digest'].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === view
                    ? 'bg-dark-accent text-white'
                    : 'text-dark-muted hover:text-dark-text hover:bg-dark-hover'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'tasks' && (
          <div className="space-y-6 animate-fade-in">
            {/* New Task Form */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Add Task</h2>
              <form onSubmit={createTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="flex-1"
                />
                <button type="submit" className="btn-primary">
                  Add
                </button>
              </form>
            </div>

            {/* Pending Tasks */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                Pending Tasks <span className="text-dark-muted text-base">({pendingTasks.length})</span>
              </h2>
              {loading ? (
                <p className="text-dark-muted">Loading tasks...</p>
              ) : pendingTasks.length === 0 ? (
                <p className="text-dark-muted">No pending tasks. You're all caught up! 🎉</p>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="card-hover p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-dark-muted mb-2">{task.description}</p>
                          )}
                          <div className="flex gap-2">
                            <span className={`badge badge-${task.status}`}>{task.status}</span>
                            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                            {task.due_date && (
                              <span className="badge badge-todo">{task.due_date}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {task.status !== 'done' && (
                            <button
                              onClick={() => updateTaskStatus(task.id, 'done')}
                              className="text-green-400 hover:text-green-300 text-sm"
                            >
                              ✓ Complete
                            </button>
                          )}
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">
                  Completed <span className="text-dark-muted text-base">({completedTasks.length})</span>
                </h2>
                <div className="space-y-2">
                  {completedTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-hover">
                      <div className="flex-1">
                        <h3 className="font-medium line-through opacity-60">{task.title}</h3>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-dark-muted hover:text-red-400 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'insights' && (
          <div className="animate-fade-in">
            <InsightsChart />
          </div>
        )}

        {activeView === 'focus' && (
          <div className="animate-fade-in">
            <FocusMode />
          </div>
        )}

        {activeView === 'journal' && (
          <div className="animate-fade-in">
            <EchoJournal />
          </div>
        )}

        {activeView === 'snapshots' && (
          <div className="animate-fade-in">
            <SnapshotCompare />
          </div>
        )}

        {activeView === 'digest' && (
          <div className="animate-fade-in">
            <WeeklyDigestPreview />
          </div>
        )}
      </main>
    </div>
  );
}

