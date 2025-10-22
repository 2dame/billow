import { useState, useEffect } from 'react';
import api from '../api';

interface Snapshot {
  id: string;
  snapshot_date: string;
  data: {
    tasksCompleted?: number;
    avgMood?: number;
    [key: string]: any;
  };
  created_at: string;
}

export default function SnapshotCompare() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const fetchSnapshots = async () => {
    try {
      const response = await api.get('/snapshots?limit=10');
      setSnapshots(response.data.snapshots);
    } catch (error) {
      console.error('Failed to fetch snapshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSnapshot = async () => {
    setCreating(true);
    try {
      // Fetch current stats
      const tasksRes = await api.get('/tasks?status=done&limit=1000');
      const reflectionsRes = await api.get('/reflections?limit=100');

      const tasksCompleted = tasksRes.data.tasks.length;
      const avgMood = reflectionsRes.data.reflections.length > 0
        ? reflectionsRes.data.reflections
            .filter((r: any) => r.mood_score)
            .reduce((sum: number, r: any) => sum + (r.mood_score || 0), 0) /
          reflectionsRes.data.reflections.filter((r: any) => r.mood_score).length
        : 0;

      const response = await api.post('/snapshots', {
        data: {
          tasksCompleted,
          avgMood: avgMood.toFixed(2),
          timestamp: new Date().toISOString()
        }
      });

      setSnapshots([response.data, ...snapshots]);
    } catch (error) {
      console.error('Failed to create snapshot:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="text-dark-muted">Loading snapshots...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Snapshot Compare</h2>
            <p className="text-dark-muted text-sm mt-1">
              Capture and compare your progress over time
            </p>
          </div>
          <button onClick={createSnapshot} disabled={creating} className="btn-primary">
            {creating ? 'Creating...' : '📸 Take Snapshot'}
          </button>
        </div>

        {snapshots.length === 0 ? (
          <p className="text-dark-muted text-center py-8">
            No snapshots yet. Take your first snapshot to start tracking!
          </p>
        ) : (
          <div className="space-y-4">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="p-4 bg-dark-hover rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium mb-2">
                      {new Date(snapshot.snapshot_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-dark-muted">Tasks Completed:</span>
                        <span className="ml-2 font-semibold text-dark-accent">
                          {snapshot.data.tasksCompleted || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-dark-muted">Avg Mood:</span>
                        <span className="ml-2 font-semibold text-purple-400">
                          {snapshot.data.avgMood || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {snapshots.length >= 2 && (
          <div className="mt-6 p-4 bg-dark-accent/10 border border-dark-accent/30 rounded-lg">
            <h3 className="font-medium mb-2">Latest Comparison</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-dark-muted">Tasks Change:</p>
                <p className="text-lg font-semibold">
                  {((snapshots[0]?.data.tasksCompleted || 0) - (snapshots[1]?.data.tasksCompleted || 0)) > 0 ? '+' : ''}
                  {(snapshots[0]?.data.tasksCompleted || 0) - (snapshots[1]?.data.tasksCompleted || 0)}
                </p>
              </div>
              <div>
                <p className="text-dark-muted">Mood Change:</p>
                <p className="text-lg font-semibold">
                  {((parseFloat(snapshots[0]?.data.avgMood) || 0) - (parseFloat(snapshots[1]?.data.avgMood) || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

