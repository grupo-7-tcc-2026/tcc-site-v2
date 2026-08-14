import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 4200;

app.use(express.json());

// Initialize Gemini SDK with User-Agent telemetry
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini SDK initialized successfully.");
} else {
  console.log("No GEMINI_API_KEY environment variable found. Falling back to local deterministic predictive synthesis.");
}

// Map districts of São Paulo to fallback historical features (elevation, susceptibility, rivers nearby)
// so the offline/fallback prediction remains ultra-realistic and highly engaging.
const getHistoricalFallbackData = (distrito: string) => {
  const norm = distrito.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Predict values based on São Paulo's actual flood-prone areas (rivers/valleys: Tiete, Pinheiros, Anhangabau, Aricanduva)
  let baseProb = 0.15;
  let riskLevel = "Baixo";
  let description = "Região em altitude favorável, com boa drenagem e sem histórico recente de grandes transbordamentos.";
  let recommendations = [
    "Monitore as atualizações climáticas regulares.",
    "Evite descartar lixo em vias públicas para prevenir obstrução de bueiros."
  ];

  if (/sé|republica|liberdade|bela vista|anhangabau|cambuci/.test(norm)) {
    baseProb = 0.72;
    riskLevel = "Alto";
    description = "Região central propensa a alagamentos rápidos em pontos históricos devido à alta impermeabilização do solo e refluxo de galerias pluviais (especialmente Anhangabaú e baixada do Glicério).";
    recommendations = [
      "Evite estacionar em subsolos ou áreas rebaixadas da baixada do Glicério.",
      "Acompanhe alertas do CGE (Centro de Gerenciamento de Emergências) em tempo real.",
      "Não tente atravessar cruzamentos com acúmulo de água no centro histórico."
    ];
  } else if (/lapa|pompeia|perdizes|barra funda/.test(norm)) {
    baseProb = 0.85;
    riskLevel = "Alto";
    description = "Área de fundo de vale associada à bacia do Córrego Água Preta e Córrego Sumaré. Histórico recorrente de alagamento rápido sob viadutos ferroviários e na Avenida Pompeia.";
    recommendations = [
      "Evite transitar pela Avenida Pompeia e proximidades do Viaduto Antártica durante a forte chuva.",
      "Atenção redobrada nas vias próximas aos trilhos de trem na Barra Funda.",
      "Mantenha-se abrigado em andares elevados caso seja surpreendido."
    ];
  } else if (/mooca|vile formosa|tatuape|belem|bras|pari/.test(norm)) {
    baseProb = 0.78;
    riskLevel = "Alto";
    description = "Bacia do Rio Tamanduateí. Vias baixas impermeabilizadas historicamente sujeitas a enchentes lentas decorrentes do transbordamento de córregos afluentes.";
    recommendations = [
      "Evite circular pela Avenida Estado e vias próximas ao tamanduateí.",
      "Guarde documentos e itens de valor em locais altos da casa.",
      "Reduza velocidade em automóveis para evitar aquaplanagem."
    ];
  } else if (/pinheiros|itaim bibi|brooklin|vila olimpia|morumbi|butanta/.test(norm)) {
    baseProb = 0.65;
    riskLevel = "Moderado";
    description = "Proximidade com a calha do Rio Pinheiros. Alagamentos pontuais na Marginal Pinheiros e avenidas estruturais como Santo Amaro e Juscelino Kubitschek.";
    recommendations = [
      "Evite as faixas da direita em trechos rebaixados da Marginal Pinheiros.",
      "Desvie de poças e pontos de retenção de água nas proximidades da Praça da Bandeira.",
      "Em caso de alagamento de via, permaneça no veículo apenas se seguro."
    ];
  } else if (/aricanduva|sao mateus|itaquera|cidade tiradentes/.test(norm)) {
    baseProb = 0.94;
    riskLevel = "Muito Alto";
    description = "Região cruzada pelo Rio Aricanduva, um dos pontos de inundação mais dramáticos de São Paulo. Altamente vulnerável durante temporais prolongados, com potencial para interrupção completa do fluxo viário.";
    recommendations = [
      "NUNCA tente trafegar pela Avenida Aricanduva em caso de alerta vermelho.",
      "Abandone o veículo imediatamente caso a água alcance a metade das rodas.",
      "Moradores de encostas e margens de córregos devem acionar a Defesa Civil ao primeiro sinal de instabilidade no solo."
    ];
  } else if (/freguesia|brasilandia|perus|pirituba|jaragua/.test(norm)) {
    baseProb = 0.58;
    riskLevel = "Moderado";
    description = "Relevo acidentado na Zona Norte. Risco associado a enxurradas rápidas descendo encostas e pequenos córregos locais de transbordamento rápido (por exemplo, em Perus).";
    recommendations = [
      "Cuidado com deslizamentos de terra em encostas acentuadas.",
      "Mantenha calhas e ralos domésticos desobstruídos.",
      "Evite travessias sobre pontilhões de córregos locais."
    ];
  } else if (/santana|tucuruvi|vila maria|vila guilherme/.test(norm)) {
    baseProb = 0.81;
    riskLevel = "Alto";
    description = "Borda norte da calha do Rio Tietê. Avenidas baixas como Luiz Dumont Villares e canais integrados sofrem refluxo recorrente.";
    recommendations = [
      "Evite a Avenida Cruzeiro do Sul sob o metrô em episódios de tempestade extrema.",
      "Evite travessias próximas à Marginal Tietê na altura da Ponte das Bandeiras.",
      "Não toque em fiação elétrica caída na água."
    ];
  } else if (/capao redondo|jd angela|grajau|parelheiros|santo amaro/.test(norm)) {
    baseProb = 0.50;
    riskLevel = "Moderado";
    description = "Zonas extremas da Zona Sul. Risco concentrado em córregos locais represados e enxurradas de encosta rápidas nas proximidades de mananciais.";
    recommendations = [
      "Atenção aos níveis dos córregos locais da bacia Billings e Guarapiranga.",
      "Não entre em contato com água de enchente para evitar contaminações como leptospirose.",
      "Abrigue animais de estimação em locais secos e seguros."
    ];
  } else {
    // Other districts default to balanced moderate risk
    baseProb = 0.35;
    riskLevel = "Moderado";
    description = "Susceptibilidade moderada padrão. Alagamentos podem ocorrer em pontos de microdrenagem localizada caso a chuva ultrapasse 30 mm/h.";
    recommendations = [
      "Prepare-se para possíveis lentidões no trânsito local.",
      "Não jogue lixo na rua para evitar o bloqueio das grelhas de captação."
    ];
  }

  // Generate hourly critical coordinates matching current hour
  const currentHour = new Date().getHours();
  const horariosCriticos = [];
  for (let i = 0; i < 6; i++) {
    const targetHour = (currentHour + i) % 24;
    // Calculate simulated dynamic fluctuations matching district characteristics
    const hourFactor = Math.sin((i / 5) * Math.PI); // sine bell curve representing temporal storm
    const hourlyProb = Math.min(0.99, Math.max(0.05, baseProb * (0.6 + 0.4 * hourFactor) + (Math.random() * 0.1 - 0.05)));
    
    let intensidade = "Leve";
    if (hourlyProb > 0.8) intensidade = "Forte";
    else if (hourlyProb > 0.5) intensidade = "Moderada";
    else if (hourlyProb > 0.25) intensidade = "Leve";
    else intensidade = "Nula";

    horariosCriticos.push({
      hora: targetHour,
      prob_alagamento: hourlyProb,
      intensidade_chuva: intensidade
    });
  }

  // Dynamic values mimicking fresh sensors
  const temp = Math.round(18 + Math.random() * 8);
  const hum = Math.round(75 + Math.random() * 24);
  const prec = baseProb > 0.6 ? Math.round(15 + Math.random() * 25) : Math.round(Math.random() * 12);
  let cond = "Nublado";
  if (baseProb > 0.8) cond = "Temporal com Raios";
  else if (baseProb > 0.6) cond = "Chuva Forte";
  else if (baseProb > 0.4) cond = "Chuvizco persistente";
  else if (baseProb > 0.2) cond = "Nublado";
  else cond = "Ensolarado entre nuvens";

  return {
    probabilidade_dia: baseProb,
    nivel_risco: riskLevel,
    temperatura: temp,
    humidade: hum,
    precipitacao_estimada: prec,
    condicao_atual: cond,
    alerta_ativo: baseProb > 0.6,
    detalhes_alerta: description,
    recomendacoes: recommendations,
    horarios_criticos: horariosCriticos
  };
};

// GET Forecast Endpoint
app.get("/api/previsao", async (req, res) => {
  const distrito = req.query.distrito as string;

  if (!distrito) {
    return res.status(400).json({ error: "O parâmetro 'distrito' é obrigatório." });
  }

  // Get current local time details
  const timeString = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dateString = new Date().toLocaleDateString("pt-BR");

  if (!ai) {
    // Return high-quality localized fallback prediction
    const fallbackData = getHistoricalFallbackData(distrito);
    return res.json({
      distrito,
      horario_analise: timeString,
      data_analise: dateString,
      fonte: "Previsão Histórica / CGE Fallback",
      ...fallbackData
    });
  }

  try {
    const systemPrompt = `Você é o meteorologista e especialista em hidrologia urbana do centro de monitoramento climático da cidade de São Paulo.
Sua missão é emitir pareceres meteorológicos e de riscos de alagamento precisos e fundamentados para qualquer distrito de São Paulo solicitado pelo usuário.
Baseado em dados históricos, bacias hidrográficas de SP (ex: Tamanduateí, Tietê, Pinheiros, Aricanduva), e relevo, forneça uma análise realista de probabilidade de alagamento nas próximas 6 horas a contar do momento atual.

A resposta DEVE ser um objeto JSON estritamente válido respeitando o seguinte esquema de tipos:
{
  "probabilidade_dia": number (valor decimal de probabilidade diária geral de alagamento entre 0 e 1, exemplo 0.9375),
  "nivel_risco": "Baixo" | "Moderado" | "Alto" | "Muito Alto" (estatisticamente relacionado à probabilidade do dia),
  "temperatura": number (temperatura atual típica em graus Celsius, ex: 22),
  "humidade": number (humidade relativa atual %, ex: 85),
  "precipitacao_estimada": number (precipitação esperada em mm para as próximas horas, ex: 35),
  "condicao_atual": string (breve descrição em português, ex: "Chuva Forte", "Instabilidade isolada"),
  "alerta_ativo": boolean (true para risco Alto ou Muito Alto),
  "detalhes_alerta": string (explicação sucinta e contextualizada em português sobre as características físicas do distrito que justificam esse risco, como córregos próximos, se é fundo de vale, impermeabilização, etc.),
  "recomendacoes": [string] (lista de 3 recomendações de segurança cruciais para a população local de acordo com o risco),
  "horarios_criticos": Array<{
     "hora": number (representando a hora do dia de 0 a 23, ex: 14),
     "prob_alagamento": number (decimal entre 0 e 1, ex: 0.8125)
  }> (Deve conter exatamente 6 elementos mapeando as próximas 6 horas progressivas)
}

Regras Cruciais:
1. Retorne APENAS o JSON puro, sem formatações adicionais de bloco markdown (sem \`\`\`json).
2. Seja super realista sobre o distrito especificado! Por exemplo, "Aricanduva" tem riscos altíssimos de alagamento devido ao rio homônimo; "Mooca" possui pontos baixos históricos; "Sé" possui problemas de refluxo central; "Alto de Pinheiros" é mais seguro, mas com pontos específicos.
3. Considere que a hora atual é por volta de ${new Date().getHours()}h. Projete as próximas 6 horas sequencialmente para a chave 'horarios_criticos'.`;

    // Internal helper for retrying with fallback models (such as gemini-3.1-flash-lite) if gemini-3.5-flash is unavailable
    const generateWithBackup = async (aiClient: any, sysPrompt: string, userPrompt: string) => {
      const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
      let lastErr: any = null;

      for (const model of models) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[Gemini] Chamando modelo ${model} (tentativa ${attempt}/2)...`);
            const response = await aiClient.models.generateContent({
              model,
              contents: userPrompt,
              config: {
                systemInstruction: sysPrompt,
                responseMimeType: "application/json",
                temperature: 0.65,
              }
            });
            if (response && response.text) {
              return { text: response.text, model };
            }
          } catch (err: any) {
            lastErr = err;
            console.warn(`[Gemini] Falha no modelo ${model} tenta ${attempt}/2: ${err?.message || err}`);
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 200));
            }
          }
        }
      }
      throw lastErr || new Error("Não foi possível gerar conteúdo com nenhum dos modelos Gemini disponíveis.");
    };

    const result = await generateWithBackup(ai, systemPrompt, `Forneça a análise climática e de risco de alagamento em tempo real para o distrito: ${distrito}.`);
    const bodyText = result.text?.trim() || "";
    const cleanedText = bodyText.replace(/^```json/i, "").replace(/```$/, "").trim();
    const data = JSON.parse(cleanedText);

    return res.json({
      distrito,
      horario_analise: timeString,
      data_analise: dateString,
      fonte: `Análise Inteligente (${result.model})`,
      ...data
    });

  } catch (error) {
    console.log("Aviso: Falha temporária na API do Gemini. Ativando modelo de contingência local.", error?.toString() || error);
    // Graceful fallback is always present to offer pristine service stability
    const fallbackData = getHistoricalFallbackData(distrito);
    return res.json({
      distrito,
      horario_analise: timeString,
      data_analise: dateString,
      erro_api: true,
      fonte: "Previsão de Contingência Local",
      ...fallbackData
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server climatológico rodando na porta ${PORT}`);
  });
}

startServer();
