import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Redirect legacy /presentations/shared/:token to new /present/shared/:token
export default function SharedPresentationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate(`/present/shared/${token}`, { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-text-muted">Redirecting to presentation...</p>
      </div>
    </div>
  );
}
