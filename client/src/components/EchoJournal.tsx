import { useState, useEffect } from 'react';
import api from '../api';

interface Reflection {
  id: string;
  type: string;
  content: string;
  mood_score: number | null;
  reflection_date: string;
  created_at: string;
}

export default function EchoJournal() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [moodScore, setMoodScore] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReflections();
  }, []);

  const fetchReflections = async () => {
    try {
      const response = await api.get('/reflections?limit=10');
      setReflections(response.data.reflections);
    } catch (error) {
      console.error('Failed to fetch reflections:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post('/reflections', {
        content,
        moodScore,
        type: 'daily'
      });
      setReflections([response.data, ...reflections]);
      setContent('');
      setMoodScore(3);
    } catch (error) {
      console.error('Failed to create reflection:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const moodEmojis = ['😢', '😕', '😐', '🙂', '😄'];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Write Reflection */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Echo Journal</h2>
        <p className="text-dark-muted text-sm mb-4">
          Reflect on your day. What went well? What could be better?
        </p>

        <form onSubmit={submitReflection} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts..."
            rows={6}
            disabled={submitting}
            className="w-full resize-none"
          />

          <div className="flex items-center justify-between">
            <div>
              <label className="label mb-2 block">How are you feeling? (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setMoodScore(score)}
                    className={`text-3xl transition-all hover:scale-110 ${
                      moodScore === score ? 'scale-125' : 'opacity-50'
                    }`}
                  >
                    {moodEmojis[score - 1]}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting || !content.trim()} className="btn-primary">
              {submitting ? 'Saving...' : 'Save Reflection'}
            </button>
          </div>
        </form>
      </div>

      {/* Past Reflections */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Past Reflections</h3>
        {loading ? (
          <p className="text-dark-muted">Loading reflections...</p>
        ) : reflections.length === 0 ? (
          <p className="text-dark-muted">No reflections yet. Start journaling above!</p>
        ) : (
          <div className="space-y-4">
            {reflections.map((reflection) => (
              <div key={reflection.id} className="p-4 bg-dark-hover rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {reflection.mood_score ? moodEmojis[reflection.mood_score - 1] : '📝'}
                    </span>
                    <span className="text-sm text-dark-muted">
                      {new Date(reflection.reflection_date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="badge badge-todo">{reflection.type}</span>
                </div>
                <p className="text-dark-text whitespace-pre-wrap">{reflection.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

