// Mapeamento de exercícios para seus respectivos links de vídeo
export const exerciciosVideos: Record<string, string> = {};

// Extrair o nome do exercício a partir do texto de um parágrafo
export const extrairNomeExercicio = (paragrafo: string): string => {
  if (!paragrafo || !paragrafo.trim()) return '';
  
  // Verificar se o parágrafo começa com número seguido de traço (padrão de exercício)
  const contemNumeroExercicio = /^\d+\s*[-–—]\s*/.test(paragrafo);
  if (!contemNumeroExercicio) return '';
  
  // Regex mais precisa para extrair o nome do exercício, buscando pelo padrão de repetições
  const regexNomeExercicio = /^\d+\s*[-–—]\s*([^0-9]+?)(?:\s+\d+\s*X|$)/i;
  const match = paragrafo.match(regexNomeExercicio);
  
  let nomeExercicio = '';
  if (match && match[1]) {
    nomeExercicio = match[1].trim();
  } else {
    // Fallback para o método anterior caso a regex não funcione
    nomeExercicio = paragrafo.replace(/^\d+\s*[-–—]\s*/, '').trim();
    
    // Remover todo o texto após o padrão de repetições, caso exista
    // Isso captura padrões como "X 10", "X 12/10/8", "X 15 (CADA LADO)" etc.
    const padraoRepeticoes = /\s+\d+\s*X\s*\d+.*$/i;
    if (padraoRepeticoes.test(nomeExercicio)) {
      nomeExercicio = nomeExercicio.replace(padraoRepeticoes, '').trim();
    } else if (nomeExercicio.includes(' X ')) {
      // Último caso: se ainda houver um 'X' isolado, corta tudo depois dele
      nomeExercicio = nomeExercicio.split(/\s+X\s+/)[0].trim();
    }
  }
  
  // Limpeza adicional: remover instruções entre parênteses e após palavras-chave que indicam variações
  nomeExercicio = nomeExercicio
    .replace(/\([^)]*\)/g, '')                // Remove qualquer texto entre parênteses
    .replace(/\s+OU\s+.*$/i, '')              // Remove texto após "OU"
    .replace(/\s+COM\s+.*$/i, '')             // Opcional: remove texto após "COM" se necessário
    .replace(/\s+MÉTODO\s+.*$/i, '')          // Remove texto após "MÉTODO"
    .replace(/\s+ISOMETRIA\s+.*$/i, '')       // Remove texto após "ISOMETRIA"
    .replace(/\s+CADA\s+LADO\s*$/i, '')       // Remove "CADA LADO" no final
    .replace(/\s{2,}/g, ' ')                  // Normaliza espaços múltiplos
    .trim();
  
  return nomeExercicio;
};

// Função para encontrar o vídeo associado a um exercício
export const encontrarVideoDoExercicio = (textoExercicio: string, origem?: 'WEB' | 'PDF' | 'APP'): string | null => {
  console.log(`[encontrarVideoDoExercicio] Buscando vídeo para: "${textoExercicio}"`);
  
  if (!textoExercicio) {
    console.log('[encontrarVideoDoExercicio] Texto vazio, retornando null');
    return null;
  }

  // Verificar cache local para esta sessão
  const cacheKey = `video_${textoExercicio.trim()}`;
  const cachedResult = sessionStorage.getItem(cacheKey);
  if (cachedResult) {
    console.log(`[encontrarVideoDoExercicio] Retornando do cache: ${cachedResult}`);
    return cachedResult === "null" ? null : cachedResult;
  }

  // Normalizar o texto para comparação
  const normalizarTextoCompleto = (texto: string): string => {
    console.log(`[encontrarVideoDoExercicio] Normalizando texto: "${texto}"`);
    return texto
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-–—]/g, ' ')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  // Extrair apenas o nome essencial do exercício
  const extrairNomeEssencial = (texto: string): string => {
    // Remover informações de séries e repetições: "3x15" ou "4x12/10/8"
    let limpo = texto.replace(/\d+\s*[xX]\s*[\d\/]+(?:\s*a\s*\d+)?/g, '');
    
    // Remover parênteses e seu conteúdo
    limpo = limpo.replace(/\([^)]*\)/g, '');
    
    // Remover números no início (geralmente são números de ordem)
    limpo = limpo.replace(/^\s*\d+\s*[-–—]?\s*/, '');
    
    // Normalizar e retornar
    return normalizarTextoCompleto(limpo);
  };

  // Processar o texto do exercício
  const textoNormalizado = normalizarTextoCompleto(textoExercicio);
  const nomeEssencial = extrairNomeEssencial(textoExercicio);
  
  console.log(`[encontrarVideoDoExercicio] Texto normalizado: "${textoNormalizado}"`);
  console.log(`[encontrarVideoDoExercicio] Nome essencial: "${nomeEssencial}"`);
  
  // Lista de vídeos disponíveis (adicionar aqui novos exercícios)
  const videosExercicios: Record<string, string> = {

    "CRUCIFIXO MÁQUINA 3 X 10": "https://www.youtube.com/watch?v=xfe51AZ4HR5",
    "PANTURRILHA VERTICAL MÁQUINA 4 X 15/12/10/8": "https://www.youtube.com/watch?v=V-C4G7AOlQw",
    "REMADA BAIXA SENTADA ABERTA C/ BARRA RETA 3 X 10": "https://www.youtube.com/watch?v=t0W9RZEHiV5",
    "BANCO SCOOTT MÁQUINA   3 X 15/12/10": "https://www.youtube.com/watch?v=uQNjHE1o-RL",
    "SUPINO INCLINADO MÁQUINA 3 X 12/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=TfXx4T1D1le",
    "LEG PRESS 45     3 X 15/12/10": "https://www.youtube.com/watch?v=t8C8HbPD7Pg",
    "DESENVOLVIMENTO DE OMBROS SENTADO C/HALTER  3 X 10": "https://www.youtube.com/watch?v=Y5QdlL9HGJz",
    "EXTENSÃO DE QUADRIL C/ PERNA ESTICADA NO CABO 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=2jSfGLvcE_h",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 4 X 12/12/10/10": "https://www.youtube.com/watch?v=zOuFDeyhn-A",
    "PUXADA ABERTA P/FRENTE C/ BARRA RETA 3X 10": "https://www.youtube.com/watch?v=Qml2AhNwv2U",
    "EXTENSÃO DE QUADRIL DE 4 APOIOS C/ CANELEIRA E PERNA ESTICADA 3 X 12": "https://www.youtube.com/watch?v=mP7I9q-hoyj",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA 3 X 12": "https://www.youtube.com/watch?v=NhBBz9HU-lI",
    "STIFF NA BARRA  3 X 12": "https://www.youtube.com/watch?v=wNmmhO-TLt7",
    "SUPINO INCLINADO C/ HALTERES 3 X 10": "https://www.youtube.com/watch?v=82js9gOr_2R",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES 3 X 10": "https://www.youtube.com/watch?v=J-BTXu6qVfS",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES 3 X 15/12/10 (CADA LADO)": "https://www.youtube.com/watch?v=YPJaA01MMB6",
    "SUPINO INCLINADO NA BARRA LONGA 3 X 15/12/10": "https://www.youtube.com/watch?v=W9aMtpbwsJt",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 30SEG": "https://www.youtube.com/watch?v=LaReH333IoP",
    "SUPINO RETO NA BARRA LONGA   3 X 10": "https://www.youtube.com/watch?v=zBm2tHA1iCb",
    "ROSCA BÍCEPS ALTERNADA C/HALTER + TRÍCEPS FRANCES SIMULTANEO C/HALTER 3 X 10+10 (MÉTODO BI-SET)": "https://www.youtube.com/watch?v=K5UXpr9e5Nd",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADO DE LADO NO SOLO   3 X 10  (CADA LADO)": "https://www.youtube.com/watch?v=hos8IlA2ppJ",
    "CRUCIFIXO INVERSO NA MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/ HALTERES  3 X 10": "https://www.youtube.com/watch?v=B15tTec8qgT",
    "CADEIRA EXTENSORA   3 X 12": "https://www.youtube.com/watch?v=HSffkhCYYtz",
    "SUPINO RETO C/BARRA LONGA 3 X 12/10/8": "https://www.youtube.com/watch?v=qBv0Nq1Cgem",
    "SUPINO INCLINADO NA MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=0SmNiuPgNac",
    "ABDUÇÃO DE OMBROS COM HALTERES 3 X 10": "https://www.youtube.com/watch?v=x9ribR-LM_R",
    "MOBILIDADE DE FLEXORES DE QUADRIL E POSTERIORES DE COXA  3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=fHcqIdwlB6t",
    "FLEXÃO DE OMBROS ALTERNADA COM HALTERES  3 X 10": "https://www.youtube.com/watch?v=6lTOOKcaSlX",
    "TRÍCEPS FRÂNCES SIMULTÂNEO C/ HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=leiCRIYcKb_",
    "PANTURRILHA VERTICAL NA MÁQUINA 3 X 12": "https://www.youtube.com/watch?v=0lFfLT621cI",
    "HIPEREXTENSÃO DE TRONCO NO SOLO    3 X 12": "https://www.youtube.com/watch?v=w3wVKkcX-tz",
    "ELEVAÇÃO PÉLVICA 4 X 12 (MÉTODO PICO DE CONTRAÇÃO) NA FASE FINAL DO": "https://www.youtube.com/watch?v=etODyCV_dGE",
    "PANTURRILHA VERTICAL NA MÁQUINA    3 X 12": "https://www.youtube.com/watch?v=h6nmqRJ8FDf",
    "AGACHAMENTO NO BANCO C/ANILHA   3 X 10": "https://www.youtube.com/watch?v=hi-JwC6V809",
    "SUPINO RETO MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=P6OZjREmjql",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=3BtbjnNXg_Y",
    "CADEIRA ABDUTORA     3 X 12": "https://www.youtube.com/watch?v=0P9EvnBcfg-",
    "STIFF NA BARRA 3 X 12/12/10/10": "https://www.youtube.com/watch?v=NnYZHGUQuPr",
    "TRÍCEPS NO PULLEY C/ BARRA    3 X 10": "https://www.youtube.com/watch?v=xlvodf-ZGfe",
    "ELEVAÇÃO PÉLVICA NO SOLO (PESO CORPORAL)    3 X 12": "https://www.youtube.com/watch?v=XYhu61RXY0N",
    "CADEIRA EXTENSORA 3 X 12/12/10+10+10 (MÉTODO DROP-SET)": "https://www.youtube.com/watch?v=IOgODVONFR-",
    "DESENVOLVIMENTO DE OMBROS EM PÉ C/ HALTER    3 X 10": "https://www.youtube.com/watch?v=49loFoeUmC8",
    "CRUCIFIXO INVERSO SENTADO C/ HALTERES   3 X 12": "https://www.youtube.com/watch?v=UFNiMUzipfH",
    "LEG PRESS HORIZONTAL 4 X 12/12/10/10": "https://www.youtube.com/watch?v=oKPjL2R_5QL",
    "REMADA MÁQUINA (PEG.ABERTA) 3 X 10": "https://www.youtube.com/watch?v=v1jUkpl0Vyi",
    "REMADA ABERTA MÁQUINA + CRUCIFIXO INVERSO EM PÉ C/HALTERES 4 X 10+10": "https://www.youtube.com/watch?v=YxCh04PJHMI",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADO DE LADO NO SOLO 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=Lr2Bd-dOrOq",
    "PUXADA ABERTA NA BARRA RETA   3 X 15/12/10": "https://www.youtube.com/watch?v=c2z491LW2bo",
    "AGACHAMENTO NO SMITH 4 X 12/10/10/8": "https://www.youtube.com/watch?v=jI70Cepje8M",
    "ROSCA BÍCEPS DIRETO C/BARRA W + TRÍCEPS FRANCES C/HALTER 3 X 10+10 (MÉTODO": "https://www.youtube.com/watch?v=PDsdL5M6alt",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA   3 X 10  (CADA LADO)": "https://www.youtube.com/watch?v=7ITbIse21Zw",
    "DESENVOLVIMENTO DE OMBROS EM PÉ C/ HALTER 3 X 10": "https://www.youtube.com/watch?v=H9Wu73pKSiX",
    "CADEIRA ABDUTORA 3 X 15/12/10": "https://www.youtube.com/watch?v=hP05ea0KXsY",
    "EXTENSÃO DE QUADRIL NO CABO (TRONCO DEITADO) C/PERNA ESTICADA 3 X 12/10/8": "https://www.youtube.com/watch?v=Lytw-i5rww2",
    "ABDUÇÃO DE OMBROS INCLINADO C/HALTER 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=Vi7ZepiELQx",
    "SUPINO RETO C/ HALTERES   3 X 15/12/10": "https://www.youtube.com/watch?v=tDggVf0c8L6",
    "TRICEPS CORDA 3 X 12/10/8": "https://www.youtube.com/watch?v=gRkD1KTgv9R",
    "PUXADA SUPINADA NA BARRA RETA    3 X 10": "https://www.youtube.com/watch?v=Gn6QIp-c-a4",
    "CADEIRA ABDUTORA EM PÉ C/STEP 3 X 15": "https://www.youtube.com/watch?v=d2HBXDBi2D-",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 80SEG": "https://www.youtube.com/watch?v=fQY37R06Kh_",
    "CADEIRA ABDUTORA    3 X 15/12/10": "https://www.youtube.com/watch?v=HytfsYTD4Io",
    "PUXADA ABERTA NA BARRA RETA 3 X 15/12/10": "https://www.youtube.com/watch?v=2rxEgxnfies",
    "TRÍCEPS CORDA    3 X 10": "https://www.youtube.com/watch?v=WD3ZdUmEMSX",
    "PANTURRILHA VERTICAL MÁQUINA  4 X 15/12/10/8": "https://www.youtube.com/watch?v=P-aAIH_kc6G",
    "AGACHAMENTO BÚLGARO (PESO CORPORAL) 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=W1WzbeAWmV_",
    "CADEIRA FLEXORA  3 X 15/12/10": "https://www.youtube.com/watch?v=s7IQXDf5dGf",
    "PUXADA ABERTA NA BARRA RETA  3 X 15/12/10": "https://www.youtube.com/watch?v=B7PSa1qovGB",
    "LEG PRESS 45 4 X 12/12/10/10": "https://www.youtube.com/watch?v=zLI0MGieC8y",
    "TRICEPS FRANCES UNILATERAL C/ HALTERES    3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=S18Cmrfk_8U",
    "PULLOVER NO CABO C/ BARRA RETA OU CORDA 3 X 12/10/8": "https://www.youtube.com/watch?v=pGEswmgBtXh",
    "CADEIRA ABDUTORA C/ TRONCO A FRENTE   3 X 12": "https://www.youtube.com/watch?v=LS_ENF0qFk6",
    "LEG PRESS 45      3 X 10": "https://www.youtube.com/watch?v=Ej7dkLBi2gy",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADO DE LADO NO SOLO 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=QRDRHf2U2Bf",
    "AGACHAMENTO MÁQUINA   3 X 12": "https://www.youtube.com/watch?v=FrZPE0Gejnb",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 50 SEG": "https://www.youtube.com/watch?v=AxNjjE16in_",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)   3 X 20 SEG": "https://www.youtube.com/watch?v=SZZTjsuybTE",
    "FLEXÃO DE BRAÇOS DE JOELHOS NO SOLO  3 X 6": "https://www.youtube.com/watch?v=wAdSRurpSuT",
    "LEG PRESS 45 3 X 15/12/10": "https://www.youtube.com/watch?v=GcHkFcCWpdR",
    "PUXADA FECHADA NO TRIÂNGULO   3 X 10": "https://www.youtube.com/watch?v=VTd0vnUXiSa",
    "LEG PRESS 45   3 X 12": "https://www.youtube.com/watch?v=Gv4uOZ3iOUO",
    "CRUCIFIXO INVERSO MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/ HALTER 3 X 10": "https://www.youtube.com/watch?v=HnYlelPOlkz",
    "LEVANTAMENTO TERRA SUMÔ C/BARRA LONGA 4 X 12/12/10/10": "https://www.youtube.com/watch?v=mISSM33tYgY",
    "SUPINO INCLINADO NA BARRA LONGA    3 X 15/12/10": "https://www.youtube.com/watch?v=lBdR-B183m8",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA) 3 X 20 SEG": "https://www.youtube.com/watch?v=c0kJO5lj_mA",
    "AGACHAMENTO MÁQUINA  3 X 12": "https://www.youtube.com/watch?v=W0P0An9UHaJ",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA)    3 X 20 SEG": "https://www.youtube.com/watch?v=XnsoEKww9na",
    "PUXADA ABERTA C/ BARRA RETA   3 X 10": "https://www.youtube.com/watch?v=l-4cIc1CtEQ",
    "STIFF NA BARRA 3 X 12/10/8": "https://www.youtube.com/watch?v=rIMY5XCcIaJ",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA 4 X 12/10/10/8": "https://www.youtube.com/watch?v=fjHjDse5BNC",
    "EXTENSÃO DE QUADRIL C/JOELLHO DOBRADO C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=3lwFFXIPo9b",
    "DESENVOLVIMENTO DE OMBROS C/HALTER 3 X 12/10/8": "https://www.youtube.com/watch?v=2gAB5yDulf0",
    "CRUCIFIXO MÁQUINA    3 X 15/12/10": "https://www.youtube.com/watch?v=CqV8Ua_Sqsh",
    "ROSCA BÍCEPS SIMULTÂNEO NO BANCO INCLINADO C/HALTER + TRÍCEPS TESTA DEITADO": "https://www.youtube.com/watch?v=r_89hTzXZpJ",
    "ABDUÇÃO DE OMBROS SENTADO C/ HALTER 3 X12/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=AaE2X35MxBK",
    "CRUCIFIXO MÁQUINA 3 X 12": "https://www.youtube.com/watch?v=e4t2v4yY6JN",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=6jaA7k3OHKJ",
    "FLEXÃO DE OMBROS ALTERNADA C/HALTER 3 X 10": "https://www.youtube.com/watch?v=l83bHbbiySU",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEG. ABERTA)   3 X 10": "https://www.youtube.com/watch?v=mv2vTcAbjK1",
    "EXTENSÃO DE QUADRIL NO CABO COM PERNA ESTICADA 3 X 15/12/10": "https://www.youtube.com/watch?v=qxqbyguxJWx",
    "AGACHAMENTO NO BANCO (PESO CORPORAL)    3 X 12": "https://www.youtube.com/watch?v=h7OI2dE3L0X",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 70SEG": "https://www.youtube.com/watch?v=761eDhm0AYR",
    "ABDUÇÃO DE OMBROS C/ HALTERES 3 X 8": "https://www.youtube.com/watch?v=21yb1vmtL2Z",
    "LEG PRESS 45  3 X 15/12/10": "https://www.youtube.com/watch?v=WMNtX_1KZZl",
    "CADEIRA FLEXORA 4 X 12/10/8/6+6+6 (MÉTODO DROP-SET)": "https://www.youtube.com/watch?v=cBFtcSepbCC",
    "ROSCA BÍCEPS ALTERNADA C/ HALTERES   3 X 10": "https://www.youtube.com/watch?v=EgBPXfuCXi4",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X 12/10/10": "https://www.youtube.com/watch?v=P8v3JGcJJw8",
    "PANTURRILHA VERTICAL NO STEP UNILATERAL C/HALTER 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=Q7pSwD441nT",
    "AGACHAMENTO BÚLGARO (PESO CORPORAL)  3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=kbIYyku6bc2",
    "CADEIRA EXTENSORA 3 X 12": "https://www.youtube.com/watch?v=H9ku36vz51t",
    "REMADA ABERTA NA MÁQUINA 3 X 10": "https://www.youtube.com/watch?v=C05aG3yVBUc",
    "ROSCA BÍCEPS DIRETA NO BANCO INCLINADO C/HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=B5BoL6D6Z9R",
    "ROSCA BÍCEPS DIRETA C/BARRA W 3 X 15/12/10": "https://www.youtube.com/watch?v=GDKVdSXi_Ra",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEGADA ABERTA) 3 X 10": "https://www.youtube.com/watch?v=ulV2oAT-vLW",
    "PUXADA ABERTA P/ FRENTE NA BARRA RETA 3 X 15/12/10": "https://www.youtube.com/watch?v=YSzg2dCMPYn",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X 15/12/10": "https://www.youtube.com/watch?v=X2F77comcHV",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)     3 X 20 SEG": "https://www.youtube.com/watch?v=j4SeIVcsChF",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES   3 X 15/12/10  (CADA LADO)": "https://www.youtube.com/watch?v=OGJUsWxXw9D",
    "PUXADA FECHADA C/TRIÂNGULO 3 X 12/10/8": "https://www.youtube.com/watch?v=2mz6LuXbxkq",
    "ROSCA BÍCEPS DIRETA NA BARRA W    3 X 10": "https://www.youtube.com/watch?v=ScIpjX8C_eO",
    "PUXADA P/FRENTE ABERTA NA BARRA H 3 X 12/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=tze7pK9jF6U",
    "AGACHAMENTO SUMÔ C/ HALTERES OU KETTEBELL   3 X 15/12/10": "https://www.youtube.com/watch?v=jDybVL-XyEH",
    "EXTENSAO DE QUADRIL NO CABO (TRONCO DEITADO) C/JOELHO ESTICADO 3 X 12": "https://www.youtube.com/watch?v=xLtSGp5GN89",
    "TRÍCEPS FRANCES SIMULTÂNEO C/ HALTER 3 X 10": "https://www.youtube.com/watch?v=qOoxwTSkky6",
    "ROSCA BÍCEPS NO BANCO INCLINADO + TRÍCEPS CORDA 3 X 10+10": "https://www.youtube.com/watch?v=NakifOkiCxH",
    "STIFF NA BARRA 4 X 12/12/10/10": "https://www.youtube.com/watch?v=PTovHju2hZU",
    "ROSCA BÍCEPS C/ HALTERES + TRÍCEPS TESTA C/ BARRA W 3 X 10+10 (MÉTODO BI-SET)": "https://www.youtube.com/watch?v=W0R0xFW8kEm",
    "ROSCA BÍCEPS C/ROTAÇÃO + TRÍCEPS TESTA C/HALTER 3 X 10+10": "https://www.youtube.com/watch?v=CoxvAgPORDk",
    "PUXADA FECHADA NO TRIÂNGULO 3 X 10": "https://www.youtube.com/watch?v=aPK9-jG4Yft",
    "SUPINO RETO C/HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=plDf6ZHMiHg",
    "MESA FLEXORA 4 X 15/12/10/8+8+8 (MÉTODO DROP-SET)": "https://www.youtube.com/watch?v=xm2RPH8p2jD",
    "AGACHAMENTO MÁQUINA 4 X 12/10/8": "https://www.youtube.com/watch?v=owipArczAAX",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEGADA ABERTA)  3 X 10": "https://www.youtube.com/watch?v=U5p6EPbn7Ck",
    "CADEIRA ABDUTORA 3 X 12": "https://www.youtube.com/watch?v=8MzztLLpeV7",
    "AGACHAMENTO SUMÔ C/HALTERES OU KETTEBELL  3 X 12/10/8": "https://www.youtube.com/watch?v=L6zNu11zCgu",
    "ABDUÇÃO DE OMBROS C/ HALTER 3 X 8": "https://www.youtube.com/watch?v=MzhW_obhJ8O",
    "CRUCIFIXO INVERSO NA MÁQUINA OU CRUCIFIXO INVERSO C/ HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=aSpvXCSag4A",
    "AGACHAMENTO LIVRE NA BARRA LONGA 3 X 15/12/10": "https://www.youtube.com/watch?v=wj2Ve3MwNjc",
    "CRUCIFIXO MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=_Hm-q_ViJYX",
    "STIFF NA BARRA 3 X 12": "https://www.youtube.com/watch?v=ceb5SId8q2V",
    "TRÍCEPS FRANCES SIMULTÂNEO C/ HALTER   3 X 10": "https://www.youtube.com/watch?v=il_NjLWa3rC",
    "AFUNDO UNILATERAL (PESO CORPORAL)   3 X 10  (CADA LADO)": "https://www.youtube.com/watch?v=MLwhZit_WHW",
    "TRÍCEPS TESTA C/ BARRA W OU RETA  3 X 10": "https://www.youtube.com/watch?v=-nRK9eFVTFL",
    "ABDUÇÃO DE OMBROS NO BANCO INCLINADO 3 X 12/10/10": "https://www.youtube.com/watch?v=SKpScYIfBw-",
    "REMADA CURVADA C/BARRA RETA 3 X 12/10/10": "https://www.youtube.com/watch?v=19lrqsSFhA1",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA)   3 X 30 SEG": "https://www.youtube.com/watch?v=8SncSwI4VdH",
    "EXTENSÃO DE QUADRIL CHUTANDO NO CABO 3 X 12/10/8": "https://www.youtube.com/watch?v=E0_thgCjA3G",
    "AGACHAMENTO LIVRE NA BARRA LONGA    3 X 12": "https://www.youtube.com/watch?v=ySK5Y_Mu4pI",
    "PUXADA FECHADA NO TRIÂNGULO    3 X 10": "https://www.youtube.com/watch?v=-7Gp1goXy20",
    "CRUCIFIXO MÁQUINA + FLEXÃO DE BRAÇOS 3 X 12+12 (MÉTODO BI-SET)": "https://www.youtube.com/watch?v=r0qYf8wMTGr",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)    3 X 40 SEG": "https://www.youtube.com/watch?v=Ha4oNZM7xMd",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)   3 X 40 SEG": "https://www.youtube.com/watch?v=qeHChDOA3YJ",
    "STIFF NA BARRA   3 X 10": "https://www.youtube.com/watch?v=-t_30oXrx6Y",
    "ROSCA BÍCEPS C/ROTAÇÃO + TRÍCEPS TESTA C/HALTER 3 X 10+10 (MÉTODO BI-SET)": "https://www.youtube.com/watch?v=7zyfjDxqxoT",
    "SUPINO INCLINADO C/HALTERES 3 X 10": "https://www.youtube.com/watch?v=14xd3gViaDC",
    "FLEXÃO DE OMBROS (PEG.SUPINADA) NA POLIA BAIXA 3 X 12/10/10": "https://www.youtube.com/watch?v=ax08cFjhq4i",
    "BANCO SCOOTT MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=3wFASeF6Xmt",
    "REMADA BAIXA SENTADO C/TRIÂNGULO   3 X 10": "https://www.youtube.com/watch?v=MwtxqmqEslC",
    "BANCO SCOTT MÁQUINA 4 X 12/10/10/8": "https://www.youtube.com/watch?v=iNvCm2bdjxt",
    "LEG PRESS 45    3 X 12": "https://www.youtube.com/watch?v=u6drpDeeX4D",
    "CROSSOVER 3 X 12/10/8": "https://www.youtube.com/watch?v=Et5FNvgxKc5",
    "REMADA BAIXA SENTADO C/TRIÂNGULO 3 X 12/10/8": "https://www.youtube.com/watch?v=85ev8HUXBst",
    "PUXADA ABERTA NA BARRA    3 X 10": "https://www.youtube.com/watch?v=18k_fEltGE0",
    "ABDUÇÃO DE OMBROS C/ HALTERES    3 X 6": "https://www.youtube.com/watch?v=N1QOBeewfK4",
    "TRÍCEPS FRÂNCES SIMULTÂNEO C/ HALTERES   3 X 15/12/10": "https://www.youtube.com/watch?v=h55ZIbfZFmZ",
    "AGACHAMENTO SUMÔ C/ KETTEBELL OU HALTERES   3 X 12": "https://www.youtube.com/watch?v=K1FrvQrMAUf",
    "PANTURRILHA VERTICAL NA MÁQUINA   4 X 15/12/12/10": "https://www.youtube.com/watch?v=vynx-U_iuJu",
    "BANCO SCOTT MÁQUINA  3 X 10": "https://www.youtube.com/watch?v=6JP5qAkvqt-",
    "PUXADA ARTICULADA ABERTA 3 X 12/10/8": "https://www.youtube.com/watch?v=j8d5JgGGLz6",
    "ABDUÇÃODE OMBROS C/TRONCO INCLINADO UNILATERAL 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=UkSbNUacxEW",
    "AGACHAMENTO NO BANCO (PESO CORPORAL) 3 X 12": "https://www.youtube.com/watch?v=TGXApMVbuXE",
    "REMADA BAIXA SENTADA C/TRIÂNGULO 3 X 10": "https://www.youtube.com/watch?v=47szpf71-YW",
    "ABDUÇÃO DE OMBROS COM HALTERES 3 X 8": "https://www.youtube.com/watch?v=BvUBUJJwsnh",
    "ABDUÇÃO DE QUADRIL C/ CANELEIRA DEITADO DE LADO NO SOLO 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=LfKwsycR7Nj",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES  3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=G9B7EJj4wJo",
    "FLEXÃO DE OMBROS ALTERNADO C/ HALTER  3 X 10": "https://www.youtube.com/watch?v=GmRhdcHGWKm",
    "HACK MACHINE 3 X 15/12/10": "https://www.youtube.com/watch?v=wjnvzV-AH6q",
    "AFUNDO UNILATERAL (PESO CORPORAL)   3 X 12  (CADA LADO)": "https://www.youtube.com/watch?v=vZhyiL1OaHa",
    "CADEIRA FLEXORA 4 X 12/12/10/10": "https://www.youtube.com/watch?v=AcrUNcAfVf4",
    "CADEIRA EXTENSORA     3 X 12": "https://www.youtube.com/watch?v=eGrFuVHpKQE",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 30 SEG": "https://www.youtube.com/watch?v=U32Mmeha0yi",
    "CRUCIFIXO MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=rgBn6xExGUJ",
    "SUPINO INCLINADO NO SMITH 3 X 12/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=NYbcHdctzbG",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA  3 X 12  (CADA LADO)": "https://www.youtube.com/watch?v=BV96wtjTSuY",
    "SUPINO RETO MÁQUINA    3 X 10": "https://www.youtube.com/watch?v=f3ZJQYjozmm",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 60SEG": "https://www.youtube.com/watch?v=tuDSWzJj59y",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA  3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=GMLwZUwtV9Q",
    "ROSCA BÍCEPS DIRETA NA BARRA W  3 X 15/12/10": "https://www.youtube.com/watch?v=nYb9etcZHl4",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)   3 X 60 SEG": "https://www.youtube.com/watch?v=tiNnvQvol3S",
    "CADEIRA EXTENSORA 3 X 15/12/10": "https://www.youtube.com/watch?v=7QNxpKhmw_C",
    "PULLDOWN NO CABO C/BARRA RETA OU CORDA 3 X 12/10/8": "https://www.youtube.com/watch?v=uT13HK7PIeC",
    "MESA FLEXORA    3 X 15/12/10": "https://www.youtube.com/watch?v=R8Ib8fAdT8N",
    "EXERCÍCIO OSTRA C/ MINIBAND NO SOLO (DEITADO DE LADO) 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=zZN9cozXr0I",
    "CADEIRA EXTENSORA  3 X 12/10/8": "https://www.youtube.com/watch?v=dO41OIwfTDL",
    "CRUCIFIXO MÁQUINA + SUPINO RETO MÁQUINA 3 X 12+10 (MÉTODO BI-SET)": "https://www.youtube.com/watch?v=05qZjzzrdY9",
    "CRUCIFIXO INVERSO NO BANCO INCLINADO C/ HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=mnvueV3IBfK",
    "FLEXÃO DE OMBROS ALTERNADA COM HALTERES 3 X 10": "https://www.youtube.com/watch?v=RZQVLIOh2uS",
    "MOBILIDADE DE COLUNA TORÁCICA    3 X 10": "https://www.youtube.com/watch?v=d41ZiBSEZql",
    "LEG PRESS 45 3 X 12/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=3YTVTa6oiR_",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)    3 X 20 SEG": "https://www.youtube.com/watch?v=NIBtONg5EWg",
    "AGACHAMENTO SUMÔ C/HALTERES OU KETTEBELL 4 X 12/10/10/8": "https://www.youtube.com/watch?v=ov2xULJ7kgx",
    "SUPINO INCLINADO NA BARRA LONGA 3 X 10": "https://www.youtube.com/watch?v=mlK7v1gwo8q",
    "CADEIRA FLEXORA 4 X 15/12/10/10": "https://www.youtube.com/watch?v=d0iNCeHJAh0",
    "ABDUÇÃO DE OMBROS NO BANCO INCLINADO C/HALTER 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=skD8G4_DxGO",
    "ABDUÇÃO DE OMBROS C/ TRONCO INCLINADO": "https://www.youtube.com/watch?v=skD8G4_DxGO",    
    "ABDUÇÃODE OMBROS C/TRONCO INCLINADO UNILATERAL   3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=zI29zJzZ8jr",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO  3 X 12/10/8": "https://www.youtube.com/watch?v=l53R81qi2Ee",
    "CADEIRA EXTENSORA 8+8+8 (MÉTODO DROP-SET)": "https://www.youtube.com/watch?v=uRxM0i5IXvw",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)": "https://www.youtube.com/watch?v=7qjhCE6WeRr",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA) 3 X 40 SEG": "https://www.youtube.com/watch?v=UlCIF5pnnek",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEG.ABERTA) 3 X 12/10/8": "https://www.youtube.com/watch?v=EuqDhncgB-0",
    "PANTURRILHA VERTICAL NA MÁQUINA 4 X 15/12/12/10": "https://www.youtube.com/watch?v=okaKYy6nJUK",
    "ABDUÇÃO DE OMBROS COM HALTERES  3 X 8": "https://www.youtube.com/watch?v=J3h0kYpNuZO",
    "SUPINO INCLINADO C/ HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=S2ByNqfUFUl",
    "SUPINO RETO C/ HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=fmcQLgEyGRv",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 60 SEG": "https://www.youtube.com/watch?v=7GMit73eCqo",
    "AGACHAMENTO SUMÔ C/ KETTEBELL OU HALTERES    3 X 10": "https://www.youtube.com/watch?v=9ij7IyRevcF",
    "FLEXORA VERTICAL OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12": "https://www.youtube.com/watch?v=V99kQ_GesiL",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA    3 X 12": "https://www.youtube.com/watch?v=90wYtFKwfvL",
    "AGACHAMENTO NO SMITH 3 X 12/10/8": "https://www.youtube.com/watch?v=8S45vSylmkD",
    "PUXADA P/FRENTE ARTICULADA 3 X 12/10/8+8+8 (MÉTODO DROP-SET)": "https://www.youtube.com/watch?v=TUsU-wnKTv8",
    "PANTURRILHA VERTICAL LIVRE (PESO CORPORAL)    3 X 15": "https://www.youtube.com/watch?v=5EiDhyPudUb",
    "STIFF NA BARRA 3 X 12/10/10": "https://www.youtube.com/watch?v=ScNkkVMBJQb",
    "EXTENSÃO DE QUADRIL NO CABO C/PERNA ESTICADA 3 X 12/10/8": "https://www.youtube.com/watch?v=QWuGZAqIToy",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADA NO SOLO   3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=fmfYhJm09ng",
    "EXTENSÃO DE QUADRIL NO CABO EM PÉ 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=dh8MtS5ANiy",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADO DE LADO NO SOLO  3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=gtP7g1Nqybo",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12": "https://www.youtube.com/watch?v=zvk1maT-VBn",
    "CADEIRA EXTENSORA   3 X 15/12/10": "https://www.youtube.com/watch?v=JX2rADlhgf0",
    "FLEXORA VERTICAL NA MÁQUINA OU FLEXÃO DE JOELHOS C/ CANELEIRA   3 X 10  (CADA LADO)": "https://www.youtube.com/watch?v=WzuCxmUQ_UD",
    "ABDUÇÃO DE QUADRIL DEITADO DE LADO C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=V4h2ReADWDf",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO    3 X 10": "https://www.youtube.com/watch?v=D-X4SGk79cm",
    "EXTENSÃO DE QUADRIL C/ JOELHO DOBRADO NA CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=Lkq0AreopZW",
    "CADEIRA ABDUTORA   3 X 12": "https://www.youtube.com/watch?v=BLeMu8BpdbJ",
    "SUPINO RETO NA BARRA LONGA 3 X 10": "https://www.youtube.com/watch?v=T5mEZYG3W6n",
    "REMADA BAIXA SENTADO C/TRIÂNGULO  3 X 15/12/10": "https://www.youtube.com/watch?v=pzPTWRLIzoT",
    "TRICEPS FRANCÊS UNILATERAL C/ HALTER    3 X 10": "https://www.youtube.com/watch?v=EBnVYZMfq9L",
    "PUXADA FECHADA NO TRIÂNGULO 3 X 15/12/10": "https://www.youtube.com/watch?v=FFyeWuskRmD",
    "REMADA ABERTA NA MÁQUINA    3 X 10": "https://www.youtube.com/watch?v=OqMurAs_jHF",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 4 X 12/10/10/8": "https://www.youtube.com/watch?v=rUPrUGkE6tX",
    "CADEIRA ABDUTORA C/ TRONCO A FRENTE 3 X 12": "https://www.youtube.com/watch?v=Gf_CJ8urC0R",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO   3 X 12": "https://www.youtube.com/watch?v=8FKkDYTkDHg",
    "CADEIRA FLEXORA 3 X 10": "https://www.youtube.com/watch?v=MjJTGGy1sju",
    "PUXADA SUPINADA NA BARRA RETA     3 X 10": "https://www.youtube.com/watch?v=2evn9NPLvzA",
    "DESENVOLVIMENTO DE OMBROS SENTADO C/ HALTER     3 X 10": "https://www.youtube.com/watch?v=7ndCEXAVgxG",
    "CRUCIFIXO MÁQUINA    3 X 12": "https://www.youtube.com/watch?v=sV5M0bHDNnb",
    "BANCO SCOTT MÁQUINA + TRÍCEPS NA BARRA W 3 X 10+10 (MÉTODO BI-SET)": "https://www.youtube.com/watch?v=GvKNF_4BFVU",
    "CADEIRA FLEXORA 3 X 12": "https://www.youtube.com/watch?v=cFiLXqzYPHp",
    "ROSCA BÍCEPS DIRETA NA BARRA W   3 X 15/12/10": "https://www.youtube.com/watch?v=oL3ds_gU2c1",
    "CADEIRA FLEXORA 3X 15/12/10": "https://www.youtube.com/watch?v=LKVZT_cE8Zi",
    "EXTENSÃO DE QUADRIL NO CABO C/PERNA ESTICADA  3 X 12/10/8": "https://www.youtube.com/watch?v=TTh8ylMagDf",
    "TRÍCEPS FRANCES SIMULTÂNEO C/HALTER 3 X 10": "https://www.youtube.com/watch?v=uLqTe0mYfrq",
    "LEG HORIZONTAL 3 X 12/12/10": "https://www.youtube.com/watch?v=pCw42jzoQTo",
    "SUPINO RETO C/ HALTERES    3 X 10": "https://www.youtube.com/watch?v=I--MYpr_BDe",
    "CADEIRA FLEXORA    3 X 10": "https://www.youtube.com/watch?v=UZ0T8zqAqoK",
    "FLEXORA VERTICAL NA MÁQUINA OU FLEXÃO DE JOELHOS C/ CANELEIRA 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=N5NcN6BTXXZ",
    "MESA FLEXORA 3 X 15/12/10": "https://www.youtube.com/watch?v=-t-ftsDPkSx",
    "REMADA NO BANCO C/CORDA DEITADO 3 X 12": "https://www.youtube.com/watch?v=rO8yPorH6Kg",
    "SUPINO INCLINADO MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=yE6ts5R9Lby",
    "REMADA SERROTE C/ HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=zZlblYw_juB",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA) 3 X 20SEG": "https://www.youtube.com/watch?v=Nvker9czryb",
    "AGACHAMENTO MÁQUINA 3 X 12": "https://www.youtube.com/watch?v=tNXEtCGFR9Y",
    "DESENVOLVIMENTO DE OMBROS SENTADO C/HALTER   3 X 10": "https://www.youtube.com/watch?v=OoMs0L2134d",
    "AGACHAMENTO BÚLGARO (PESO CORPORAL) 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=9Auf6IolDvZ",
    "ROSCA BÍCEPS NO BANCO INCLINADO + TRÍCEPS CORDA 3 X 10+10 (MÉTODO BI-SET)": "https://www.youtube.com/watch?v=6S0SDtoWAR9",
    "ROSCA BÍCEPS ALTERNADA C/ HALTERES     3 X 10": "https://www.youtube.com/watch?v=2aWoSHn1Q_k",
    "CADEIRA EXTENSORA 4 X 12/10/8/6+6+6 (MÉTODO DRO-PSET)": "https://www.youtube.com/watch?v=VEZYXDaWMcx",
    "ELEVAÇÃO PÉLVICA MÁQUINA   3 X 12": "https://www.youtube.com/watch?v=dGuN5K4hR2z",
    "HACK MACHINE 4 X 12/10/10/8": "https://www.youtube.com/watch?v=t8rdddJYGDP",
    "CADEIRA ABDUTORA 4 X 12": "https://www.youtube.com/watch?v=souQcKOJ8Fg",
    "CADEIRA FLEXORA     3 X 12": "https://www.youtube.com/watch?v=_vxigk3iN41",
    "REMADA BAIXA SENTADA ABERTA C/ BARRA RETA    3 X 10": "https://www.youtube.com/watch?v=IbGlbf5TjZq",
    "ABDUÇÃO DE OMBROS C/ HALTER 3 X12/10/8": "https://www.youtube.com/watch?v=-adSauyHfjI",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA)   3 X 40 SEG": "https://www.youtube.com/watch?v=wqVZ3V63Z9s",
    "BANCO SCOTT MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=kxgbS1I3iB4",
    "PUXADA FECHADA NO TRIÂNGULO   3 X 15/12/10": "https://www.youtube.com/watch?v=3ntEMchTsIO",
    "ROSCA BÍCEPS DIRETA NA BARRA W 3 X 10": "https://www.youtube.com/watch?v=Be_pHC1UN7z",
    "TRÍCEPS NO PULLEY C/ BARRA RETA    3 X 10": "https://www.youtube.com/watch?v=fh-o6RkaNJA",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 20 SEG": "https://www.youtube.com/watch?v=6y77Ij_RDdQ",
    "REMADA BAIXA SENTADO C/TRIÂNGULO 3 X 10": "https://www.youtube.com/watch?v=EFoumssPcR1",
    "RECÚO NO STEP C/HALTERES 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=QFWmqaxtOCl",
    "REMADA ABERTA NA MÁQUINA    3 X 12": "https://www.youtube.com/watch?v=U35446THuy3",
    "ABDUÇÃO DE OMBROS C/ HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=MabIOriQ2ww",
    "PULLDOWN NO CABO C/BARRA RETA OU CORDA 3 X 10 (MÉTODO PICO DE CONTRAÇÃO)": "https://www.youtube.com/watch?v=fi3F7Abvb6P",
    "PUXADA ABERTA P/ FRENTE NA BARRA RETA    3 X 15/12/10": "https://www.youtube.com/watch?v=UDHqouox5Xv",
    "CRUCIFIXO INVERSO NA MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/HALTER 3 X 12": "https://www.youtube.com/watch?v=NhCgitRDvQp",
    "MESA FLEXORA 4 X 15/12/10/10": "https://www.youtube.com/watch?v=iOUHxq0Icq5",
    "LEG PRESS 45 4 X 12/10/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=GBd6DFexYnG",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)       3 X 60 SEG": "https://www.youtube.com/watch?v=rW1ATsueEaq",
    "REMADA ABERTA NA MÁQUINA   3 X 10": "https://www.youtube.com/watch?v=uxvyATUbeB6",
    "SUPINO INCLINADO C/ HALTERES     3 X 10": "https://www.youtube.com/watch?v=EjloSLI15Ah",
    "HIPEREXTENSÃO DE TRONCO NO SOLO 3 X 12": "https://www.youtube.com/watch?v=JfqCkBwFb42",
    "RDL C/HALTER E APOIO NO STEP 4 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=xbtrbRy501T",
    "TRICEPS C/ BARRA W 3 X 10": "https://www.youtube.com/watch?v=jpEBHwxesla",
    "BANCO SCOTT MÁQUINA 3 X 10": "https://www.youtube.com/watch?v=48jSswaznEm",
    "MOBILIDADE DE FLEXORES DE QUADRIL E POSTERIORES DE COXA   3 X 10  (CADA LADO)": "https://www.youtube.com/watch?v=oBwLX5DPnMQ",
    "CADEIRA FLEXORA 4 X 12/10/10/8": "https://www.youtube.com/watch?v=P3G-cz0FKnI",
    "FLEXORA VERTICAL NA MÁQUINA OU FLEXÃO DE JOELHOS C/ CANELEIRA 3 X 10 (CADA": "https://www.youtube.com/watch?v=CmvXJgUs63u",
    "AGACHAMENTO SUMÔ C/ HALTERES OU KETTEBELL 3 X 10": "https://www.youtube.com/watch?v=vX3e2rk6qpm",
    "EXTENSÃO DE QUADRIL DE 4 APOIOS C/ CANELEIRA E PERNA DOBRADA 3 X 15": "https://www.youtube.com/watch?v=AqgUCSIaVzJ",
    "AGACHAMENTO MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=yl75wxYXLwc",
    "TRICEPS NA BARRA RETA 3 X 12/10/8": "https://www.youtube.com/watch?v=tiznbCJBmXc",
    "REMADA MÁQUINA (PEG. ABERTA) 3 X 10": "https://www.youtube.com/watch?v=dKLZqwjJyfo",
    "FLEXÃO DE OMBROS ALTERNADO C/ HALTERES   3 X 10": "https://www.youtube.com/watch?v=cuA2zJ9nzIA",
    "CADEIRA EXTENSORA 4 X 15/12/10/8+8+8 (MÉTODO DROP-SET)": "https://www.youtube.com/watch?v=r4a1fprBA_N",
    "ABDUÇÃO DE OMBROS C/HALTER 3 X 12/10/8+8+8 (MÉTODO DROP-SET)": "https://www.youtube.com/watch?v=dyoQtiyMjJ4",
    "ELEVAÇÃO PÉLVICA 4 X 12 (MÉTODO PICO DE CONTRAÇÃO)": "https://www.youtube.com/watch?v=cnPdTdNxw4J",
    "AGACHAMENTO LIVRE NA BARRA LONGA   3 X 12": "https://www.youtube.com/watch?v=i6h_aAKSP4w",
    "SUPINO RETO MÁQUINA 3 X 10": "https://www.youtube.com/watch?v=uAQVQmucxz6",
    "AGACHAMENTO LIVRE NA BARRA LONGA 4 X 15/12/10/10": "https://www.youtube.com/watch?v=XzzU-1NH-nF",
    "REMADA BAIXA SENTADO C/TRIÂNGULO    3 X 10": "https://www.youtube.com/watch?v=hsm-MePOSRn",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO  3 X 15/12/10": "https://www.youtube.com/watch?v=jOVTIe5hrFs",
    "SUPINO RETO MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=C_CX3w7xHS6",
    "PANTURRILHA VERTICAL NA MÁQUINA  4 X 15/12/12/10": "https://www.youtube.com/watch?v=lYttxQAPaVZ",
    "ROSCA BÍCEPS DIRETA NA BARRA W 3 X 15/12/10": "https://www.youtube.com/watch?v=G5HAsFs5-aR",
    "STIFF NA BARRA 4 X 12/10/10/8": "https://www.youtube.com/watch?v=WRtE64zMOum",
    "HIPEREXTENSÃO DE TRONCO NO SOLO  3 X 12": "https://www.youtube.com/watch?v=Q2bw2e3wXwM",
    "ABDUÇÃO DE OMBROS C/TRONCO INCLINADO UNILATERAL 3 X 10": "https://www.youtube.com/watch?v=qMtlvDUoF1m",
    "PUXADA SUPINADA NA BARRA LONGA 3 X 15/12/10": "https://www.youtube.com/watch?v=Mzh7Ky6sZZ9",
    "SUPINO RETO C/ HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=2xb5LiEq7tn",
    "CRUCIFIXO INVERTIDO NA MÁQUINA 3 X 10": "https://www.youtube.com/watch?v=IGTZHrCJbRo",
    "CRUCIFIXO INVERSO SENTADO C/ HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=nLi-hPkM6Mm",
    "CADEIRA FLEXORA 3 X 12/10/10": "https://www.youtube.com/watch?v=toKF02oOC-3",
    "MESA FLEXORA  3 X 15/12/10": "https://www.youtube.com/watch?v=Xlizi11Wrc2",
    "SUPINO INCLINADO NA BARRA LONGA   3 X 10": "https://www.youtube.com/watch?v=Zf0jBB9T86f",
    "CADEIRA FLEXORA 3 X 12/10/8": "https://www.youtube.com/watch?v=fW_ZBaj4qXX",
    "PUXADA UNILATERAL NO CROSS SENTADO NO STEP 3 X 12/10/10": "https://www.youtube.com/watch?v=iXFKGRnGG2l",
    "DESENVOLVIMENTO DE OMBROS EM PÉ C/HALTERES 3 X 10": "https://www.youtube.com/watch?v=7RJNkTgjQhZ",
    "TRÍCEPS TESTA NA BARRA W 3 X 15/12/10": "https://www.youtube.com/watch?v=HA4DwqMg9vo",
    "ROSCA BÍCEPS DIRETA NA BARRA W   3 X 10": "https://www.youtube.com/watch?v=lcMtR4GSqHF",
    "FLEXORA VERTICAL UNILATERAL OU FLEXÃO DE JOELHOS UNILATERAL C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=HyQJhHLp6M8",
    "AGACHAMENTO MÁQUINA 4 X 15/12/10/10": "https://www.youtube.com/watch?v=kdXC2bt514k",
    "CADEIRA FLEXORA 3 X 15/12/10": "https://www.youtube.com/watch?v=4G2wa2hgijO",
    "CADEIRA ABDUTORA C/ TRONCO A FRENTE 3 X 15": "https://www.youtube.com/watch?v=c8a9eLG4CUi",
    "AGACHAMENTO SUMÔ C/ HALTERES OU KETTEBELL 3 X 15/12/10": "https://www.youtube.com/watch?v=iQquKOL3F8w",
    "PUXADA ABERTA P/FRENTE BARRA RETA 3 X 10": "https://www.youtube.com/watch?v=na1j52QgQHW",
    "CADEIRA FLEXORA 3 X15/12/10": "https://www.youtube.com/watch?v=6ZfAoysmDwo",
    "CADEIRA FLEXORA    3 X 12": "https://www.youtube.com/watch?v=G5HluHyOcH-",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X": "https://www.youtube.com/watch?v=HW63es1IDqY",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12/10/8": "https://www.youtube.com/watch?v=zDQbv3MjQeI",
    "REMADA SENTADO ABERTA C/ BARRA RETA   3 X 10": "https://www.youtube.com/watch?v=C7VTorQFv0D",
    "SUPINO RETO NA BARRA LONGA     3 X 10": "https://www.youtube.com/watch?v=c-3ZFlTEbiS",
    "REMADA BAIXA SENTADO C/TRIÂNGULO 3 X 15/12/10": "https://www.youtube.com/watch?v=rb9ZOvIAawG",
    "TRICEPS C/ CORDA  3 X 10": "https://www.youtube.com/watch?v=_1R19JY6HNQ",
    "AGACHAMENTO SUMÔ C/HALTERES OU KETTEBELL 3 X 12/10/8": "https://www.youtube.com/watch?v=hu165mMIQju",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADA NO SOLO  3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=7Hoqp-ezr6M",
    "REMADA SERROTE UNILATERAL C/ HALTER 3 X 12/10/8": "https://www.youtube.com/watch?v=Dsd2eHiv20-",
    "CRUCIFIXO MÁQUINA   3 X 10": "https://www.youtube.com/watch?v=wvmt1hXYN_T",
    "PANTURRILHA VERTICAL NA MÁQUINA   3 X 12": "https://www.youtube.com/watch?v=F_z-_lVkcog",
    "CRUCIFIXO INVERSO MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/HALTERES 3 X 12": "https://www.youtube.com/watch?v=Bu8qYYHRq0-",
    "TRÍCEPS CORDA 3 X 10": "https://www.youtube.com/watch?v=RDZAZgxdWa-",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X 12/10/8": "https://www.youtube.com/watch?v=F0UNz_yuXP0",
    "TRÍCEPS FRÂNCES SIMULTÂNEO C/ HALTERES 3 X 10": "https://www.youtube.com/watch?v=CRyfIETfSGS",
    "ROSCA BICEPS DIRETA C/BARRA W 3 X 15/12/10": "https://www.youtube.com/watch?v=YVtwMcnnKX3",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=18GBV6ciAxK",
    "MOBILIDADE DE COLUNA TORÁCICA     3 X 10": "https://www.youtube.com/watch?v=i3Wh5pMOHrH",
    "ROSCA BÍCEPS C/ HALTERES + TRÍCEPS TESTA C/ BARRA W 3 X 10+10": "https://www.youtube.com/watch?v=_WxQFZ1_hJo",
    "EXTENSÃO DE QUADRIL DE 4 APOIOS COM PERNA ESTENDIDA C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=RhvTZTugiov",
    "EXTENSÃO DE QUADRIL C/ CANELEIRA COM A PERNA ESTICADA    3 X 12  (CADA LADO)": "https://www.youtube.com/watch?v=ZPF0Ea813gy",
    "PANTURRILHA VERTICAL LIVRE (PESO CORPORAL)   3 X 15": "https://www.youtube.com/watch?v=nUr-vixOu6f",
    "CADEIRA EXTENSORA 3 X 12/12/10": "https://www.youtube.com/watch?v=_OkQ59PpJEY",
    "CADEIRA EXTENSORA    3 X 15/12/10": "https://www.youtube.com/watch?v=wiFrUWqoLOb",
    "FLEXÃO DE OMBROS ALTERNADO C/ HALTER 3 X 12": "https://www.youtube.com/watch?v=BVulBiJmxUE",
    "FLEXORA VERTICAL NA MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=WgrTm4jsOwk",
    "SUPINO INCLINADO C/ HALTERES 4 X 12/10/10/8": "https://www.youtube.com/watch?v=k4n1iBHKi9_",
    "HIPEREXTENSÃO DE TRONCO NO SOLO   3 X 60 SEG": "https://www.youtube.com/watch?v=tlXUjg5Ek3h",
    "EXTENSÃO DE QUADRIL C/ JOELHO ESTICADO NA CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=HlmOXX6O9C0",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/ CANELEIRA EM PÉ 4 X 12/10/10/8 (MÉTODO PICO DE CONTRAÇÃO) NA FASE FINAL DO MOVIMENTO QUANDO O JOELHO ESTIVER EM 90GRAUS DE FLEXÃO": "https://www.youtube.com/watch?v=9xAopTwRc0j",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 40SEG": "https://www.youtube.com/watch?v=CyY4MeHkurZ",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEG. ABERTA) 3 X 10": "https://www.youtube.com/watch?v=Hh3wmXMxvpZ",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEG. ABERTA) 3 X 12/10/8": "https://www.youtube.com/watch?v=QxC4ajKnb6s",
    "ABDUÇÃO DE OMBROS UNILATERAL C/ TRONCO INCLINADO C/ HALTERES  3 X 10": "https://www.youtube.com/watch?v=FBBavwnRUU6",
    "FLEXORA VERTICAL OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12/10/8": "https://www.youtube.com/watch?v=kHtWqM31AOx",
    "ROSCA BÍCEPS ALTERNADO C/ ROTAÇÃO C/ HALTER + TRÍCEPS CORDA 3 X 10+10 (MÉTODO BI-SET)": "https://www.youtube.com/watch?v=q93kRfPWNi8",
    "STIFF NA BARRA 3 X 15/12/10": "https://www.youtube.com/watch?v=zAWXgPDK8hz",
    "MESA FLEXORA   3 X 15/12/10": "https://www.youtube.com/watch?v=C7KrDNHrs_N",
    "LEG PRESS 45    3 X 10": "https://www.youtube.com/watch?v=n99tWBv8zk2",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA) 3 X 30 SEG": "https://www.youtube.com/watch?v=0BbNyZHGnOa",
    "FLEXÃO DE BRAÇOS DE JOELHOS NO SOLO 3 X 8": "https://www.youtube.com/watch?v=k6s7wJQwkxQ",
    "LEG PRESS 45 3 X 12/10/8": "https://www.youtube.com/watch?v=_ZNeiBjRmSg",
    "ELEVAÇÃO PÉLVICA MÁQUINA 3 X 12": "https://www.youtube.com/watch?v=0c7MhNKmmsk",
    "EXTENSÃO DE QUADRIL DE 4 APOIOS C/ CANELEIRA E PERNA ESTICADA  3 X 15": "https://www.youtube.com/watch?v=zn7-uEWBLDx",
    "TRÍCEPS NO PULLEY C/ BARRA  RETA    3 X 10": "https://www.youtube.com/watch?v=kKJmE0fO4_U",
    "REMADA MÁQUINA (PEGADA ABERTA) 3 X 10": "https://www.youtube.com/watch?v=GIE1wECUTQ-",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X 12": "https://www.youtube.com/watch?v=yTWI8rAg5pz",
    "MOBILIDADE DE FLEXORES DE QUADRIL E POSTERIORES DE COXA 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=oQghefA7rJ2",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEGADA ABERTA)   3 X 10": "https://www.youtube.com/watch?v=dFXAhZ4ZSPT",
    "MOBILIDADE DA COLUNA TORÁCICA 3 X 10": "https://www.youtube.com/watch?v=fOJ_ALMCDgU",
    "MOBILIDADE DE COLUNA TORÁCICA   3 X 10": "https://www.youtube.com/watch?v=tBmlKDIm-Aq",
    "PANTURRILHA VERTICAL MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=la6IQ9nognr",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=oEu2P1ooxTK",
    "FLEXÃO DE OMBROS ALTERNADO C/ HALTERES 3 X 10": "https://www.youtube.com/watch?v=wZwQdlbRw5-",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 4 X12/10/10/8": "https://www.youtube.com/watch?v=mJtHUKiKlkc",
    "MOBILIDADE DE COLUNA TORÁCICA  3 X 10": "https://www.youtube.com/watch?v=edX6k9MS0Ux",
    "CADEIRA EXTENSORA 3 X 12/10/8": "https://www.youtube.com/watch?v=Yvi92t0523f",
    "ROSCA BÍCEPS SIMULTÂNEO C/ ROTAÇÃO + TRÍCEPS CORDA 3 X 10+10 (MÉTODO BI-SET)": "https://www.youtube.com/watch?v=ukRU-YJf2oP",
    "BANCO SCOTT + TRÍCEPS CORDA 3 X 10+10 (MÉTODO BI-SET)": "https://www.youtube.com/watch?v=qMMQ_ZMPhyW",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA)   3 X 20 SEG": "https://www.youtube.com/watch?v=my1L_d1dvEa",
    "STIFF NA BARRA   3 X 12": "https://www.youtube.com/watch?v=LHiFWm-ycvW",
    "ROSCA BÍCEPS ALTERNADA C/ HALTERES 3 X 10": "https://www.youtube.com/watch?v=ZB_jaOtKRUT",
    "ROSCA BÍCEPS ALTERNADA C/ HALTERES    3 X 10": "https://www.youtube.com/watch?v=IbpDvr_ItFK",
    "ABDUÇÃO DE OMBROS C/TRONCO INCLINADO UNILATERAL 3 X 15/12/10": "https://www.youtube.com/watch?v=FOD0Sl_j7_z",
    "CROSSOVER 3 X 12/12/10 (MÉTODO PICO DE CONTRAÇÃO) NA FASE FINAL DO": "https://www.youtube.com/watch?v=PqlpkBXcwgq",
    "LEG PRESS 45 3 X 12": "https://www.youtube.com/watch?v=ZOCdQpIvc9i",
    "CRUCIFIXO INVERSO MÁQUINA OU CRUCIFIXO INVERSO C/ HALTER  3 X 10": "https://www.youtube.com/watch?v=jz0u0bCLFz-",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 40 SEG": "https://www.youtube.com/watch?v=kbUUfFNhwRC",
    "MESA FLEXORA 8+8+8 (MÉTODO DROP-SET)": "https://www.youtube.com/watch?v=UI4Ve86K41X",
    "PUXADA SUPINADA NA BARRA RETA 3 X 10": "https://www.youtube.com/watch?v=NpaHjFN_zZP",
    "CADEIRA EXTENSORA 4 X 15/12/10/8": "https://www.youtube.com/watch?v=9Qj6ugXS_Un",
    "REMADA SERROTE UNILATERAL C/HALTER 3 X 10": "https://www.youtube.com/watch?v=-Y9ddcWoRDS",
    "ROSCA BÍCEPS DIRETA NO CROSS C/ BARRA W 3 X 15/12/10": "https://www.youtube.com/watch?v=Pny9QqEHm4R",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA  3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=BcAqxmCTbZS",
    "FLEXORA VERTICAL NA MÁQUINA OU FLEXÃO DE JOELHOS C/ CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=WXLou9_qQiA",
    "MOBILIDADE DE COLUNA TORÁCICA 3 X 10": "https://www.youtube.com/watch?v=N6mXGjxFXGo",
    "SUPINO RETO C/ HALTERES  3 X 12/10/8": "https://www.youtube.com/watch?v=TBsm1CJXYwC",
    "CRUCIFIXO INVERSO MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/ HALTER   3 X 10": "https://www.youtube.com/watch?v=KQh-1_kxQLk",
    "MESA FLEXORA   3 X 12": "https://www.youtube.com/watch?v=PpoYkmm0az2",
    "LEG HORIZONTAL 4 X 12/12/10/10": "https://www.youtube.com/watch?v=5nm5W7abB8d",
    "CRUCIFIXO INVERSO MÁQUINA 3 X12/10/8": "https://www.youtube.com/watch?v=NfgY3MqF5sC",
    "SUPINO INCLINADO C/ HALTERES   3 X 10": "https://www.youtube.com/watch?v=ukePk1JfPpw",
    "CRUCIFIXO INVERSO MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=jBC6LkJxFIa",
    "LEVANTAMENTO TERRA SUMÔ C/BARRA LONGA 3 X 12/10/10": "https://www.youtube.com/watch?v=pU4_zG2yteA",
    "HACK MACHINE   3 X 15/12/10": "https://www.youtube.com/watch?v=M-rpgAO6A-8",
    "CROSSOVER MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=k5kyKzpSaKM",
    "REMADA ABERTA MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=TCZPFHCBIr-",
    "PUXADA SUPINADA NA BARRA RETA 3 X 15/12/10": "https://www.youtube.com/watch?v=OYbOqPkup1h",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 70 SEG": "https://www.youtube.com/watch?v=dYtP9VCdVW4",
    "AFUNDO UNILATERAL (PESO CORPORAL) 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=GKPZla07m4G",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X12/10/8": "https://www.youtube.com/watch?v=bjXPmNI_0Gr",
    "TRICEPS CORDA 4 X 12/10/10/8": "https://www.youtube.com/watch?v=oLvo3w4hUDP",
    "EXERCÍCIO OSTRA C/ MINIBAND NO SOLO (DEITADO DE LADO)  3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=wYR-c_kUNHG",
    "FLEXÃO DE OMBROS ALTERNADO C/ HALTER 3 X 10": "https://www.youtube.com/watch?v=feSwqBisB2Z",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)  3 X 40 SEG": "https://www.youtube.com/watch?v=NILDZ7dmngx",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 50SEG": "https://www.youtube.com/watch?v=__cywzIt4VO",
    "REMADA ABERTA NA MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=XXGREiqTdeb",
    "REMADA ABERTA NA MÁQUINA    3 X 15/12/10": "https://www.youtube.com/watch?v=N-TMU311SUD",
    "EXTENSÃO DE QUADRIL NO CABO C/PERNA ESTICADA 3 X 15/12/10": "https://www.youtube.com/watch?v=x5Z8tC5hpEj",
    "CADEIRA FLEXORA   3 X 15/12/10": "https://www.youtube.com/watch?v=EQ0eUrNVZMV",
    "ABDUÇÃO DE OMBROS NO BANCO INCLINADO C/HALTERES 3 X 10": "https://www.youtube.com/watch?v=Aw5D1t8Xn4b",
    "SUPINO RETO C/ BARRA LONGA 3 X 12/10/8": "https://www.youtube.com/watch?v=ku8Cbe1ZdII",
    "SUPINO INCLINADO C/ HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=22p685zYMfh",
    "ABDUÇÃO DE OMBROS C/ HALTER   3 X 8": "https://www.youtube.com/watch?v=zMaKvN101Rn",
    "AGACHAMENTO NO BANCO (PESO CORPORAL)    3 X 10": "https://www.youtube.com/watch?v=KQDfypBHCEX",
    "PUXADA FECHADA NO TRIÂNGULO 3 X 12/10/10": "https://www.youtube.com/watch?v=n17HTVyKOs2",
    "CADEIRA ABDUTORA    3 X 12": "https://www.youtube.com/watch?v=v2x0S9HD1lP",
    "REMADA BAIXA SENTADO ABERTA C/ BARRA LONGA 3 X 12/10/8": "https://www.youtube.com/watch?v=YH2Jh-DMP0j",
    "HIPEREXTENSÃO DE TRONCO NO BANCO ROMANO 3 X 12": "https://www.youtube.com/watch?v=dy_2QpvH4bf",
    "AGACHAMENTO BÚLGARO C/HALTERES 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=zDjdhl1Y7oX",
    "TRÍCEPS CORDA   3 X 10": "https://www.youtube.com/watch?v=DAUo7mybmtb",
    "CADEIRA FLEXORA    3 X 15/12/10": "https://www.youtube.com/watch?v=Rf83i60haud",
    "REMADA BAIXA SENTADA C/TRIÂNGULO    3 X 10": "https://www.youtube.com/watch?v=XU3P41BKXgE",
    "REMADA BAIXA SENTADO ABERTA C/ BARRA LONGA 3 X 12/10/10/8": "https://www.youtube.com/watch?v=cW0k2rBu2ZL",
    "TRÍCEPS NO PULLEY C/ BARRA RETA 3 X 10": "https://www.youtube.com/watch?v=8R73MMNZF3K",
    "ABDUÇÃO DE OMBROS C/HALTER 3 X 15/12/10": "https://www.youtube.com/watch?v=oNjd5q9BHHf",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)  3 X 60 SEG": "https://www.youtube.com/watch?v=u7gukBgw8Av",
    "TRÍCEPS TESTA C/HALTERES SIMULTÂNEO 3 X 12": "https://www.youtube.com/watch?v=i4GWwvEH37c",
    "AGACHAMENTO MÁQUINA  3 X 12/10/8": "https://www.youtube.com/watch?v=P1cLloiic35",
    "TRÍCEPS NO PULLEY C/ BARRA RETA  3 X 10": "https://www.youtube.com/watch?v=9wxMqyKBRgb",
    "SUPINO RETO MÁQUINA   3 X 10": "https://www.youtube.com/watch?v=dEu4xyuGT1u",
    "AGACHAMENTO SUMÔ C/ HALTERES OU KETTEBELL    3 X 15/12/10": "https://www.youtube.com/watch?v=AYBDQWrCDW5",
    "EXTENSÃO DE QUADRIL DE 4 APOIOS C/ CANELEIRA E PERNA ESTICADA 3 X 15": "https://www.youtube.com/watch?v=K9dVr-uzGct"

  };
  
  // Tentar encontrar correspondência exata no texto normalizado
  for (const [exercicio, url] of Object.entries(videosExercicios)) {
    const exercicioNormalizado = normalizarTextoCompleto(exercicio);
    if (textoNormalizado === exercicioNormalizado) {
      console.log(`[encontrarVideoDoExercicio] Correspondência exata encontrada para: "${exercicio}"`);
      sessionStorage.setItem(cacheKey, url);
      return url;
    }
  }
  
  // Tentar encontrar correspondência com base no nome essencial
  for (const [exercicio, url] of Object.entries(videosExercicios)) {
    const exercicioEssencial = extrairNomeEssencial(exercicio);
    if (nomeEssencial === exercicioEssencial) {
      console.log(`[encontrarVideoDoExercicio] Correspondência pelo nome essencial: "${exercicio}"`);
      sessionStorage.setItem(cacheKey, url);
      return url;
    }
  }
  
  // Verificar se o nome essencial está contido em algum dos exercícios
  for (const [exercicio, url] of Object.entries(videosExercicios)) {
    const exercicioEssencial = extrairNomeEssencial(exercicio);
    if (exercicioEssencial.includes(nomeEssencial) || nomeEssencial.includes(exercicioEssencial)) {
      console.log(`[encontrarVideoDoExercicio] Correspondência parcial: "${exercicio}"`);
      sessionStorage.setItem(cacheKey, url);
      return url;
    }
  }
  
  // Busca por palavras-chave principais
  const palavrasChave = nomeEssencial.split(' ').filter(p => p.length > 3);
  if (palavrasChave.length > 0) {
    for (const [exercicio, url] of Object.entries(videosExercicios)) {
      const exercicioEssencial = extrairNomeEssencial(exercicio);
      const palavrasExercicio = exercicioEssencial.split(' ');
      
      // Se pelo menos 2 palavras-chave coincidem, considere uma correspondência
      const palavrasCoincidentes = palavrasChave.filter(p => 
        palavrasExercicio.some(pe => pe.includes(p) || p.includes(pe))
      );
      
      if (palavrasCoincidentes.length >= Math.min(2, palavrasChave.length)) {
        console.log(`[encontrarVideoDoExercicio] Correspondência por palavras-chave: "${exercicio}"`);
        sessionStorage.setItem(cacheKey, url);
        return url;
      }
    }
  }
  
  console.log(`[encontrarVideoDoExercicio] Nenhum vídeo encontrado para: "${textoExercicio}"`);
  sessionStorage.setItem(cacheKey, "null");
  return null;
}; 