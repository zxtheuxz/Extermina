import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { encontrarMetodoTreino } from '../utils/metodosTreino';
import MetodoTreinoModal from './MetodoTreinoModal';

interface BotaoMetodoTreinoProps {
  nomeExercicio: string;
}

export const BotaoMetodoTreino: React.FC<BotaoMetodoTreinoProps> = ({ nomeExercicio }) => {
  const [modalAberto, setModalAberto] = useState(false);
  
  // Encontrar o método de treino no nome do exercício
  const metodoTreino = encontrarMetodoTreino(nomeExercicio);
  
  // Se não encontrar método, não renderiza nada
  if (!metodoTreino) return null;
  
  return (
    <>
      <button
        onClick={() => setModalAberto(true)}
        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md flex items-center transition-colors flex-shrink-0"
        title={`Ver informações sobre o método ${metodoTreino.nome}`}
      >
        <Info className="w-3 h-3 mr-1" /> MÉTODO
      </button>
      
      {modalAberto && (
        <MetodoTreinoModal
          metodo={metodoTreino}
          onClose={() => setModalAberto(false)}
        />
      )}
    </>
  );
};

export default BotaoMetodoTreino; 