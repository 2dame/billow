import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth';

function App() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-dark-muted">Loading...</div>
    </div>
  );
}

export default App;

