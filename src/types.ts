export interface HorarioCritico {
  hora: number;
  prob_alagamento: number;
  intensidade_chuva?: string;
}

export interface ClimaAtual {
  rain: number;
  relative_humidity: number;
  temperature: number;
}

export interface ClimatePrevisao {
  distrito: string;
  horario_analise: string;
  data_analise: string;
  fonte: string;
  probabilidade_dia: number;
  nivel_risco: "Baixo" | "Moderado" | "Alto" | "Muito Alto" | string;
  temperatura: number;
  humidade: number;
  precipitacao_estimada: number;
  condicao_atual: string;
  alerta_ativo: boolean;
  detalhes_alerta: string;
  recomendacoes: string[];
  horarios: HorarioCritico[];
  clima_atual: ClimaAtual;
  data_hora_captura: string;
  erro_api?: boolean;
}

export interface District {
  id: number;
  nome: string;
  regiao: "Norte" | "Sul" | "Leste" | "Oeste" | "Centro";
  lat: number;
  long: number;
}
