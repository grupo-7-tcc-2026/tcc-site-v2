import { ClimatePrevisao } from "../types";
import { AlertTriangle, Thermometer, Droplets, CloudRain, ShieldCheck, HelpCircle } from "lucide-react";

interface RiskWidgetProps {
  data: ClimatePrevisao;
}

export default function RiskWidget({ data }: RiskWidgetProps) {
  const prob = data.probabilidade_dia;
  const percentage = Math.round(prob * 100);

  // SVG parameters for the semi-circle gauge block
  const radius = 55;
  const circumference = Math.PI * radius; // Half circle length
  const strokeDashoffset = circumference - (prob * circumference);

  const getRiskColors = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "muito alto":
        return {
          bg: "bg-red-500/10 border-red-500/20",
          badge: "bg-red-700 text-white",
          text: "text-red-400",
          glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
          stroke: "stroke-red-600"
        };
      case "alto":
        return {
          bg: "bg-orange-500/10 border-orange-500/20",
          badge: "bg-orange-600 text-white",
          text: "text-orange-400",
          glow: "shadow-[0_0_12px_rgba(249,115,22,0.15)]",
          stroke: "stroke-orange-500"
        };
      case "médio":
        return {
          bg: "bg-yellow-500/10 border-yellow-500/20",
          badge: "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30",
          text: "text-yellow-400",
          glow: "shadow-[0_0_10px_rgba(234,179,8,0.1)]",
          stroke: "stroke-yellow-500"
        };
      default:
        return {
          bg: "bg-green-500/10 border-green-500/20",
          badge: "bg-green-500/20 text-green-400 border border-green-500/30",
          text: "text-green-400",
          glow: "shadow-[0_0_10px_rgba(34,197,94,0.1)]",
          stroke: "stroke-green-500"
        };
    }
  };

  const riskStyle = getRiskColors(data.nivel_risco);

  return (
    <div id="risk-widget-root" className="grid grid-cols-1 md:grid-cols-12 gap-5">
      {/* LEFT COLUMN: GAUGE METRIC */}
      <div className="md:col-span-5 bg-[#09090B] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
        <span className="absolute top-4 left-5 text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">Probabilidade do Dia</span>
        
        {/* Radial Semi Circle Gauge */}
        <div className="relative flex items-center justify-center w-full max-w-[170px] aspect-square mt-7 mb-2">
          <svg className="w-full h-full transform -rotate-180" viewBox="0 0 130 90">
            {/* Background semi circle */}
            <path
              d="M 15 80 A 50 50 0 1 1 115 80"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Colored Forecast Gauge */}
            <path
              d="M 15 80 A 50 50 0 1 1 115 80"
              fill="none"
              className={`${riskStyle.stroke} transition-all duration-1000 ease-out`}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          {/* Floating Percent Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
            <span className="text-4xl font-light text-white font-sans tracking-tight">{percentage}%</span>
            <span className={`text-[9px] uppercase font-bold tracking-[0.1em] px-2.5 py-0.5 rounded mt-2 ${riskStyle.badge} ${riskStyle.glow}`}>
              Risco {data.nivel_risco}
            </span>
          </div>
        </div>

        <div className="text-center mt-3 w-full">
          <p className="text-[10px] text-slate-500 font-mono">Análise de escoamento e saturação do solo em tempo real</p>
        </div>
      </div>

      {/* RIGHT COLUMN: RELEVANT WEATHER CONDITIONS & CHANNELS */}
      <div className="md:col-span-7 bg-[#09090B] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
        {/* TOP PANEL: METRICS TRACKER */}
        <div>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono block mb-4">Dados de Telemetria Local</span>
          <div className="grid grid-cols-3 gap-3">
            {/* Temperature Sensor */}
            <div className="bg-[#050506] p-3 rounded-lg border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded bg-white/5 text-slate-400 flex-shrink-0 border border-white/10">
                <Thermometer size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider font-medium text-slate-500 block leading-tight font-mono">Temperatura</span>
                <span className="text-sm font-semibold text-white mt-0.5 block font-mono">{data.clima_atual.temperature.toFixed(2)}°C</span>
              </div>
            </div>

            {/* Relative Humidity Sensor */}
            <div className="bg-[#050506] p-3 rounded-lg border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded bg-white/5 text-slate-400 flex-shrink-0 border border-white/10">
                <Droplets size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider font-medium text-slate-500 block leading-tight font-mono">Umidade</span>
                <span className="text-sm font-semibold text-white mt-0.5 block font-mono">{data.clima_atual.relative_humidity.toFixed(2)}%</span>
              </div>
            </div>

            {/* Precipitation Sensor */}
            <div className="bg-[#050506] p-3 rounded-lg border border-white/5 flex items-center gap-3">
              <div className="p-2 rounded bg-white/5 text-slate-400 flex-shrink-0 border border-white/10">
                <CloudRain size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider font-medium text-slate-500 block leading-tight font-mono">Chuva Est.</span>
                <span className="text-sm font-semibold text-white mt-0.5 block font-mono">~{data.clima_atual.rain.toFixed(2)}mm</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-3">Dados recuperados às: {data.data_hora_captura}</p>
          </div>
        </div>

        {/* BOTTOM PANEL: FLOOD ALERTTRIANGLE OR INSTRUCTION DETAILS */}
        {/* <div id="risk-alert-pane" className={`mt-5 p-4 rounded-lg border flex items-start gap-3.5 transition-all duration-300 ${riskStyle.bg} ${data.alerta_ativo ? "border-red-500/30 animate-pulse-subtle" : "border-white/5"}`}>
          {data.alerta_ativo ? (
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
          ) : (
            <ShieldCheck className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
          )}
          <div className="flex-1 min-w-0">
            <h4 className={`text-[10px] uppercase tracking-widest font-bold leading-none ${data.alerta_ativo ? "text-red-400 font-mono" : "text-green-400 font-mono"} mb-1.5`}>
              {data.alerta_ativo ? "DIRETRIZ DE PROTEÇÃO URBANA" : "CONDIÇÃO ESTÁVEL DO CLIMA"}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{data.detalhes_alerta}</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
