import './styles/critical.css';
import { pwaManager } from './lib/pwaManager';
// ... outros imports 

// Inicialize o gerenciador de PWA antes de montar o React
pwaManager.init();

// Resto do código de inicialização do React... 