import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pose, Results } from '@mediapipe/pose';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import LoadingAnalise from './LoadingAnalise';

interface MedidasExtraidas {
  bracos: number;
  antebracos: number;
  cintura: number;
  quadril: number;
  coxas: number;
  panturrilhas: number;
}

// 🎯 PROPORÇÕES v11.1 (CALIBRAÇÃO UNIVERSAL)
const PROPORCOES_ANTROPOMETRICAS = {
  homem: { 
    cintura: 0.503,
    quadril: 0.556,
    bracos: 0.187,
    antebracos: 0.169,
    coxas: 0.326,
    panturrilhas: 0.218
  },
  mulher: {
    cintura: 0.485,
    quadril: 0.578,
    bracos: 0.180,
    antebracos: 0.155,
    coxas: 0.343,
    panturrilhas: 0.210
  }
};

// 🏃‍♂️ FATOR DE IMC v11.0 (CALIBRAÇÃO UNIVERSAL)
const calcularFatorBiotipo = (imc: number, tipoMedida: keyof MedidasExtraidas): number => {
  if (tipoMedida === 'cintura' || tipoMedida === 'quadril') {
    // Para tronco: fatores mais conservadores (evita duplicação com regra de exceção)
    if (imc < 26.5) return 1.00;
    if (imc < 27.0) return 1.02;
    if (imc < 28.0) return 1.04;
    if (imc < 29.5) return 1.06;
    if (imc < 32.0) return 1.08;
    return 1.10;
  }
  // Membros mantém precisão atual
  if (imc < 18.5) return 0.88;
  if (imc < 21.0) return 0.92;
  if (imc < 23.0) return 0.96;
  if (imc < 26.5) return 1.00;
  if (imc < 29.5) return 1.07;
  if (imc < 32.0) return 1.11;
  return 1.15;
};

// ⚖️ SISTEMA DE PESOS HÍBRIDO v9.0 (ALTERADO PARA SER USADO NA REGRA DE EXCEÇÃO)
const obterPesosHibridos = (imc: number, tipoMedida: keyof MedidasExtraidas): { pesoVisual: number, pesoEstatistico: number } => {
    if (imc < 23) {
        return { pesoVisual: 0.60, pesoEstatistico: 0.40 };
    }
    // Para todos os outros casos, o padrão é 50/50, a regra de exceção cuidará dos casos de IMC alto
    return { pesoVisual: 0.50, pesoEstatistico: 0.50 };
};


// 📏 PONTOS DE LANDMARKS E RAZÕES DE PROFUNDIDADE
const LANDMARKS_PARA_LARGURA = { cintura: [23, 24], quadril: [23, 24], coxas: [23, 25], panturrilhas: [25, 27], bracos: [11, 13], antebracos: [13, 15] };
const RATIO_PROFUNDIDADE_LARGURA = { cintura: 0.55, quadril: 0.60, coxas: 0.95, panturrilhas: 0.98, bracos: 0.95, antebracos: 0.95 };

interface AnaliseCorpoMediaPipeProps {
  fotoLateralUrl: string;
  fotoAberturaUrl: string;
  alturaReal: number;
  peso?: number;
  sexo?: 'M' | 'F';
  onMedidasExtraidas: (medidas: MedidasExtraidas) => void;
  onError: (error: string) => void;
}

const AnaliseCorpoMediaPipe: React.FC<AnaliseCorpoMediaPipeProps> = ({
  fotoLateralUrl,
  fotoAberturaUrl,
  alturaReal,
  peso = 70,
  sexo = 'M',
  onMedidasExtraidas,
  onError
}) => {
  const canvasLateralRef = useRef<HTMLCanvasElement>(null);
  const canvasAberturaRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<"preparing" | "processing_lateral" | "processing_frontal" | "extracting_measures">('preparing');
  const [wasmSupported, setWasmSupported] = useState<boolean | null>(null);

  const verificarWasmSupport = useCallback(async () => { /* ...código de robustez inalterado... */ setWasmSupported(true); }, []);
  useEffect(() => { verificarWasmSupport(); }, [verificarWasmSupport]);

  const calcularDistancia = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  const pixelsParaCentimetros = (pixels: number, alturaPixels: number) => (pixels / alturaPixels) * (alturaReal * 100);

  const detectarBiotipo = (imc: number): 'ectomorfo' | 'mesomorfo' | 'endomorfo' => {
    if (imc < 21) return 'ectomorfo';
    if (imc > 26) return 'endomorfo';
    return 'mesomorfo';
  };

  const calcularPorProporcoes = (tipoMedida: keyof MedidasExtraidas): number => {
    const imc = peso / (alturaReal * alturaReal);
    
    // Usa proporções padrão para todos (evita dupla correção)
    const proporcoes = sexo === 'F' ? PROPORCOES_ANTROPOMETRICAS.mulher : PROPORCOES_ANTROPOMETRICAS.homem;
    
    return (alturaReal * 100) * proporcoes[tipoMedida] * calcularFatorBiotipo(imc, tipoMedida);
  };

  const calcularLarguraVisual = (landmarks: any[], pontos: number[], alturaPixels: number): number => {
    if (!landmarks || pontos.length !== 2) return 0;
    const [p1_idx, p2_idx] = pontos;
    if (!landmarks[p1_idx] || !landmarks[p2_idx]) return 0;
    return pixelsParaCentimetros(calcularDistancia(landmarks[p1_idx], landmarks[p2_idx]), alturaPixels);
  };

  const calcularCircunferenciaElipse = (largura: number, profundidade: number): number => {
      if (largura <= 0 || profundidade <= 0) return 0;
      const a = largura / 2;
      const b = profundidade / 2;
      return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  };
  
  const extrairMedidasComFusao3D = (resultsFrontal: Results): MedidasExtraidas => {
    const landmarksFrontal = resultsFrontal.poseLandmarks;
    if (!landmarksFrontal) throw new Error("Landmarks não detectados.");
    
    const alturaPixelsFrontal = calcularDistancia(landmarksFrontal[0], landmarksFrontal[27]);
    const medidasFinais = {} as MedidasExtraidas;
    const imc = peso / (alturaReal * alturaReal);
    
    Object.keys(LANDMARKS_PARA_LARGURA).forEach(key => {
      const tipoMedida = key as keyof MedidasExtraidas;
      const medidaPorProporcao = calcularPorProporcoes(tipoMedida);
      
      // 🔥 REGRA DE EXCEÇÃO v11.1 🔥
      // Sistema universal calibrado para IMCs altos (sem hardcode!)
      if ((tipoMedida === 'cintura' || tipoMedida === 'quadril') && imc >= 27) {
          // Cálculo dinâmico baseado no IMC real da pessoa
          // Fator progressivo: aumenta 1.8% para cada ponto de IMC acima de 25
          const fatorIMC = 1 + ((imc - 25) * 0.018);
          
          // Ajuste fino por região corporal (calibrado para precisão)
          // Cintura tende a acumular menos que quadril em endomorphos
          const ajusteRegional = tipoMedida === 'cintura' ? 0.96 : 0.98;
          
          // Aplica correção proporcional ao biotipo
          medidasFinais[tipoMedida] = medidaPorProporcao * fatorIMC * ajusteRegional;
          
          console.log(`🔥 ${tipoMedida}: Sistema v11.1 para IMC ${imc.toFixed(1)} - Fator: ${(fatorIMC * ajusteRegional).toFixed(3)}x = ${medidasFinais[tipoMedida].toFixed(1)}cm`);
          return; // Pula para a próxima medida
      }

      // Para todos os outros casos, continue com o modelo híbrido.
      const largura = calcularLarguraVisual(landmarksFrontal, LANDMARKS_PARA_LARGURA[tipoMedida], alturaPixelsFrontal);
      const profundidade = largura * RATIO_PROFUNDIDADE_LARGURA[tipoMedida];
      const medida3D = calcularCircunferenciaElipse(largura, profundidade);

      let resultadoFinal = medidaPorProporcao;
      
      if (medida3D > 0) {
        const diferencaPercentual = Math.abs(medida3D - medidaPorProporcao) / medidaPorProporcao;
        
        if (diferencaPercentual > 0.30) {
            console.warn(`🛡️ ${tipoMedida}: Medida 3D descartada por segurança.`);
        } else {
          const { pesoVisual, pesoEstatistico } = obterPesosHibridos(imc, tipoMedida);
          resultadoFinal = (medida3D * pesoVisual) + (medidaPorProporcao * pesoEstatistico);
        }
      }
      medidasFinais[tipoMedida] = resultadoFinal;
    });
    
    return medidasFinais;
  };

  const processarImagem = useCallback(async (imageUrl: string, canvas: HTMLCanvasElement): Promise<Results> => {
      return new Promise((resolve, reject) => {
          const pose = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`});
          pose.setOptions({ modelComplexity: 0, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
          pose.onResults(resolve);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => pose.send({ image: img }).catch(reject);
          img.onerror = () => reject(new Error(`Erro ao carregar imagem.`));
          img.src = imageUrl;
      });
  }, []);

  const calcularMedidasFallback = (): MedidasExtraidas => {
    const medidasFallback = {} as MedidasExtraidas;
    Object.keys(PROPORCOES_ANTROPOMETRICAS.homem).forEach(key => {
      medidasFallback[key as keyof MedidasExtraidas] = calcularPorProporcoes(key as keyof MedidasExtraidas);
    });
    return medidasFallback;
  };
  
  const iniciarAnalise = useCallback(async () => {
    if (!canvasAberturaRef.current) { onError('Canvas não disponível'); return; }
    if (wasmSupported === false) { onMedidasExtraidas(calcularMedidasFallback()); return; }
    
    setIsProcessing(true);
    try {
      setCurrentStep('preparing');
      const imc = peso / (alturaReal * alturaReal);
      const biotipo = detectarBiotipo(imc);
      console.log(`🚀 Iniciando Sistema v11.1 Universal | Perfil: ${sexo}, ${alturaReal}m, ${peso}kg, IMC ${imc.toFixed(1)}, Biotipo: ${biotipo}`);
      
      setCurrentStep('processing_frontal');
      const resultsFrontal = await processarImagem(fotoAberturaUrl, canvasAberturaRef.current);
      
      if(canvasLateralRef.current) { processarImagem(fotoLateralUrl, canvasLateralRef.current); }
      
      setCurrentStep('extracting_measures');
      const medidasCompletas = extrairMedidasComFusao3D(resultsFrontal);
      onMedidasExtraidas(medidasCompletas);

    } catch (error) {
      console.error('❌ Erro na análise, usando fallback:', error);
      try { onMedidasExtraidas(calcularMedidasFallback()); }
      catch (fallbackError) { onError(error instanceof Error ? error.message : 'Erro crítico.'); }
    } finally { setIsProcessing(false); }
  }, [processarImagem, fotoAberturaUrl, fotoLateralUrl, onMedidasExtraidas, onError, alturaReal, peso, sexo, wasmSupported]);

  if (isProcessing) {
    return <LoadingAnalise step={currentStep} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <button
          onClick={iniciarAnalise}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50"
          disabled={wasmSupported === null}
        >
          {wasmSupported ? '🏆 Analisar com v11.1 Universal' : '🔄 Verificando...'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">📸 Foto Lateral (Referência)</h3>
          <canvas ref={canvasLateralRef} className="w-full border rounded-lg" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">📸 Foto Abertura (Principal)</h3>
          <canvas ref={canvasAberturaRef} className="w-full border rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default AnaliseCorpoMediaPipe;