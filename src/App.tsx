import { useState, useEffect } from "react";
import DistrictSelector from "./components/DistrictSelector";
import RiskWidget from "./components/RiskWidget";
import PrecipitationChart from "./components/PrecipitationChart";
import { SP_DISTRICTS } from "./districtsData";
import distritosSP from "../assets/data/trusted_district.json";

import { ClimatePrevisao } from "./types";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import {
  CloudRain,
  RefreshCw,
  AlertTriangle,
  Clock,
  BookOpen,
  ImagePlus,
  Server,
  CloudLightning,
  Map,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import UploadFile from "./components/UploadFile";

export default function App() {
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [previsao, setPrevisao] = useState<ClimatePrevisao | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [modalFile, setModalFile] = useState(false);

  const toggleModalFile = () => {
    setModalFile(!modalFile);
  };

  useEffect(() => {
    if (!selectedDistrict && SP_DISTRICTS.length > 0) {
      setSelectedDistrict(SP_DISTRICTS[0].nome);
    }
  }, [selectedDistrict]);

  // Keep a digital clock ticking to represent real-time stream status
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  function encontrarDistritoAproximado(latitude: number, longitude: number) {
    const rad = (graus: number) => (graus * Math.PI) / 180;

    const distanciaKm = (lat2: number, lon2: number) => {
      const dLat = rad(lat2 - latitude);
      const dLon = rad(lon2 - longitude);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(latitude)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;

      return 6371 * 2 * Math.asin(Math.sqrt(a));
    };

    const maisProximo = distritosSP.features.reduce<{
      nome: string;
      distancia: number;
    } | null>((melhor, distrito) => {
      const [latDistrito, lonDistrito] = distrito.geometry.coordinates;
      const distancia = distanciaKm(latDistrito, lonDistrito);

      return !melhor || distancia < melhor.distancia
        ? { nome: distrito.properties.nome, distancia }
        : melhor;
    }, null);

    return maisProximo?.nome ?? null;
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        console.log(
          "Localização do usuário:",
          coords.latitude,
          coords.longitude,
        );
        const distrito = encontrarDistritoAproximado(
          coords.latitude,
          coords.longitude,
        );

        if (distrito) {
          setSelectedDistrict(distrito);
        } else {
          console.warn("Localização fora dos distritos de São Paulo");
        }
      },
      (error) => console.error("Erro ao obter localização:", error),
    );
  }, []);

  const fetchPrevisao = async (distrito: string) => {
    if (!distrito) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_URL}/prever-distrito/${encodeURIComponent(distrito)}`,
      );
      if (!response.ok) {
        throw new Error("Erro de rede ao conectar ao servidor do clima.");
      }
      const data: ClimatePrevisao = await response.json();
      console.log(data);
      setPrevisao(data);
    } catch (err: any) {
      console.error(err);
      setError("Falha ao sincronizar parecer climático. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDistrict) {
      fetchPrevisao(selectedDistrict);
    }
  }, [selectedDistrict]);

  const handleRefresh = () => {
    const districtToFetch = selectedDistrict || SP_DISTRICTS[0]?.nome || "";
    if (!districtToFetch) return;

    fetchPrevisao(districtToFetch);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-200 flex flex-col font-sans select-none selection:bg-red-500/10 selection:text-red-400">
      {/* GLOBAL ALERTER BANNER */}
      <div className="bg-red-500/5 border-b border-red-500/15 py-2 px-4 text-center text-[10px] font-bold tracking-[0.15em] uppercase text-red-500 shadow-sm flex items-center justify-center gap-2">
        <CloudLightning size={12} className="animate-pulse" />
        <span>
          Aviso de Evento Climático Extremo • Monitore as Regiões Críticas e
          Áreas de Encosta
        </span>
      </div>

      {/* TOP HEADER MENU NAVIGATION bar */}
      <header className="border-b border-white/5 bg-[#070708]/90 backdrop-blur-md sticky top-0 z-50 px-6 md:px-12 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 rounded bg-white/5 text-slate-300 border border-white/10">
              <CloudRain size={20} className="animate-pulse" />
            </div>
            {/* Absolute flashing warning indicator */}
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border border-[#070708] animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-light tracking-[0.25em] text-white uppercase font-sans">
                Previsão Alagamentos SP
              </h1>
              <span className="text-[8px] bg-white/5 border border-white/10 text-slate-400 font-mono tracking-widest uppercase font-bold px-1.5 py-0.5 rounded">
                V2.5
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mt-0.5">
              Plataforma de Monitoramento e Análise Climática
            </p>
          </div>
        </div>

        {/* Real-time clocks & Dynamic operations stats */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end text-right hidden md:flex">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-[0.15em] font-mono">
              SERVIÇO DE HIDROLOGIA
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[10px] font-medium text-slate-400">
                {currentTime} UTC-3
              </span>
            </div>
          </div>

          <button
            id="refresh-previsao-btn"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 bg-[#09090B] hover:bg-white/5 hover:text-white transition-all font-bold py-2 px-4 rounded border border-white/10 text-[10px] uppercase tracking-wider text-slate-400 disabled:opacity-50 cursor-pointer font-mono"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl w-full mx-auto px-6 md:px-12 pt-6">
        <div className="bg-[#09090B] border border-white/10 rounded-2xl px-5 md:px-6 py-4 shadow-xl">
          <div className="flex w-full items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold font-mono">
                Distrito em monitoramento
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-light text-white tracking-tight">
                {selectedDistrict || "Selecione um distrito"}
              </h2>
            </div>
            <button
              id="calcula-previsao-com-foto"
              className="flex items-center gap-2 bg-[#09090B] hover:bg-[#cba625] hover:text-white transition-all font-bold py-2 px-4 rounded border border-white/10 text-[13px] uppercase tracking-wider text-slate-400 disabled:opacity-50 cursor-pointer font-mono"
              onClick={toggleModalFile}
            >
              <ImagePlus size={12} />
              Calcular Previsão com Foto
            </button>
          </div>
        </div>
      </div>

      {modalFile && (
        <div className="modal flex items-center justify-center fixed top-0 left-0 right-0 bottom-0 z-50">
          <div
            className="overlay fixed w-[100vw] h-[100vh] top-0 left-0 bottom-0 right-0 bg-black/50"
            onClick={toggleModalFile}
          ></div>
          <div className="modal-content absolute w-[70%] bg-[#09090B] p-6 border border-white/10 rounded-2xl shadow-xl mx-auto mt-6">
            <X
              size={20}
              className="absolute top-4 right-4 cursor-pointer text-white hover:text-slate-200 transition-colors m-2"
              onClick={toggleModalFile}
            />
            <div className="mt-8">
              <UploadFile />
            </div>
          </div>
        </div>
      )}

      {/* CORE FRAME CONTAINER LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDE BAR SELECTION COLUMNS (4 cols width) */}
        <div className="lg:col-span-4 h-full flex flex-col">
          <DistrictSelector
            selectedDistrict={selectedDistrict}
            onSelectDistrict={(name) => setSelectedDistrict(name)}
          />
        </div>

        {/* DETAILED MONITOR PANELS (8 cols width) */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            /* IMMERSIVE COMPONENT SKELETON WITH GENERATED BLOCKS during loading state */
            <div id="loader-skeleton" className="space-y-6 animate-pulse">
              <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="h-6 w-48 bg-white/5 rounded"></div>
                <div className="h-4 w-72 bg-white/5 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4">
                  <div className="md:col-span-5 h-[160px] bg-white/5 rounded-2xl"></div>
                  <div className="md:col-span-7 h-[160px] bg-white/5 rounded-2xl"></div>
                </div>
              </div>
              <div className="h-[280px] bg-[#09090B] border border-white/10 rounded-2xl"></div>
            </div>
          ) : error ? (
            /* ERROR MESSAGE ALERT WITH SYNC BUTTON FALLBACK */
            <div
              id="error-card"
              className="bg-red-500/5 border border-red-500/15 rounded-2xl p-8 text-center flex flex-col items-center justify-center"
            >
              <AlertTriangle className="text-red-400 mb-3" size={30} />
              <h3 className="text-xs uppercase tracking-widest font-mono text-slate-200">
                Erro na Sincronização
              </h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                {error}
              </p>
              <button
                id="retry-fetch-btn"
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded border border-red-500/20 transition-all cursor-pointer font-mono"
              >
                Tentar Novamente
              </button>
            </div>
          ) : previsao ? (
            /* DASHBOARD CONTENTS LOADED SUCCESSFULLY */
            <div id="dashboard-content" className="space-y-6 animate-fade-in">
              {/* PRIMARY TITLE FOR DISTRICT */}
              {/* <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden"> */}
              {/* <div className="absolute right-0 top-0 h-full w-[20%] opacity-5 flex items-center justify-center pointer-events-none text-slate-400 shrink-0">
                  <Map size={120} />
                </div> */}

              {/* <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4"> */}
              {/* <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-light text-white tracking-tight flex items-center gap-3 font-sans">
                        {previsao.distrito}
                      </h2>
                      <span className="text-[9px] bg-white/5 border border-white/10 text-slate-400 font-mono tracking-widest uppercase font-bold px-2 py-0.5 rounded">
                        Emitido Recém
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mt-1.5">
                      Parecer emitido às <strong className="text-slate-300 font-medium">{previsao.horario_analise}</strong> do dia <strong className="text-slate-300 font-medium">{previsao.data_analise}</strong>
                    </p>
                  </div> */}

              {/* <div className="flex items-center gap-2 bg-[#050506] border border-white/5 px-3 py-1.5 rounded self-start md:self-auto font-mono text-[9px] tracking-wider">
                    {previsao.erro_api ? (
                      <>
                        <Server size={12} className="text-orange-400" />
                        <span className="text-slate-400">Servidor local: <strong className="text-orange-400 font-semibold font-mono">Modelo Histórico</strong></span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} className="text-red-400 animate-pulse" />
                        <span className="text-slate-400">Análise: <strong className="text-red-400 font-medium font-mono">Cognitiva Gemini</strong></span>
                      </>
                    )}
                  </div> */}
              {/* </div> */}
              {/* </div> */}

              {/* RISK WIDGET: Radial prob chart and detailed current stats */}
              <RiskWidget data={previsao} />

              {/* PRECIPITATION TIMELINE: Line coordinate plot of critical probabilities */}
              <PrecipitationChart
                data={previsao.horarios}
                nivelRisco={previsao.nivel_risco}
              />

              {/* TWO COLUMN EXTRA INFO: Civil Defense & City History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Civil Defense Directives */}
                {/* <div id="civil-defense-panel" className="bg-[#09090B] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 rounded bg-white/5 text-slate-400 border border-white/10">
                        <HeartHandshake size={15} />
                      </div>
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 font-mono">Diretrizes da Defesa Civil</h4>
                    </div>

                  </div>
                  <div className="mt-5 pt-3.5 border-t border-white/5 text-[10px] text-slate-500 flex items-start gap-2">
                    <Info size={12} className="mt-0.5 flex-shrink-0 text-slate-600" />
                    <span>Em emergências, ligue imediatamente para o número <strong className="text-slate-400">199</strong> (Defesa Civil) ou <strong className="text-slate-400">193</strong> (Bombeiros).</span>
                  </div>
                </div> */}

                {/* Urban Context Box */}
                <div
                  id="urban-infrastructure-panel"
                  className="bg-[#09090B] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 rounded bg-white/5 text-slate-400 border border-white/10">
                        <BookOpen size={15} />
                      </div>
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 font-mono">
                        Drenagem Urbana
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      A cidade de São Paulo possui mais de{" "}
                      <strong>200 pontos de risco crítico</strong> mapeados pela
                      Defesa Civil, concentrados nas bacias drenadas pelos
                      canais dos rios <strong>Tietê e Pinheiros</strong>, além
                      de córregos ocultos (ex: Córrego Água Preta e Córrego do
                      Ipiranga).
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-3">
                      Os reservatórios amortecedores municipais (piscinões)
                      atuam absorvendo grandes picos de chuva para liberação
                      controlada após a vazão do pico principal, mitigando o
                      escoamento desordenado sobre as superfícies pavimentadas.
                    </p>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-white/5 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                    <span>Mapeamento do PMRR municipal</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* METEOROLOGICAL DISCLAIMER STYLING FOOTER */}
      <footer className="border-t border-white/5 bg-[#030303] py-8 text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Inteligência de monitoramento SP • gemini engine</span>
          <div className="flex items-center gap-5">
            <span className="hover:text-slate-300 cursor-help transition-colors">
              PMRR SP
            </span>
            <span className="hover:text-slate-300 cursor-help transition-colors">
              CGE SP
            </span>
            <span className="hover:text-slate-300 cursor-help transition-colors">
              DEFESA CIVIL 199
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
