import { Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/dashboard' 
}: RoleBasedRouteProps) {
  const { isAuthenticated, loading, profileLoading, hasRole, userProfile } = useAuth();
  
  // Proteção anti-loop: timeout máximo para loading
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTimedOut = useRef(false);

  // Para roles críticos (admin/preparador), identificar se é um caso especial
  const isCriticalRole = allowedRoles.some(role => ['admin', 'preparador'].includes(role));

  // Configurar timeout para loading apenas uma vez na montagem
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []); // Executar apenas uma vez na montagem

  // Configurar timeout em useEffect próprio para evitar re-mount
  useEffect(() => {
    // Proteção anti-loop: timeout de 8 segundos para loading (maior que PrivateRoute devido à complexidade)
    if ((loading || profileLoading) && !hasTimedOut.current) {
      loadingTimeoutRef.current = setTimeout(() => {
        hasTimedOut.current = true;
        
        // Para roles críticos, tentar redirecionar para área apropriada
        if (isCriticalRole && isAuthenticated) {
          window.location.href = userProfile?.role === 'admin' ? '/admin/dashboard' : '/preparador/dashboard';
        } else {
          // Fallback para área normal
          window.location.href = '/dashboard';
        }
      }, 8000);
    }

    // Limpar timeout quando loading termina
    if (!loading && !profileLoading && loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      hasTimedOut.current = false;
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, profileLoading, isAuthenticated, userProfile, isCriticalRole]);

  // Aguardar tanto o carregamento da sessão quanto do perfil
  if ((loading || profileLoading) && !hasTimedOut.current) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          {isCriticalRole && (
            <p className="text-sm text-gray-600">
              Carregando perfil administrativo...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Verificar se o perfil foi carregado completamente
  if (!userProfile) {
    return <Navigate to="/dashboard" />;
  }

  const userHasAccess = hasRole(allowedRoles);
  if (!userHasAccess) {
    return <Navigate to={redirectTo} />;
  }

  return <>{children}</>;
}