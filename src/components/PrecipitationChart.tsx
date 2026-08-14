import { useState } from "react";
import { HorarioCritico } from "../types";
import { CloudRain, Radio, Clock, TrendingUp } from "lucide-react";

interface PrecipitationChartProps {
  data: HorarioCritico[];
  nivelRisco: string;
}

export default function PrecipitationChart({ data, nivelRisco }: PrecipitationChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  // Parameters for SVG coordinates
  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Find coordinates for each data point
  // X is uniformly spaced
  // Y represents 1 - prob_alagamento (since SVG Y 0 is at the top)
  const points = data.map((item, index) => {
    const x = paddingX + (index / (data.length - 1)) * chartWidth;
    // Cap probability between 0 and 1
    const p = Math.min(1, Math.max(0, item.prob_alagamento));
    const y = paddingY + (1 - p) * chartHeight;
    return { x, y, item, index };
  });

  // Calculate SVG Path for line
  const linePath = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  // Calculate SVG Path for area under the line
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  const getRiskGradientColor = () => {
    switch (nivelRisco.toLowerCase()) {
      case "muito alto":
        return { stroke: "stroke-red-500", fill: "url(#red-grad)", dotColor: "#ef4444", accentBg: "bg-red-500/10", border: 'border-red-500/20', text: 'text-red-400' };
      case "alto":
        return { stroke: "stroke-orange-500", fill: "url(#orange-grad)", dotColor: "#f97316", accentBg: "bg-orange-500/10", border: 'border-orange-500/20', text: 'text-orange-400' };
      case "moderado":
        return { stroke: "stroke-yellow-500", fill: "url(#yellow-grad)", dotColor: "#f59e0b", accentBg: "bg-yellow-500/10", border: 'border-yellow-500/20', text: 'text-yellow-400' };
      default:
        return { stroke: "stroke-green-400", fill: "url(#green-grad)", dotColor: "#10b981", accentBg: "bg-green-500/10", border: 'border-green-500/20', text: 'text-green-400' };
    }
  };

  const colors = getRiskGradientColor();

  const getIntensityBadge = (prob: number) => {
    if (prob > 0.8) return { label: "Crítico", style: "bg-red-500/20 text-red-300 border-red-500/20" };
    if (prob > 0.5) return { label: "Perigo", style: "bg-orange-500/20 text-orange-300 border-orange-500/20" };
    if (prob > 0.25) return { label: "Atenção", style: "bg-yellow-500/20 text-yellow-300 border-yellow-500/20" };
    return { label: "Normal", style: "bg-green-500/15 text-green-400 border-green-500/15" };
  };

  return (
    <div id="precipitation-chart-root" className="bg-[#09090B] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-lg bg-white/5 text-slate-300 border border-white/10">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold font-display">Probabilidade Por Horário</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Variação do risco de inundação nas próximas horas</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#050506] px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-mono text-slate-400">
          <Radio size={10} className="text-red-500 animate-pulse" />
          <span>Monitoramento em Tempo Real</span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative flex-1 bg-[#050506] rounded-xl p-2 border border-white/5 overflow-hidden">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto select-none"
        >
          {/* Gradients definitions */}
          <defs>
            <linearGradient id="red-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="orange-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="yellow-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="green-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = paddingY + p * chartHeight;
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                className="stroke-white/5 stroke-1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Y Axis labels */}
          {[1, 0.75, 0.5, 0.25, 0].map((p, i) => {
            const y = paddingY + (1 - p) * chartHeight;
            return (
              <text
                key={i}
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-500 font-mono text-[8px] font-medium"
              >
                {Math.round(p * 100)}%
              </text>
            );
          })}

          {/* Area under curve */}
          <path d={areaPath} className="fill-current transition-all duration-500" style={{ fill: colors.fill }} />

          {/* Main trend line */}
          <path
            d={linePath}
            fill="none"
            className={`${colors.stroke} stroke-2 transition-all duration-500`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vertical indicator for hovered item */}
          {hoveredIndex !== null && (
            <line
              x1={points[hoveredIndex].x}
              y1={paddingY}
              x2={points[hoveredIndex].x}
              y2={height - paddingY}
              className="stroke-white/20 stroke-1"
              strokeDasharray="2 2"
            />
          )}

          {/* Dots on line vertices */}
          {points.map((p, i) => (
            <g key={i}>
              {/* Larger trigger area for touch/hover */}
              <circle
                cx={p.x}
                cy={p.y}
                r={16}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Visual dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 5 : 3.5}
                fill={colors.dotColor}
                className="stroke-[#050506] stroke-1 transition-all duration-150 cursor-pointer pointer-events-none"
              />
              {/* Pulsing indicator for current index */}
              {hoveredIndex === i && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={9}
                  fill="none"
                  stroke={colors.dotColor}
                  className="stroke-1 opacity-40 animate-ping pointer-events-none"
                />
              )}
            </g>
          ))}

          {/* X Axis Timeline Labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - paddingY + 16}
              textAnchor="middle"
              className={`font-mono text-[9px] ${hoveredIndex === i ? "fill-white font-bold" : "fill-slate-500 font-medium"}`}
            >
              {p.item.hora}h
            </text>
          ))}
        </svg>

        {/* Hover Information Box inside Chart */}
        {hoveredIndex !== null && (
          <div className="absolute top-2 right-2 bg-[#0C0C0E]/95 border border-white/10 rounded p-2 flex items-center gap-2 shadow-2xl backdrop-blur-sm animate-fade-in">
            <div className="p-1 rounded bg-white/5 text-slate-400 border border-white/5">
              <CloudRain size={12} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-sans font-medium">
                Hora: <strong className="text-white">{data[hoveredIndex].hora}:00</strong>
              </span>
              <span className="text-[10px] font-mono text-white font-bold">
                Risco: {Math.round(data[hoveredIndex].prob_alagamento * 100)}%
              </span>
            </div>
            <span className={`text-[8px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider float-right ${getIntensityBadge(data[hoveredIndex].prob_alagamento).style}`}>
              {getIntensityBadge(data[hoveredIndex].prob_alagamento).label}
            </span>
          </div>
        )}
      </div>

      {/* Grid Quick Legend Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 text-[10px]">
        {data.slice(0, 3).map((item, idx) => (
          <div key={idx} className="bg-[#050506]/80 p-2.5 rounded-lg border border-white/5 flex items-center gap-2 justify-between">
            <span className="text-slate-500 font-mono font-medium">{item.hora}:00</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${item.prob_alagamento > 0.65 ? "bg-red-500 animate-pulse" : "bg-green-500"}`}></span>
              <span className="text-slate-200 font-semibold font-mono">{Math.round(item.prob_alagamento * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
