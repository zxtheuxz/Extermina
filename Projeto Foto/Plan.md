# Plano de Projeto: Análise Corporal com Imagens do Supabase

## 🎯 Visão Geral
Desenvolver uma aplicação React + TypeScript que processe imagens já validadas pelo LLM e armazenadas no Supabase, realizando análise corporal completa similar ao sistema SHAPED.

## 🔄 Fluxo Atual do Sistema
```
WhatsApp → LLM (validação) → Supabase Storage → React App (análise) → Resultados
```

## 📋 Funcionalidades Core
- ✅ Buscar imagens aprovadas do Supabase Storage
- ✅ Detectar pontos anatômicos automaticamente
- ✅ Calcular medidas corporais precisas
- ✅ Análise de composição corporal completa
- ✅ Gerar relatório profissional
- ✅ Integração com dados do usuário no Supabase

## 🏗️ Estrutura do Projeto (Simplificada)

```
body-analysis-app/
├── src/
│   ├── components/
│   │   ├── Analysis/
│   │   │   ├── ImageProcessor.tsx
│   │   │   ├── BodyAnalyzer.tsx
│   │   │   └── MeasurementDisplay.tsx
│   │   ├── Dashboard/
│   │   │   ├── UserList.tsx
│   │   │   ├── AnalysisQueue.tsx
│   │   │   └── ResultsViewer.tsx
│   │   └── Report/
│   │       ├── ReportGenerator.tsx
│   │       ├── HealthMetrics.tsx
│   │       └── PDFExporter.tsx
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── imageAnalysis.ts
│   │   └── reportGeneration.ts
│   ├── hooks/
│   │   ├── useSupabaseImages.ts
│   │   ├── useBodyAnalysis.ts
│   │   └── useHealthCalculations.ts
│   ├── utils/
│   │   ├── poseDetection.ts
│   │   ├── measurementCalculator.ts
│   │   └── healthFormulas.ts
│   └── types/
│       ├── supabase.ts
│       ├── analysis.ts
│       └── health.ts
```

## 🛠️ Stack Tecnológico

### Frontend & Database
- **React 18 + TypeScript**
- **Supabase Client** - Conexão com database/storage
- **TailwindCSS** - Estilização

### IA e Computer Vision
- **@mediapipe/pose** - Detecção de pontos anatômicos
- **@tensorflow/tfjs** - Processamento ML
- **canvas-api** - Manipulação de imagem

### Relatórios
- **jspdf + html2canvas** - Geração de PDF
- **recharts** - Gráficos interativos

## 🗄️ Estrutura do Supabase

### Tabelas Necessárias:
```sql
-- Usuários que enviaram fotos
users (
  id: uuid primary key,
  phone: text,
  name: text,
  age: integer,
  height: integer,
  weight: integer,
  gender: text,
  created_at: timestamp
);

-- Imagens validadas pelo LLM
user_images (
  id: uuid primary key,
  user_id: uuid references users(id),
  image_url: text, -- URL do Supabase Storage
  image_type: text, -- 'front' ou 'side'
  validated_at: timestamp,
  llm_validation: jsonb -- dados da validação
);

-- Resultados das análises
body_analysis (
  id: uuid primary key,
  user_id: uuid references users(id),
  measurements: jsonb, -- todas as medidas
  composition: jsonb, -- % gordura, massa magra, etc
  health_metrics: jsonb, -- IMC, riscos, etc
  created_at: timestamp
);
```

## 🚀 Fases de Desenvolvimento

### **Fase 1: Setup Supabase + Busca de Imagens (3 dias)**

1. **Configuração Supabase**
   ```typescript
   // supabase.ts
   import { createClient } from '@supabase/supabase-js';
   
   const supabaseUrl = 'your-project-url';
   const supabaseKey = 'your-anon-key';
   
   export const supabase = createClient(supabaseUrl, supabaseKey);
   ```

2. **Hook para buscar imagens**
   ```typescript
   const useSupabaseImages = () => {
     const [pendingUsers, setPendingUsers] = useState([]);
     
     const fetchPendingAnalysis = async () => {
       const { data } = await supabase
         .from('users')
         .select(`
           *,
           user_images(*),
           body_analysis(*)
         `)
         .is('body_analysis.id', null) // Usuários sem análise
         .eq('user_images.validated_at', 'not.null'); // Com imagens validadas
       
       setPendingUsers(data);
     };
     
     return { pendingUsers, fetchPendingAnalysis };
   };
   ```

3. **Componente Dashboard**
   - Lista de usuários pendentes
   - Preview das imagens validadas
   - Botão para iniciar análise

### **Fase 2: Processamento de Imagens (5 dias)**

1. **Carregamento e pré-processamento**
   ```typescript
   const loadImageFromSupabase = async (imageUrl: string): Promise<HTMLImageElement> => {
     return new Promise((resolve, reject) => {
       const img = new Image();
       img.crossOrigin = 'anonymous';
       img.onload = () => resolve(img);
       img.onerror = reject;
       img.src = imageUrl;
     });
   };
   ```

2. **Análise com MediaPipe**
   ```typescript
   const analyzeUserImages = async (userId: string) => {
     // 1. Buscar imagens do usuário
     const { data: images } = await supabase
       .from('user_images')
       .select('*')
       .eq('user_id', userId);
     
     const frontImage = images.find(img => img.image_type === 'front');
     const sideImage = images.find(img => img.image_type === 'side');
     
     // 2. Carregar imagens
     const frontImg = await loadImageFromSupabase(frontImage.image_url);
     const sideImg = await loadImageFromSupabase(sideImage.image_url);
     
     // 3. Detectar poses
     const frontPose = await detectPose(frontImg);
     const sidePose = await detectPose(sideImg);
     
     // 4. Calcular medidas
     const measurements = calculateMeasurements(frontPose, sidePose, userHeight);
     
     return measurements;
   };
   ```

### **Fase 3: Cálculos de Saúde (4 dias)**

1. **Implementar fórmulas científicas**
   ```typescript
   const calculateBodyComposition = (
     measurements: Measurements,
     userProfile: UserProfile
   ) => {
     // Equação de Jackson & Pollock para % gordura
     let bodyFatPercentage: number;
     
     if (userProfile.gender === 'M') {
       bodyFatPercentage = 1.112 - (0.00043499 * measurements.triceps) +
                          (0.00000055 * Math.pow(measurements.triceps, 2)) -
                          (0.00028826 * userProfile.age);
     } else {
       // Fórmula para mulheres
     }
     
     const fatMass = (bodyFatPercentage / 100) * userProfile.weight;
     const leanMass = userProfile.weight - fatMass;
     const bmr = 370 + (21.6 * leanMass); // Cunningham equation
     
     return {
       bodyFatPercentage,
       fatMass,
       leanMass,
       bmr,
       bmi: userProfile.weight / Math.pow(userProfile.height / 100, 2)
     };
   };
   ```

2. **Sistema de classificação**
   ```typescript
   const classifyHealthRisk = (composition: BodyComposition, age: number, gender: string) => {
     const bodyFatRanges = {
       'M': { low: 6, normal: 18, high: 25 },
       'F': { low: 16, normal: 25, high: 32 }
     };
     
     const range = bodyFatRanges[gender];
     
     if (composition.bodyFatPercentage < range.low) return 'BAIXO_RISCO';
     if (composition.bodyFatPercentage <= range.normal) return 'NORMAL';
     if (composition.bodyFatPercentage <= range.high) return 'MODERADO';
     return 'ALTO_RISCO';
   };
   ```

### **Fase 4: Salvar Resultados + Relatório (3 dias)**

1. **Salvar no Supabase**
   ```typescript
   const saveAnalysisResults = async (userId: string, results: AnalysisResults) => {
     const { data, error } = await supabase
       .from('body_analysis')
       .insert({
         user_id: userId,
         measurements: results.measurements,
         composition: results.composition,
         health_metrics: results.healthMetrics,
         created_at: new Date().toISOString()
       });
     
     return { data, error };
   };
   ```

2. **Gerar PDF igual ao SHAPED**
   ```typescript
   const generateReport = (user: User, analysis: BodyAnalysis) => {
     const doc = new jsPDF();
     
     // Header com logo e dados do usuário
     doc.setFontSize(20);
     doc.text(`Análise Corporal - ${user.name}`, 20, 30);
     
     // Gráfico de composição corporal (pizza chart)
     // Tabelas de medidas
     // Classificações de risco
     // Recomendações
     
     return doc;
   };
   ```

## 💻 Componente Principal

```typescript
const BodyAnalysisApp: React.FC = () => {
  const { pendingUsers, fetchPendingAnalysis } = useSupabaseImages();
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  
  const processUser = async (userId: string) => {
    setAnalyzing(userId);
    
    try {
      // 1. Buscar dados do usuário
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      // 2. Analisar imagens
      const measurements = await analyzeUserImages(userId);
      
      // 3. Calcular composição corporal
      const composition = calculateBodyComposition(measurements, user);
      
      // 4. Classificar riscos
      const healthMetrics = classifyHealthRisk(composition, user.age, user.gender);
      
      // 5. Salvar resultados
      await saveAnalysisResults(userId, {
        measurements,
        composition,
        healthMetrics
      });
      
      // 6. Gerar relatório
      const report = generateReport(user, { measurements, composition, healthMetrics });
      
      // 7. Refresh da lista
      await fetchPendingAnalysis();
      
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setAnalyzing(null);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Análise Corporal - Dashboard</h1>
      
      <div className="grid gap-4">
        {pendingUsers.map(user => (
          <div key={user.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-gray-600">
                  {user.age} anos • {user.height}cm • {user.weight}kg
                </p>
              </div>
              
              <button
                onClick={() => processUser(user.id)}
                disabled={analyzing === user.id}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                {analyzing === user.id ? 'Analisando...' : 'Analisar'}
              </button>
            </div>
            
            <div className="mt-4 flex gap-2">
              {user.user_images.map(img => (
                <img
                  key={img.id}
                  src={img.image_url}
                  alt={img.image_type}
                  className="w-20 h-20 object-cover rounded"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🎯 Próximos Passos Imediatos

1. **Setup inicial** (1 dia)
   ```bash
   npm create vite@latest body-analysis -- --template react-ts
   npm install @supabase/supabase-js @mediapipe/pose @tensorflow/tfjs
   npm install jspdf html2canvas recharts tailwindcss
   ```

2. **Configurar Supabase** (1 dia)
   - Criar tabelas no database
   - Configurar políticas de acesso
   - Testar conexão

3. **Implementar busca de imagens** (1 dia)
   - Hook useSupabaseImages
   - Componente Dashboard básico

4. **Integrar MediaPipe** (2 dias)
   - Detecção de pose nas imagens
   - Cálculo das medidas básicas

**Essa abordagem é muito mais simples que a original, já que você eliminou toda a parte de captura de câmera!**

**Quer que eu crie algum componente específico para começar?**