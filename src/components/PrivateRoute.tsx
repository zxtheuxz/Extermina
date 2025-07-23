import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Proteção anti-loop: timeout máximo para loading
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTimedOut = useRef(false);

  useEffect(() => {
    console.log("PrivateRoute montado - usando AuthContext");
    
    // Garantir que o fundo seja claro com gradiente
    document.documentElement.style.background = 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)';
    document.documentElement.style.backgroundColor = '#f5f7ff';
    document.body.style.background = 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)';
    document.body.style.backgroundColor = '#f5f7ff';
    
    // Proteção anti-loop: timeout de 10 segundos para loading
    if (loading && !hasTimedOut.current) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn("PrivateRoute: Timeout de loading detectado - possível loop!");
        hasTimedOut.current = true;
        // Forçar redirecionamento para login após timeout
        window.location.href = '/login';
      }, 10000);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading]);

  // Reset timeout quando loading termina
  useEffect(() => {
    if (!loading && loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      hasTimedOut.current = false;
    }
  }, [loading]);

  if (loading && !hasTimedOut.current) {
    console.log("PrivateRoute em carregamento");
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)'}}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <div className="ml-4 text-gray-600">
          Carregando...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Usuário não autenticado, redirecionando para login");
    return <Navigate to="/login" />;
  }

  console.log("Usuário autenticado, renderizando conteúdo protegido");
  return <>{children}</>;
} 