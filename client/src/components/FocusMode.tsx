import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function FocusMode() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(25);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socketInstance = io(API_BASE_URL, {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('Connected to Focus Mode socket');
    });

    socketInstance.on('focus:started', ({ duration: d, elapsed: e }) => {
      setIsActive(true);
      setElapsed(e);
      setRemaining(d - e);
    });

    socketInstance.on('focus:tick', ({ elapsed: e, remaining: r }) => {
      setElapsed(e);
      setRemaining(r);
    });

    socketInstance.on('focus:complete', () => {
      setIsActive(false);
      alert('Focus session complete! Great work! 🎉');
    });

    socketInstance.on('focus:stopped', ({ elapsed: e }) => {
      setIsActive(false);
      setElapsed(e);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const startFocus = () => {
    if (socket) {
      socket.emit('focus:start', { duration: duration * 60 });
    }
  };

  const stopFocus = () => {
    if (socket) {
      socket.emit('focus:stop');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isActive && duration > 0 ? (elapsed / (duration * 60)) * 100 : 0;

  return (
    <div className="card max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-2">Focus Mode</h2>
      <p className="text-dark-muted mb-8">Deep work timer with real-time sync</p>

      {!isActive ? (
        <div className="space-y-6">
          <div>
            <label className="label text-center block mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              min="1"
              max="120"
              className="w-32 text-center mx-auto"
            />
          </div>
          <button onClick={startFocus} className="btn-primary px-8 py-3 text-lg">
            Start Focus Session
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <div className="text-6xl font-mono font-bold mb-4">
              {formatTime(remaining)}
            </div>
            <div className="w-full bg-dark-border rounded-full h-3 overflow-hidden">
              <div
                className="bg-dark-accent h-full transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={stopFocus} className="btn-danger px-6">
              Stop Session
            </button>
          </div>
          <p className="text-dark-muted text-sm">
            Stay focused. You've got this! 💪
          </p>
        </div>
      )}
    </div>
  );
}

