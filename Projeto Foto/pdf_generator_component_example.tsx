import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

interface UserData {
  name: string;
  age: number;
  height: number;
  weight: number;
  gender: 'M' | 'F';
}

interface BodyAnalysis {
  fatMass: number;
  leanMass: number;
  bodyFatPercentage: number;
  bmi: number;
  bmr: number;
  waterPercentage: number;
  measurements: {
    waist: number;
    hip: number;
    arm: number;
    forearm: number;
    thigh: number;
    calf: number;
  };
}

const PDFGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Dados de exemplo baseados no PDF SHAPED
  const exampleUser: UserData = {
    name: "Matheus Henrique",
    age: 28,
    height: 171,
    weight: 85,
    gender: 'M'
  };

  const exampleAnalysis: BodyAnalysis = {
    fatMass: 21.7,
    leanMass: 63.3,
    bodyFatPercentage: 25.6,
    bmi: 29.0,
    bmr: 1892.2,
    waterPercentage: 54.3,
    measurements: {
      waist: 93.0,
      hip: 105.3,
      arm: 35.1,
      forearm: 30.7,
      thigh: 57.3,
      calf: 39.6
    }
  };

  const generateHealthReport = (user: UserData, analysis: BodyAnalysis) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Cores do SHAPED
    const primaryGreen = [46, 125, 50];
    const lightGreen = [165, 214, 167];
    const darkGreen = [27, 94, 32];

    // PÁGINA 1 - Análise Global
    const drawPage1 = () => {
      // Header
      doc.setFillColor(...primaryGreen);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Logo SHAPED (simulado)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('SHAPED', 20, 18);
      
      // Dados do profissional
      doc.setFontSize(10);
      doc.text('Alanderson Ribeiro silva', pageWidth - 20, 8, { align: 'right' });
      doc.text('Fisioterapeuta 197543', pageWidth - 20, 13, { align: 'right' });
      
      // Dados do paciente
      doc.text(`${user.name}`, pageWidth - 20, 18, { align: 'right' });
      doc.text(`${user.gender === 'M' ? 'Masculino' : 'Feminino'} ${user.age} anos ${user.height/100}m`, pageWidth - 20, 23, { align: 'right' });

      // Título principal
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Análise global da composição corporal', 20, 40);

      // Gráfico de pizza (simulado com círculos)
      const centerX = 60;
      const centerY = 70;
      const radius = 25;
      
      // Círculo externo (massa magra - verde claro)
      doc.setFillColor(...lightGreen);
      doc.circle(centerX, centerY, radius, 'F');
      
      // Círculo interno (massa gorda - verde escuro)
      const fatAngle = (analysis.bodyFatPercentage / 100) * 360;
      doc.setFillColor(...darkGreen);
      doc.circle(centerX, centerY, radius * 0.8, 'F');

      // Peso central
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Peso: ${user.weight} kg`, centerX, centerY, { align: 'center' });

      // Percentuais
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`${analysis.bodyFatPercentage}%`, centerX - 35, centerY - 15);
      doc.text(`${(100 - analysis.bodyFatPercentage).toFixed(1)}%`, centerX + 20, centerY + 20);

      // Detalhes da composição
      let yPos = 60;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`• Massa gorda: ${analysis.fatMass} kg`, 120, yPos);
      doc.setFont(undefined, 'normal');
      doc.text('Representa toda a massa de gordura presente no corpo.', 122, yPos + 5);

      yPos += 15;
      doc.setFont(undefined, 'bold');
      doc.text(`• Massa magra: ${analysis.leanMass} kg`, 120, yPos);
      doc.setFont(undefined, 'normal');
      doc.text('Representa o conjunto de músculos, ossos, órgãos e água.', 122, yPos + 5);

      yPos += 15;
      doc.text(`Água corporal: ${(analysis.leanMass * 0.723).toFixed(1)}L (${analysis.waterPercentage}%)`, 122, yPos);
      doc.setFontSize(8);
      doc.text('Predito a partir da constante hídrica de mamíferos de 72,3% de água', 122, yPos + 4);
      doc.text('em relação à massa magra.', 122, yPos + 8);

      yPos += 15;
      doc.setFontSize(10);
      doc.text(`Gasto energético de repouso: ${analysis.bmr} kcal`, 122, yPos);
      doc.setFontSize(8);
      doc.text('Predito a partir da equação de Cunningham (1980) que utiliza', 122, yPos + 4);
      doc.text('massa magra como variável.', 122, yPos + 8);

      // IMC
      yPos = 130;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Índice de massa corporal (IMC): Sobrepeso (${analysis.bmi} kg/m²)`, 20, yPos);
      
      // Escala de classificação do IMC
      doc.setFontSize(8);
      doc.text('Baixo peso: <18 kg/m²', 20, yPos + 8);
      doc.text('Eutrofia: 18 a 24,9 kg/m²', 20, yPos + 12);
      doc.text('Sobrepeso: 25 a 29,9 kg/m²', 90, yPos + 8);
      doc.text('Obesidade: >30 kg/m²', 90, yPos + 12);

      // Percentual de gordura
      yPos += 25;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Percentual de gordura: ${analysis.bodyFatPercentage}%`, 20, yPos);
      
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text('O percentual de gordura nessa avaliação tem como objetivo classificar risco', 20, yPos + 5);
      doc.text('para doenças cardiometabólicas, portanto não possui fins estéticos.', 20, yPos + 9);

      // Escala de risco (simulada)
      yPos += 20;
      const scaleWidth = 150;
      const scaleHeight = 8;
      
      // Fundo da escala
      doc.setFillColor(200, 200, 200);
      doc.rect(20, yPos, scaleWidth, scaleHeight, 'F');
      
      // Seções coloridas
      doc.setFillColor(76, 175, 80); // Verde - baixo risco
      doc.rect(20, yPos, scaleWidth * 0.3, scaleHeight, 'F');
      
      doc.setFillColor(255, 193, 7); // Amarelo - moderado
      doc.rect(20 + scaleWidth * 0.3, yPos, scaleWidth * 0.3, scaleHeight, 'F');
      
      doc.setFillColor(244, 67, 54); // Vermelho - alto risco
      doc.rect(20 + scaleWidth * 0.6, yPos, scaleWidth * 0.4, scaleHeight, 'F');

      // Indicador na escala
      const riskPosition = (analysis.bodyFatPercentage / 35) * scaleWidth; // Assumindo max 35%
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(2);
      doc.line(20 + riskPosition, yPos - 2, 20 + riskPosition, yPos + scaleHeight + 2);

      // Labels da escala
      doc.setFontSize(8);
      doc.text('Atenção', 25, yPos + 15);
      doc.text('Baixo risco', 65, yPos + 15);
      doc.text('Moderado', 110, yPos + 15);
      doc.text('Alto risco', 155, yPos + 15);

      // Resultado
      yPos += 25;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(244, 67, 54);
      doc.text('Resultado: Alto risco', 20, yPos);

      // Índices
      yPos += 20;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      const leanMassIndex = analysis.leanMass / Math.pow(user.height / 100, 2);
      const fatMassIndex = analysis.fatMass / Math.pow(user.height / 100, 2);
      
      doc.text(`Índice de massa magra: ${leanMassIndex.toFixed(1)} kg/m²`, 20, yPos);
      doc.text(`Índice de massa gorda: ${fatMassIndex.toFixed(1)} kg/m²`, 120, yPos);
      
      yPos += 8;
      doc.setFontSize(8);
      doc.setTextColor(76, 175, 80);
      doc.text('Resultado: Adequado', 20, yPos);
      doc.setTextColor(244, 67, 54);
      doc.text('Resultado: Alto', 120, yPos);

      // Disclaimer
      yPos = pageHeight - 40;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(7);
      doc.text('Avaliação por fotos', 20, yPos);
      doc.text('Os dados gerados por esta avaliação não têm poder diagnóstico.', 20, yPos + 5);
      doc.text('Eles devem ser interpretados em conjunto com a história clínica do paciente.', 20, yPos + 9);
      doc.text('Poses, vestimentas e a qualidade da imagem podem influenciar os resultados.', 20, yPos + 13);
      doc.text('A avaliação final e a interpretação são de responsabilidade do profissional de saúde.', 20, yPos + 17);
    };

    // PÁGINA 2 - Medidas e Perímetros
    const drawPage2 = () => {
      doc.addPage();
      
      // Header igual à página 1
      doc.setFillColor(...primaryGreen);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('SHAPED', 20, 18);
      
      doc.setFontSize(10);
      doc.text('Alanderson Ribeiro silva', pageWidth - 20, 8, { align: 'right' });
      doc.text('Fisioterapeuta 197543', pageWidth - 20, 13, { align: 'right' });
      doc.text(`${user.name}`, pageWidth - 20, 18, { align: 'right' });
      doc.text(`${user.gender === 'M' ? 'Masculino' : 'Feminino'} ${user.age} anos ${user.height/100}m`, pageWidth - 20, 23, { align: 'right' });

      // Figura corporal (simulada)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      
      let yPos = 50;
      
      // Medidas principais
      const measurements = [
        { name: 'Braço', value: analysis.measurements.arm },
        { name: 'Antebraço', value: analysis.measurements.forearm },
        { name: 'Coxa', value: analysis.measurements.thigh },
        { name: 'Panturrilha', value: analysis.measurements.calf },
        { name: 'Cintura', value: analysis.measurements.waist },
        { name: 'Quadril', value: analysis.measurements.hip }
      ];

      measurements.forEach((measurement, index) => {
        const x = 20 + (index % 2) * 90;
        const y = yPos + Math.floor(index / 2) * 15;
        doc.setFontSize(10);
        doc.text(`${measurement.name}:`, x, y);
        doc.setFont(undefined, 'bold');
        doc.text(`${measurement.value} cm`, x + 25, y);
        doc.setFont(undefined, 'normal');
      });

      // Razões e índices
      yPos += 80;
      const waistHeightRatio = analysis.measurements.waist / user.height;
      const waistHipRatio = analysis.measurements.waist / analysis.measurements.hip;
      const conicityIndex = (analysis.measurements.waist / 100) / 
                           (2 * Math.sqrt(Math.PI * (analysis.measurements.hip / 100)));

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Cintura: ${analysis.measurements.waist} cm`, 20, yPos);
      doc.text(`Quadril: ${analysis.measurements.hip} cm`, 20, yPos + 15);
      doc.text(`Razão cintura-estatura: ${waistHeightRatio.toFixed(2)}`, 20, yPos + 30);
      doc.text(`Razão cintura/quadril: ${waistHipRatio.toFixed(2)}`, 20, yPos + 45);
      doc.text(`Índice de conicidade: ${conicityIndex.toFixed(2)}`, 20, yPos + 75);

      // Resumo dos indicadores
      yPos += 100;
      doc.setFontSize(10);
      const indicators = [
        { name: 'Percentual de gordura', result: 'Alto risco' },
        { name: 'Índice de massa magra', result: 'Adequado' },
        { name: 'Razão cintura/quadril', result: 'Adequado' },
        { name: 'Índice de massa gorda', result: 'Alto' },
        { name: 'Razão cintura/estatura', result: 'Moderado' },
        { name: 'Índice de conicidade', result: 'Adequado' }
      ];

      indicators.forEach((indicator, index) => {
        const x = 20 + (index % 2) * 90;
        const y = yPos + Math.floor(index / 2) * 15;
        doc.text(indicator.name, x, y);
        doc.setFont(undefined, 'bold');
        doc.text(indicator.result, x, y + 5);
        doc.setFont(undefined, 'normal');
      });

      // Shaped Score
      yPos += 80;
      doc.setFillColor(...lightGreen);
      doc.rect(20, yPos, 60, 30, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Shaped Score', 25, yPos + 10);
      doc.setFontSize(20);
      doc.text('50/100', 25, yPos + 25);

      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text('O score é gerado com base nos indicadores de composição', 90, yPos + 10);
      doc.text('corporal. Quanto maior o score, melhor a condição física.', 90, yPos + 15);
      doc.text('Utilize-o como complemento à avaliação clínica.', 90, yPos + 20);

      // Disclaimer página 2
      yPos = pageHeight - 20;
      doc.setFontSize(7);
      doc.text('Os dados gerados por esta avaliação não têm poder diagnóstico.', 20, yPos);
      doc.text('Eles devem ser interpretados em conjunto com a história clínica do paciente.', 20, yPos + 4);
      doc.text('A avaliação final e a interpretação são de responsabilidade do profissional de saúde.', 20, yPos + 8);
    };

    // PÁGINA 3 - Histórico
    const drawPage3 = () => {
      doc.addPage();
      
      // Header
      doc.setFillColor(...primaryGreen);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('SHAPED', 20, 18);
      
      doc.setFontSize(10);
      doc.text('Alanderson Ribeiro silva', pageWidth - 20, 8, { align: 'right' });
      doc.text('Fisioterapeuta 197543', pageWidth - 20, 13, { align: 'right' });
      doc.text(`${user.name}`, pageWidth - 20, 18, { align: 'right' });
      doc.text(`${user.gender === 'M' ? 'Masculino' : 'Feminino'} ${user.age} anos ${user.height/100}m`, pageWidth - 20, 23, { align: 'right' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Histórico de avaliações', 20, 40);

      // Gráficos de evolução (simulados com pontos)
      let yPos = 60;
      const metrics = [
        { name: 'Peso', value: user.weight, unit: 'kg' },
        { name: 'Percentual de gordura', value: analysis.bodyFatPercentage, unit: '%' },
        { name: 'Massa magra', value: analysis.leanMass, unit: 'kg' },
        { name: 'Massa gorda', value: analysis.fatMass, unit: 'kg' }
      ];

      metrics.forEach((metric, index) => {
        const x = 20 + (index % 2) * 90;
        const y = yPos + Math.floor(index / 2) * 40;
        
        doc.setFontSize(10);
        doc.setTextColor(76, 175, 80);
        doc.setFont(undefined, 'bold');
        doc.text(`${metric.name}: ${metric.value} ${metric.unit}`, x, y);
        
        // Ponto no gráfico (simulado)
        doc.setFillColor(...primaryGreen);
        doc.circle(x + 30, y + 15, 2, 'F');
        
        // Linha base do gráfico
        doc.setDrawColor(200, 200, 200);
        doc.line(x, y + 25, x + 60, y + 25);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text('jul', x + 28, y + 30);
      });

      // Tabela de referências
      yPos += 100;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Indicadores', 20, yPos);
      doc.text('Referência', 80, yPos);
      doc.text('22/07/2025', 140, yPos);

      const referenceData = [
        { indicator: 'Índice de massa gorda', reference: '< 4,4 kg/m²', current: `${fatMassIndex.toFixed(1)} kg/m²` },
        { indicator: 'Índice de massa magra', reference: '> 17,8 kg/m²', current: `${leanMassIndex.toFixed(1)} kg/m²` },
        { indicator: 'Razão cintura/estatura', reference: '< 0,5', current: waistHeightRatio.toFixed(1) },
        { indicator: 'Razão cintura/quadril', reference: '< 0,9', current: waistHipRatio.toFixed(1) },
        { indicator: 'Índice de conicidade', reference: '< 1,25', current: conicityIndex.toFixed(1) }
      ];

      yPos += 10;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      referenceData.forEach((row, index) => {
        const y = yPos + (index + 1) * 8;
        doc.text(row.indicator, 20, y);
        doc.text(row.reference, 80, y);
        doc.text(row.current, 140, y);
      });

      // Aviso final
      yPos = pageHeight - 15;
      doc.setFontSize(7);
      doc.text('Os dados gerados por esta avaliação não têm poder diagnóstico.', 20, yPos);
      doc.text('Eles devem ser interpretados em conjunto com a história clínica do paciente.', 20, yPos + 4);
      doc.text('A avaliação final é de responsabilidade do profissional de saúde.', 20, yPos + 8);
    };

    // Gerar todas as páginas
    drawPage1();
    drawPage2();
    drawPage3();

    return doc;
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = generateHealthReport(exampleUser, exampleAnalysis);
      
      // Adicionar nota sobre exemplo
      doc.addPage();
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Relatório de Exemplo', 20, 40);
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Este é um PDF de exemplo baseado nos dados do paciente Matheus Henrique.', 20, 60);
      doc.text('Para mais informações sobre o formato completo do relatório,', 20, 75);
      doc.text('consulte o arquivo PDF com nome "Matheus Henrique" em anexo.', 20, 90);
      
      doc.setFontSize(10);
      doc.text('Este exemplo demonstra a estrutura e formatação que será utilizada', 20, 110);
      doc.text('para gerar relatórios reais de análise corporal baseados em:', 20, 125);
      doc.text('• Detecção automática de pontos anatômicos via MediaPipe', 25, 140);
      doc.text('• Cálculos científicos de composição corporal', 25, 155);
      doc.text('• Classificações de risco cardiometabólico', 25, 170);
      doc.text('• Métricas de saúde baseadas em literatura científica', 25, 185);

      // Salvar o PDF
      doc.save('relatorio_analise_corporal_exemplo.pdf');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Gerador de Relatório de Análise Corporal
        </h1>
        <p className="text-gray-600 mb-6">
          Baseado no sistema SHAPED - Análise completa de composição corporal
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Dados do Exemplo</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Nome:</strong> {exampleUser.name}</p>
              <p><strong>Idade:</strong> {exampleUser.age} anos</p>
              <p><strong>Altura:</strong> {exampleUser.height} cm</p>
            </div>
            <div>
              <p><strong>Peso:</strong> {exampleUser.weight} kg</p>
              <p><strong>Sexo:</strong> {exampleUser.gender === 'M' ? 'Masculino' : 'Feminino'}</p>
              <p><strong>IMC:</strong> {exampleAnalysis.bmi} kg/m²</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-2">📊 Principais Métricas</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p><strong>% Gordura:</strong> {exampleAnalysis.bodyFatPercentage}%</p>
              <p><strong>Massa Gorda:</strong> {exampleAnalysis.fatMass} kg</p>
            </div>
            <div>
              <p><strong>Massa Magra:</strong> {exampleAnalysis.leanMass} kg</p>
              <p><strong>TMB:</strong> {exampleAnalysis.bmr} kcal</p>
            </div>
            <div>
              <p><strong>Cintura:</strong> {exampleAnalysis.measurements.waist} cm</p>
              <p><strong>Quadril:</strong> {exampleAnalysis.measurements.hip} cm</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Gerando PDF...
            </>
          ) : (
            <>
              📄 Gerar Relatório PDF de Exemplo
            </>
          )}
        </button>

        <div className="mt-6 text-sm text-gray-500">
          <p>
            💡 <strong>Nota:</strong> Este é um PDF de exemplo baseado nos dados reais do SHAPED.
          </p>
          <p>
            Para ver o relatório completo original, consulte o arquivo <strong>"Matheus Henrique.pdf"</strong>.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">🔧 Recursos Implementados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Página 1 - Análise Global:</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Header com logo e dados do paciente</li>
              <li>• Gráfico de composição corporal</li>
              <li>• Métricas: peso, massa gorda/magra, água</li>
              <li>• IMC com classificação</li>
              <li>• Escala de risco para % gordura</li>
              <li>• Índices de massa magra e gorda</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Páginas 2-3:</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Medidas corporais detalhadas</li>
              <li>• Razões cintura/quadril e cintura/estatura</li>
              <li>• Índice de conicidade</li>
              <li>• Resumo de indicadores</li>
              <li>• Shaped Score calculado</li>
              <li>• Histórico de avaliações</li>
              <li>• Tabela de referências</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFGenerator;