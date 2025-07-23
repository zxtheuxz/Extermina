import { Navigate } from 'react-router-dom';
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

  // Para roles críticos (admin/preparador), identificar se é um caso especial
  const isCriticalRole = allowedRoles.some(role => ['admin', 'preparador'].includes(role));

  // Aguardar tanto o carregamento da sessão quanto do perfil
  if (loading || profileLoading) {
    console.log("RoleBasedRoute: Aguardando carregamento", { 
      loading, 
      profileLoading, 
      isCriticalRole,
      allowedRoles 
    });
    
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
    console.log("RoleBasedRoute: Usuário não autenticado, redirecionando para login");
    return <Navigate to="/login" />;
  }

  // Verificar se o perfil foi carregado completamente
  if (!userProfile) {
    console.log("RoleBasedRoute: Perfil do usuário não carregado, redirecionando para dashboard padrão");
    return <Navigate to="/dashboard" />;
  }

  const userHasAccess = hasRole(allowedRoles);
  if (!userHasAccess) {
    console.log(`RoleBasedRoute: Usuário não tem acesso. Role: ${userProfile?.role}, Allowed: [${allowedRoles.join(', ')}], redirecionando para ${redirectTo}`);
    return <Navigate to={redirectTo} />;
  }

  console.log("RoleBasedRoute: Usuário autenticado e com acesso, renderizando conteúdo protegido", { 
    role: userProfile.role, 
    allowedRoles
  });
  return <>{children}</>;
}