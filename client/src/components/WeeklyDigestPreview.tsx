import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import api from '../api';

interface Digest {
  id: string;
  digest_type: string;
  content: {
    summary: string;
    tasksCompleted: number;
    reflectionCount: number;
    avgMood: string;
    periodStart: string;
    periodEnd: string;
  };
  created_at: string;
}

export default function WeeklyDigestPreview() {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchDigests();
  }, []);

  const fetchDigests = async () => {
    try {
      const response = await api.get('/digests?digestType=weekly&limit=5');
      setDigests(response.data.digests);
    } catch (error) {
      console.error('Failed to fetch digests:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDigest = async () => {
    setGenerating(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 7);

      const response = await api.post('/digests', {
        digestType: 'weekly',
        periodStart: format(startDate, 'yyyy-MM-dd'),
        periodEnd: format(endDate, 'yyyy-MM-dd')
      });

      setDigests([response.data, ...digests]);
    } catch (error) {
      console.error('Failed to generate digest:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="text-dark-muted">Loading digests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Weekly Digest</h2>
            <p className="text-dark-muted text-sm mt-1">
              Auto-generated summaries of your productivity and reflections
            </p>
          </div>
          <button onClick={generateDigest} disabled={generating} className="btn-primary">
            {generating ? 'Generating...' : '📋 Generate Digest'}
          </button>
        </div>

        {digests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-muted mb-4">No digests yet.</p>
            <p className="text-sm text-dark-muted">
              Click "Generate Digest" to create your first weekly summary!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {digests.map((digest) => (
              <div key={digest.id} className="p-6 bg-dark-hover rounded-lg border border-dark-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Weekly Summary</h3>
                    <p className="text-sm text-dark-muted">
                      {new Date(digest.content.periodStart).toLocaleDateString()} -{' '}
                      {new Date(digest.content.periodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-3xl">📊</span>
                </div>

                <p className="text-dark-text mb-6">{digest.content.summary}</p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-dark-card rounded-lg">
                    <p className="text-2xl font-bold text-dark-accent">
                      {digest.content.tasksCompleted}
                    </p>
                    <p className="text-xs text-dark-muted mt-1">Tasks Done</p>
                  </div>
                  <div className="text-center p-3 bg-dark-card rounded-lg">
                    <p className="text-2xl font-bold text-purple-400">
                      {digest.content.avgMood}
                    </p>
                    <p className="text-xs text-dark-muted mt-1">Avg Mood</p>
                  </div>
                  <div className="text-center p-3 bg-dark-card rounded-lg">
                    <p className="text-2xl font-bold text-green-400">
                      {digest.content.reflectionCount}
                    </p>
                    <p className="text-xs text-dark-muted mt-1">Reflections</p>
                  </div>
                </div>

                <p className="text-xs text-dark-muted mt-4">
                  Generated on {new Date(digest.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

