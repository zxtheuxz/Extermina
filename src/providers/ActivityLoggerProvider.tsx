import React, { useEffect, createContext, useContext, useRef } from 'react';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { useAuth } from '../contexts/AuthContext';

const ActivityLoggerContext = createContext<ReturnType<typeof useActivityLogger> | null>(null);

export function useActivityLoggerContext() {
  const context = useContext(ActivityLoggerContext);
  if (!context) {
    throw new Error('useActivityLoggerContext deve ser usado dentro de ActivityLoggerProvider');
  }
  return context;
}

interface ActivityLoggerProviderProps {
  children: React.ReactNode;
}

export function ActivityLoggerProvider({ children }: ActivityLoggerProviderProps) {
  const activityLogger = useActivityLogger();
  const { user, isAuthenticated } = useAuth();
  
  // Usar refs para evitar logs duplicados
  const hasLoggedLogin = useRef(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    // Registrar login quando usuário se autentica
    if (isAuthenticated && user) {
      // Verificar se já logou para este usuário
      if (user.id !== lastUserId.current) {
        console.log('ActivityLogger: Novo usuário autenticado, registrando login');
        lastUserId.current = user.id;
        hasLoggedLogin.current = false;
      }

      // Só registrar se ainda não foi registrado para este usuário
      if (!hasLoggedLogin.current) {
        hasLoggedLogin.current = true;
        
        // Aguardar um pouco para garantir que o contexto está estabilizado
        setTimeout(async () => {
          try {
            await activityLogger.logLogin();
            console.log('ActivityLogger: Login registrado com sucesso');
          } catch (error) {
            console.error('Erro ao registrar login:', error);
            // Permitir nova tentativa em caso de erro
            hasLoggedLogin.current = false;
          }
        }, 1000);
      }
    } else if (!isAuthenticated) {
      // Reset quando usuário faz logout
      hasLoggedLogin.current = false;
      lastUserId.current = null;
    }
  }, [isAuthenticated, user]); // REMOVIDO activityLogger da dependência

  useEffect(() => {
    // Interceptar antes do unload da página para registrar logout
    const handleBeforeUnload = async () => {
      if (user) {
        // Registrar que o usuário está saindo (fechando aba/navegador)
        navigator.sendBeacon('/api/log-activity', JSON.stringify({
          action: 'page_unload',
          userId: user.id
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  return (
    <ActivityLoggerContext.Provider value={activityLogger}>
      {children}
    </ActivityLoggerContext.Provider>
  );
}