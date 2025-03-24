// Gerenciador de PWA para capturar e gerenciar eventos de instalação
export const pwaManager = {
  init() {
    console.log('[pwaManager] Inicializando...');
    
    // Verifica se já está instalado como standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      localStorage.removeItem('pwaInstallable');
      localStorage.removeItem('pwaEvent');
      console.log('[pwaManager] PWA já está instalado como standalone');
      return;
    }

    // Verifica se o navegador já reconhece como instalado de outras formas
    if ('standalone' in window.navigator && (window.navigator as any).standalone === true) {
      localStorage.removeItem('pwaInstallable');
      localStorage.removeItem('pwaEvent');
      console.log('[pwaManager] PWA já está instalado (iOS)');
      return;
    }

    // Verifica se é mobile para priorizar a instalação
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('[pwaManager] Dispositivo móvel detectado, priorizando instalação');
      localStorage.setItem('pwaInstallableHighPriority', 'true');
    }

    // Tenta simular o evento para navegadores que não o disparam corretamente
    try {
      if ('onbeforeinstallprompt' in window) {
        console.log('[pwaManager] Browser suporta beforeinstallprompt');
        localStorage.setItem('pwaInstallable', 'true');
      }
    } catch (error) {
      console.error('[pwaManager] Erro ao verificar suporte:', error);
    }

    // Adiciona o handler globalmente com timeout para garantir que seja registrado
    setTimeout(() => {
      // Adiciona o listener para o evento beforeinstallprompt
      window.addEventListener('beforeinstallprompt', (e) => {
        // Previne o comportamento padrão
        e.preventDefault();
        // Salva que o app é instalável
        localStorage.setItem('pwaInstallable', 'true');
        // Salva o evento em storage global
        window._pwaPrompt = e;
        // Força a atualização de qualquer visualização ativa
        document.dispatchEvent(new CustomEvent('pwaPromptAvailable'));
        console.log('[pwaManager] Evento beforeinstallprompt capturado! PWA disponível para instalação');
      });
      
      console.log('[pwaManager] Listener de beforeinstallprompt registrado');
    }, 500);
    
    // Limpa quando instalado
    window.addEventListener('appinstalled', () => {
      localStorage.removeItem('pwaInstallable');
      localStorage.removeItem('pwaInstallableHighPriority');
      localStorage.removeItem('pwaEvent');
      window._pwaPrompt = null;
      document.dispatchEvent(new CustomEvent('pwaInstalled'));
      console.log('[pwaManager] PWA instalado com sucesso');
    });

    // Define um timeout para forçar a verificação periódica
    setInterval(() => {
      // Verifica se o PWA já é instalável (para casos onde o evento não dispara corretamente)
      if (!window._pwaPrompt && 'onbeforeinstallprompt' in window) {
        if (localStorage.getItem('pwaInstallable') === 'true') {
          document.dispatchEvent(new CustomEvent('pwaPromptAvailable'));
          console.log('[pwaManager] Verificação periódica: PWA é instalável');
        }
      }
    }, 3000);

    console.log('[pwaManager] Inicialização completa');
  },
  
  // Método para forçar a exibição do botão de instalação
  forceShowInstallButton() {
    // Verifica se é instalável e não está em modo standalone
    const isInstallable = 'onbeforeinstallprompt' in window && 
                         !window.matchMedia('(display-mode: standalone)').matches;
    
    // Verifica se é mobile para dar prioridade à instalação
    const isMobileHighPriority = localStorage.getItem('pwaInstallableHighPriority') === 'true';
    
    return isInstallable || isMobileHighPriority;
  },
  
  // Verifica se é um dispositivo móvel
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
};

// Adicione esta declaração para o TypeScript reconhecer a propriedade _pwaPrompt
declare global {
  interface Window {
    _pwaPrompt: any;
  }
} 