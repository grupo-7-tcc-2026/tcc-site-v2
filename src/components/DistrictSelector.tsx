import { useState } from "react";
import { SP_DISTRICTS } from "../districtsData";
import { District } from "../types";
import { Search, MapPin, Grid, AlertTriangle } from "lucide-react";

interface DistrictSelectorProps {
  selectedDistrict: string;
  onSelectDistrict: (name: string) => void;
}

type RegionTab = "Todos" | "Centro" | "Oeste" | "Sul" | "Norte" | "Leste";

export default function DistrictSelector({
  selectedDistrict,
  onSelectDistrict,
}: DistrictSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<RegionTab>("Todos");

  const filteredDistricts = SP_DISTRICTS.filter((d) => {
    const matchesSearch = d.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
      searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );
    const matchesTab = activeTab === "Todos" || d.region === activeTab;
    return matchesSearch && matchesTab;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Alto":
        return "text-red-400 bg-red-500/10 border border-red-500/20";
      case "Moderado":
        return "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20";
      case "Baixo":
        return "text-green-400 bg-green-500/10 border border-green-500/20";
      default:
        return "text-slate-400 bg-white/5 border border-white/10";
    }
  };

  const getRegionLabel = (region: "Norte" | "Sul" | "Leste" | "Oeste" | "Centro") => {
    switch (region) {
      case "Norte": return "Z. Norte";
      case "Sul": return "Z. Sul";
      case "Leste": return "Z. Leste";
      case "Oeste": return "Z. Oeste";
      case "Centro": return "Centro";
    }
  };

  return (
    <div id="district-selector-root" className="bg-[#09090B] border border-white/10 rounded-2xl p-6 flex flex-col h-full shadow-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-lg bg-white/5 text-slate-300 border border-white/10">
          <MapPin size={18} />
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold font-display">Selecionar Distrito</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Selecione uma região para avaliar o risco de alagamento</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <input
          id="district-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar distrito (ex: Aricanduva, Sé...)"
          className="w-full bg-[#050506] border border-white/10 text-white placeholder-slate-600 pl-10 pr-4 py-2.5 rounded-lg text-xs tracking-wide focus:outline-none focus:border-red-500/50 transition-all font-mono"
        />
      </div>

      {/* Region Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-thin scrollbar-thumb-white/5 whitespace-nowrap">
        {(["Todos", "Centro", "Oeste", "Sul", "Norte", "Leste"] as RegionTab[]).map((tab) => (
          <button
            id={`tab-${tab.toLowerCase()}`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-white/10 text-white border border-white/20"
                : "bg-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === "Todos" ? "Todos" : tab === "Oeste" ? "Z. Oeste" : tab === "Sul" ? "Z. Sul" : tab === "Norte" ? "Z. Norte" : tab === "Leste" ? "Z. Leste" : "Centro"}
          </button>
        ))}
      </div>

      {/* District List */}
      <div className="flex-1 overflow-y-auto max-h-[360px] md:max-h-[500px] space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/5">
        {filteredDistricts.length > 0 ? (
          filteredDistricts.map((district) => {
            const isSelected = selectedDistrict.toLowerCase() === district.nome.toLowerCase();
            return (
              <button
                id={`district-${district.nome.toLowerCase().replace(/\s+/g, "-")}`}
                key={district.nome}
                onClick={() => onSelectDistrict(district.nome)}
                className={`w-full text-left p-3.5 rounded-lg transition-all border flex items-center justify-between group cursor-pointer ${
                  isSelected
                    ? "bg-white/5 border-white/20 text-white shadow-md font-medium"
                    : "bg-[#070708]/60 hover:bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex flex-col min-w-0 pr-3">
                  <span className={`text-xs tracking-tight ${isSelected ? "text-white font-semibold" : "text-slate-300 group-hover:text-white"}`}>{district.nome}</span>
                  <span className="text-[9px] text-slate-500 font-mono truncate flex items-center gap-1 mt-1">
                    <Grid size={8} />
                    {getRegionLabel(district.regiao)} 
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4 bg-white/5 rounded-lg border border-dashed border-white/10">
            <AlertTriangle className="text-slate-600 mb-2" size={20} />
            <p className="text-xs text-slate-400">Nenhum distrito encontrado</p>
            <p className="text-[10px] text-slate-500 mt-1">Refine o termo digitado ou altere o filtro regional.</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Total: {filteredDistricts.length} de {SP_DISTRICTS.length} distritos</span>
      </div>
    </div>
  );
}
