import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeeklySummary {
  week_start: string;
  tasks_completed: number;
  avg_mood: number | null;
}

export default function InsightsChart() {
  const [data, setData] = useState<WeeklySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await api.get('/insights/weekly?weeks=12');
      setData(response.data.insights.reverse());
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="text-dark-muted">Loading insights...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Weekly Insights</h2>
        <p className="text-dark-muted">
          Not enough data yet. Complete some tasks and add reflections to see your trends!
        </p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => new Date(d.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Tasks Completed',
        data: data.map(d => d.tasks_completed),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Avg Mood (1-5)',
        data: data.map(d => d.avg_mood || 0),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        yAxisID: 'y1',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e5e5',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: '#141414',
        borderColor: '#1f1f1f',
        borderWidth: 1,
        titleColor: '#e5e5e5',
        bodyColor: '#a1a1a1',
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          color: '#1f1f1f'
        },
        ticks: {
          color: '#a1a1a1'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: '#1f1f1f'
        },
        ticks: {
          color: '#a1a1a1'
        },
        title: {
          display: true,
          text: 'Tasks Completed',
          color: '#a1a1a1'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#a1a1a1'
        },
        title: {
          display: true,
          text: 'Mood',
          color: '#a1a1a1'
        },
        min: 0,
        max: 5
      }
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-6">Weekly Insights</h2>
      <div className="h-[400px]">
        <Line data={chartData} options={options} />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-dark-hover rounded-lg">
          <p className="text-2xl font-bold text-dark-accent">
            {data.reduce((sum, d) => sum + d.tasks_completed, 0)}
          </p>
          <p className="text-sm text-dark-muted">Total Tasks</p>
        </div>
        <div className="p-4 bg-dark-hover rounded-lg">
          <p className="text-2xl font-bold text-purple-400">
            {(data.reduce((sum, d) => sum + (d.avg_mood || 0), 0) / data.filter(d => d.avg_mood).length || 0).toFixed(1)}
          </p>
          <p className="text-sm text-dark-muted">Avg Mood</p>
        </div>
        <div className="p-4 bg-dark-hover rounded-lg">
          <p className="text-2xl font-bold text-green-400">
            {data.length}
          </p>
          <p className="text-sm text-dark-muted">Weeks Tracked</p>
        </div>
      </div>
    </div>
  );
}

