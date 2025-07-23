import React from 'react';
import { ComposicaoCorporal } from '../../utils/calculosGrimaldi';

interface GraficoComposicaoCorporalProps {
  composicao: ComposicaoCorporal;
  peso: number;
}

const GraficoComposicaoCorporal: React.FC<GraficoComposicaoCorporalProps> = ({ 
  composicao, 
  peso 
}) => {
  // Calcular percentuais
  const massaMagraPercent = (composicao.massaMagra / peso) * 100;
  const massaGordaPercent = (composicao.massaGorda / peso) * 100;
  const aguaPercent = composicao.aguaCorporalPercentual;
  const outrosPercent = 100 - massaMagraPercent - massaGordaPercent;

  // Configurar segmentos do gráfico
  const segmentos = [
    {
      label: 'Massa Magra',
      valor: composicao.massaMagra,
      percentual: massaMagraPercent,
      cor: '#22C55E', // Verde
      corSecundaria: '#16A34A'
    },
    {
      label: 'Massa Gorda',
      valor: composicao.massaGorda,
      percentual: massaGordaPercent,
      cor: '#EF4444', // Vermelho
      corSecundaria: '#DC2626'
    },
    {
      label: 'Água Corporal',
      valor: composicao.aguaCorporal,
      percentual: aguaPercent,
      cor: '#3B82F6', // Azul
      corSecundaria: '#2563EB'
    },
    {
      label: 'Outros',
      valor: peso - composicao.massaMagra - composicao.massaGorda - composicao.aguaCorporal,
      percentual: outrosPercent > 0 ? outrosPercent : 0,
      cor: '#94A3B8', // Cinza
      corSecundaria: '#64748B'
    }
  ].filter(seg => seg.percentual > 0);

  // Função para criar path do arco SVG
  const criarPathArco = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const centerX = 120;
  const centerY = 120;
  const radius = 80;
  let currentAngle = 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
        Composição Corporal
      </h3>

      <div className="flex flex-col lg:flex-row items-center justify-center space-y-6 lg:space-y-0 lg:space-x-8">
        {/* Gráfico de Pizza SVG */}
        <div className="relative">
          <svg width="240" height="240" className="transform -rotate-90">
            {segmentos.map((segmento, index) => {
              const startAngle = currentAngle;
              const endAngle = currentAngle + (segmento.percentual / 100) * 360;
              const path = criarPathArco(centerX, centerY, radius, startAngle, endAngle);
              
              currentAngle = endAngle;

              return (
                <g key={index}>
                  {/* Segmento principal */}
                  <path
                    d={path}
                    fill={segmento.cor}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                  
                  {/* Gradiente interno para dar profundidade */}
                  <defs>
                    <radialGradient id={`gradient-${index}`} cx="0.3" cy="0.3">
                      <stop offset="0%" stopColor={segmento.cor} />
                      <stop offset="100%" stopColor={segmento.corSecundaria} />
                    </radialGradient>
                  </defs>
                  
                  <path
                    d={path}
                    fill={`url(#gradient-${index})`}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                </g>
              );
            })}
            
            {/* Círculo central branco */}
            <circle
              cx={centerX}
              cy={centerY}
              r="30"
              fill="white"
              stroke="#E5E7EB"
              strokeWidth="2"
            />
            
            {/* Texto central */}
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              className="text-sm font-bold fill-gray-700 dark:fill-gray-300"
              transform={`rotate(90 ${centerX} ${centerY})`}
            >
              {peso.toFixed(1)}
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              className="text-xs fill-gray-500"
              transform={`rotate(90 ${centerX} ${centerY})`}
            >
              kg
            </text>
          </svg>
        </div>

        {/* Legenda */}
        <div className="space-y-3">
          {segmentos.map((segmento, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: segmento.cor }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {segmento.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white ml-4">
                    {segmento.percentual.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {segmento.valor.toFixed(1)} kg
                  </span>
                  {/* Barra de progresso */}
                  <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 ml-2">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: segmento.cor,
                        width: `${Math.min(segmento.percentual, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {composicao.imc.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              IMC (kg/m²)
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {composicao.percentualGordura.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              % Gordura
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {composicao.tmb.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              TMB (kcal)
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {composicao.aguaCorporalPercentual.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Hidratação
            </div>
          </div>
        </div>
      </div>

      {/* Interpretação rápida */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <span className="font-medium">Interpretação:</span> {' '}
          {composicao.percentualGordura < 10 ? 'Percentual de gordura muito baixo' :
           composicao.percentualGordura < 15 ? 'Percentual de gordura baixo/atlético' :
           composicao.percentualGordura < 20 ? 'Percentual de gordura adequado' :
           composicao.percentualGordura < 25 ? 'Percentual de gordura moderado' :
           'Percentual de gordura elevado'}
          {' • '}
          {composicao.imc < 18.5 ? 'IMC: Abaixo do peso' :
           composicao.imc < 25 ? 'IMC: Peso normal' :
           composicao.imc < 30 ? 'IMC: Sobrepeso' :
           'IMC: Obesidade'}
        </p>
      </div>
    </div>
  );
};

export default GraficoComposicaoCorporal;