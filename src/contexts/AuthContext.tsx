import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useWhyDidYouUpdate } from '../hooks/useWhyDidYouUpdate';

interface UserProfile {
  user_id: string;
  role: string;
  nome_completo?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  getDefaultRouteForRole: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache global simples (sem singleton que impede re-inicialização)
let globalProfile: UserProfile | null = null;

// Singleton robusto para StrictMode
let globalAuthState = {
  initialized: false,
  initPromise: null as Promise<void> | null,
  subscription: null as any,
  activeInstances: 0
};

// Controle de eventos Supabase duplicados
let lastEventTime = 0;
let lastEventData: { event: string; userId?: string } | null = null;
const EVENT_DEBOUNCE_MS = 500; // 500ms debounce entre eventos

// Função para filtrar eventos duplicados do Supabase
function shouldProcessAuthEvent(event: string, session: any): boolean {
  const now = Date.now();
  const currentEventData = {
    event,
    userId: session?.user?.id
  };

  // Verificar debounce temporal
  if (now - lastEventTime < EVENT_DEBOUNCE_MS) {
    return false;
  }

  // Verificar se é evento idêntico ao anterior
  if (lastEventData && 
      lastEventData.event === currentEventData.event && 
      lastEventData.userId === currentEventData.userId) {
    return false;
  }

  // Ignorar eventos SIGNED_IN repetidos para mesmo usuário
  if (event === 'SIGNED_IN' && lastEventData?.event === 'SIGNED_IN' && 
      lastEventData.userId === currentEventData.userId) {
    return false;
  }

  // Atualizar dados do último evento
  lastEventTime = now;
  lastEventData = currentEventData;
  
  return true;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Cache localStorage simples
  const PROFILE_CACHE_KEY = 'user_profile_cache';
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

  const saveProfileToCache = (profile: UserProfile) => {
    try {
      const cacheData = {
        profile,
        timestamp: Date.now()
      };
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
      globalProfile = profile;
    } catch (error) {
      console.warn('AuthContext: Erro ao salvar perfil no cache:', error);
    }
  };

  const getProfileFromCache = (userId: string): UserProfile | null => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (!cached) return globalProfile;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      // Verificar se cache expirou ou é de outro usuário
      if (age > CACHE_DURATION || cacheData.profile.user_id !== userId) {
        localStorage.removeItem(PROFILE_CACHE_KEY);
        globalProfile = null;
        return null;
      }

      globalProfile = cacheData.profile;
      return cacheData.profile;
    } catch (error) {
      console.warn('AuthContext: Erro ao recuperar perfil do cache:', error);
      localStorage.removeItem(PROFILE_CACHE_KEY);
      globalProfile = null;
      return null;
    }
  };

  const clearProfileCache = () => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      globalProfile = null;
    } catch (error) {
      console.warn('AuthContext: Erro ao limpar cache:', error);
    }
  };

  // Função simples para buscar perfil com timeout
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    // Criar timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout na busca de perfil'));
      }, 5000);
    });
    
    // Criar busca promise
    const fetchPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('perfis')
          .select('user_id, role, nome_completo')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.warn('Erro ao buscar perfil:', error);
          // Retorna perfil padrão se não encontrar
          return {
            user_id: userId,
            role: 'usuario'
          };
        }

        return data;
      } catch (error) {
        console.error('Erro inesperado ao buscar perfil:', error);
        throw error;
      }
    })();
    
    // Race entre busca e timeout
    try {
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      console.error('AuthContext: Falha na busca de perfil:', error);
      return {
        user_id: userId,
        role: 'usuario'
      };
    }
  };

  // Função simples para atualizar estado
  const updateUserState = async (newSession: Session | null) => {
    try {
      if (newSession?.user) {
        setUser(newSession.user);
        setSession(newSession);
        setProfileLoading(true);
        
        // Primeiro, tentar recuperar do cache
        const cachedProfile = getProfileFromCache(newSession.user.id);
        if (cachedProfile) {
          setUserProfile(cachedProfile);
          setProfileLoading(false);
          setLoading(false);
        } else {
          // Só buscar do banco se não tem cache
          try {
            const profile = await fetchUserProfile(newSession.user.id);
            if (profile) {
              setUserProfile(profile);
              saveProfileToCache(profile);
            }
          } catch (error) {
            console.warn('Erro ao buscar perfil:', error);
            // Usar fallback se não conseguir buscar
            const fallbackProfile = {
              user_id: newSession.user.id,
              role: 'usuario'
            };
            setUserProfile(fallbackProfile);
          } finally {
            setProfileLoading(false);
          }
        }
      } else {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        setProfileLoading(false);
        clearProfileCache();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao atualizar estado:', error);
      setLoading(false);
      setProfileLoading(false);
    }
  };

  // Configurar listener de autenticação (singleton robusto)
  useEffect(() => {
    let isMounted = true;
    globalAuthState.activeInstances++;

    const initializeAuth = async () => {
      // Usar singleton global
      if (globalAuthState.initialized) {
        // Só atualizar estado local
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (isMounted) {
            await updateUserState(currentSession);
          }
        } catch (error) {
          console.error('Erro ao reutilizar sessão:', error);
          if (isMounted) {
            setLoading(false);
          }
        }
        return;
      }

      // Se há inicialização em progresso, aguardar
      if (globalAuthState.initPromise) {
        await globalAuthState.initPromise;
        return;
      }

      // Criar nova inicialização
      globalAuthState.initPromise = (async () => {
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('AuthContext: Erro ao obter sessão:', error);
          }

          if (isMounted) {
            await updateUserState(currentSession);
          }

          globalAuthState.initialized = true;
        } catch (error) {
          console.error('AuthContext: Erro na inicialização:', error);
          if (isMounted) {
            setLoading(false);
          }
        } finally {
          globalAuthState.initPromise = null;
        }
      })();

      await globalAuthState.initPromise;
    };

    // Configurar listener de mudanças de estado com filtro de duplicatas
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Filtrar eventos duplicados e desnecessários
        if (!shouldProcessAuthEvent(event, newSession)) {
          return; // Ignorar evento
        }
        
        if (isMounted) {
          await updateUserState(newSession);
        }
      }
    );

    // Inicializar apenas uma vez
    initializeAuth();

    // Armazenar subscription no estado global
    globalAuthState.subscription = subscription;

    // Cleanup robusto compatível com StrictMode
    return () => {
      isMounted = false;
      globalAuthState.activeInstances--;
      
      // Só limpar completamente quando não há mais instâncias ativas
      if (globalAuthState.activeInstances <= 0) {
        if (globalAuthState.subscription) {
          globalAuthState.subscription.unsubscribe();
          globalAuthState.subscription = null;
        }
        // Reset completo do estado global para permitir nova inicialização
        globalAuthState.initialized = false;
        globalAuthState.initPromise = null;
        globalAuthState.activeInstances = 0;
        
        // Limpar também os dados de eventos
        lastEventTime = 0;
        lastEventData = null;
      } else {
        // Só desconectar subscription local sem afetar o estado global
        subscription.unsubscribe();
      }
    };
  }, []); // Sem dependências para evitar loops

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthContext: Erro no login:', error);
        setLoading(false);
        return { user: null, error };
      }

      // O listener onAuthStateChange irá atualizar o estado automaticamente
      return { user: data.user, error: null };
    } catch (error) {
      console.error('AuthContext: Erro inesperado no login:', error);
      setLoading(false);
      return { user: null, error: error as AuthError };
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Erro no logout:', error);
      }

      // Limpar estado local imediatamente
      setUser(null);
      setSession(null);
      setUserProfile(null);
      clearProfileCache();
    } catch (error) {
      console.error('AuthContext: Erro inesperado no logout:', error);
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
      setUserProfile(null);
      clearProfileCache();
    } finally {
      setLoading(false);
    }
  };

  // Função para refresh manual da sessão
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthContext: Erro no refresh da sessão:', error);
        await signOut();
        return;
      }

      if (data.session) {
        await updateUserState(data.session);
      }
    } catch (error) {
      console.error('AuthContext: Erro inesperado no refresh:', error);
      await signOut();
    }
  };

  // Função para verificar se usuário tem determinado role
  const hasRole = (roles: string[]): boolean => {
    if (!userProfile) return false;
    return roles.includes(userProfile.role);
  };

  // Função para obter a rota padrão baseada no role
  const getDefaultRouteForRole = (): string => {
    if (!userProfile) return '/dashboard';
    
    switch (userProfile.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'preparador':
        return '/preparador/dashboard';
      case 'cliente':
      case 'usuario':
      default:
        return '/dashboard';
    }
  };

  // Debug para rastrear mudanças
  useWhyDidYouUpdate('AuthContext', {
    user: user?.id, // Só o ID para não poluir
    session: session?.user?.id, // Só o ID para não poluir  
    userProfile,
    loading,
    profileLoading,
    isAuthenticated: !!user
  });

  // Memoizar value para evitar re-renders desnecessários
  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    userProfile,
    loading,
    profileLoading,
    signIn,
    signOut,
    refreshSession,
    isAuthenticated: !!user,
    hasRole,
    getDefaultRouteForRole,
  }), [user, session, userProfile, loading, profileLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}