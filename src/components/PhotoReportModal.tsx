import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Download,
  FileText,
  History,
  MapPin,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { ClimatePrevisao, PhotoReportLocation } from "../types";

interface PhotoReportModalProps {
  forecast: ClimatePrevisao;
  location: PhotoReportLocation;
  onClose: () => void;
}

interface SavedPhotoReport {
  id: string;
  savedAt: string;
  photoName: string;
  zone: string;
  neighborhood: string;
  street: string;
  forecast: ClimatePrevisao;
}

const historyStorageKey = "flood-photo-report-history";

const isSavedPhotoReport = (value: unknown): value is SavedPhotoReport => {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<SavedPhotoReport>;
  return (
    typeof report.id === "string" &&
    typeof report.savedAt === "string" &&
    typeof report.photoName === "string" &&
    typeof report.zone === "string" &&
    typeof report.neighborhood === "string" &&
    typeof report.street === "string" &&
    typeof report.forecast === "object" &&
    report.forecast !== null &&
    typeof report.forecast.probabilidade_dia === "number" &&
    Array.isArray(report.forecast.horarios)
  );
};

const formatLocation = (report: SavedPhotoReport) =>
  [report.street, report.neighborhood, report.zone, report.forecast.distrito]
    .filter(Boolean)
    .join(" • ");

export default function PhotoReportModal({
  forecast,
  location,
  onClose,
}: PhotoReportModalProps) {
  const [history, setHistory] = useState<SavedPhotoReport[]>([]);
  const [activeReport, setActiveReport] = useState<SavedPhotoReport | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const report = activeReport ?? {
    id: "current",
    savedAt: new Date().toISOString(),
    photoName: location.photo.name,
    zone: location.zone,
    neighborhood: location.neighborhood,
    street: location.street,
    forecast,
  };
  const isCurrentReport = activeReport === null;
  const probability = Math.round(report.forecast.probabilidade_dia * 100);
  const riskColor =
    report.forecast.nivel_risco.toLowerCase().includes("alto")
      ? "text-red-300 border-red-400/20 bg-red-500/10"
      : report.forecast.nivel_risco.toLowerCase().includes("moderado")
        ? "text-amber-300 border-amber-400/20 bg-amber-500/10"
        : "text-emerald-300 border-emerald-400/20 bg-emerald-500/10";
  const hours = report.forecast.horarios ?? [];

  useEffect(() => {
    if (!isCurrentReport) {
      setPhotoUrl(null);
      return;
    }

    const url = URL.createObjectURL(location.photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [isCurrentReport, location.photo]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(historyStorageKey);
      if (!saved) return;

      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        throw new Error("Formato de histórico inválido.");
      }
      setHistory(parsed.filter(isSavedPhotoReport));
    } catch {
      setHistoryError("Não foi possível carregar o histórico salvo neste navegador.");
    }
  }, []);

  const saveToHistory = () => {
    const savedReport: SavedPhotoReport = {
      ...report,
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    const nextHistory = [savedReport, ...history];

    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(nextHistory));
      setHistory(nextHistory);
      setFeedback("Relatório salvo no histórico.");
      setHistoryError("");
    } catch {
      setFeedback("");
      setHistoryError("Não foi possível salvar o relatório no histórico do navegador.");
    }
  };

  const downloadReport = () => {
    const content = [
      "RELATÓRIO DE PREVISÃO DE ALAGAMENTO",
      `Distrito: ${report.forecast.distrito}`,
      `Localização informada: ${formatLocation(report) || "Não informada"}`,
      `Foto: ${report.photoName}`,
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      `Probabilidade de alagamento: ${probability}%`,
      `Nível de risco: ${report.forecast.nivel_risco}`,
      `Condição atual: ${report.forecast.condicao_atual}`,
      "",
      "HORÁRIOS CRÍTICOS",
      ...hours.map(
        ({ hora, prob_alagamento }) =>
          `${String(hora).padStart(2, "0")}:00 — ${Math.round(prob_alagamento * 100)}%`,
      ),
      "",
      "DETALHES",
      report.forecast.detalhes_alerta,
      "",
      "RECOMENDAÇÕES",
      ...report.forecast.recomendacoes.map((recommendation) => `- ${recommendation}`),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-alagamento-${report.forecast.distrito
      .toLowerCase()
      .replace(/\s+/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const chartPoints = hours.map((item, index) => {
    const x = hours.length < 2 ? 200 : 24 + (index / (hours.length - 1)) * 352;
    const probability = Math.min(1, Math.max(0, item.prob_alagamento));
    const y = 132 - probability * 100;
    return { x, y, hour: item.hora, probability };
  });
  const chartPath = chartPoints
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        id="photo-report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-report-title"
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/15 bg-[#09090B] p-5 shadow-2xl sm:p-7"
      >
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #photo-report-dialog, #photo-report-dialog * { visibility: visible !important; }
            #photo-report-dialog {
              position: absolute !important;
              inset: 0 auto auto 0 !important;
              width: 100% !important;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
              border: 0 !important;
              background: #09090b !important;
              box-shadow: none !important;
            }
          }
        `}</style>
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {showHistory && (
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                aria-label="Voltar ao relatório"
                className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
              >
                <ArrowLeft size={17} />
              </button>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Previsão por foto
              </p>
              <h2
                id="photo-report-title"
                className="mt-1 text-2xl font-light tracking-wide text-white"
              >
                {showHistory ? "Histórico" : "Relatório"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showHistory && (
              <button
                type="button"
                onClick={() => {
                  setShowHistory(true);
                  setFeedback("");
                  setHistoryError("");
                }}
                className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300 transition hover:border-white/30 hover:bg-white/5"
              >
                <History size={15} />
                <span>Histórico</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar relatório"
              className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {showHistory ? (
          <div className="space-y-3">
            {historyError && (
              <p role="alert" className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                {historyError}
              </p>
            )}
            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 p-10 text-center">
                <History className="mx-auto mb-3 text-slate-500" size={24} />
                <p className="text-sm text-slate-300">Nenhum relatório salvo ainda.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Salve um relatório para encontrá-lo aqui depois.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setActiveReport(item);
                    setShowHistory(false);
                    setFeedback("");
                    setHistoryError("");
                  }}
                  className="flex w-full flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.05] sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="block text-sm font-medium text-white">
                      {item.forecast.distrito}
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {formatLocation(item) || item.photoName}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{new Date(item.savedAt).toLocaleString("pt-BR")}</span>
                    <strong className="text-white">
                      {Math.round(item.forecast.probabilidade_dia * 100)}%
                    </strong>
                  </span>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex min-h-40 items-center gap-4 rounded-xl border border-white/10 bg-[#050506] p-4">
                  {isCurrentReport ? (
                    photoUrl && (
                      <img
                        src={photoUrl ?? undefined}
                        alt={`Foto enviada: ${report.photoName}`}
                        className="h-28 w-28 rounded-lg border border-white/10 object-cover"
                      />
                    )
                  ) : (
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-500">
                      <FileText size={28} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Local monitorado
                    </p>
                    <p className="mt-2 flex items-start gap-2 text-sm text-white">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-amber-300" />
                      <span>{formatLocation(report) || report.forecast.distrito}</span>
                    </p>
                    <p className="mt-2 truncate text-xs text-slate-500" title={report.photoName}>
                      {report.photoName}
                    </p>
                    <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${riskColor}`}>
                      Risco {report.forecast.nivel_risco}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#050506] p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Resumo da previsão
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {report.forecast.detalhes_alerta}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    {report.forecast.alerta_ativo ? (
                      <AlertTriangle size={14} className="text-amber-300" />
                    ) : (
                      <ShieldCheck size={14} className="text-emerald-300" />
                    )}
                    {report.forecast.condicao_atual}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#050506] p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Clock3 size={15} className="text-amber-300" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                    Horários de alagamento
                  </h3>
                </div>
                {chartPoints.length > 0 ? (
                  <>
                    <svg
                      viewBox="0 0 400 160"
                      role="img"
                      aria-label="Gráfico de probabilidade de alagamento por horário"
                      className="mt-5 w-full overflow-visible"
                    >
                      {[32, 82, 132].map((y) => (
                        <line
                          key={y}
                          x1="24"
                          x2="376"
                          y1={y}
                          y2={y}
                          stroke="rgba(255,255,255,0.08)"
                          strokeDasharray="4 5"
                        />
                      ))}
                      {chartPath && (
                        <path
                          d={chartPath}
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      {chartPoints.map(({ x, y, hour, probability }) => (
                        <g key={`${hour}-${x}`}>
                          <circle cx={x} cy={y} r="5" fill="#fbbf24" />
                          <text
                            x={x}
                            y="153"
                            fill="#94a3b8"
                            fontSize="10"
                            textAnchor="middle"
                          >
                            {String(hour).padStart(2, "0")}h
                          </text>
                          <title>{`${hour}h: ${Math.round(probability * 100)}%`}</title>
                        </g>
                      ))}
                    </svg>
                    {/* <div className="mt-2 grid grid-cols-3 gap-2">
                      {hours.map(({ hora, prob_alagamento }) => (
                        <div
                          key={hora}
                          className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-2 text-center"
                        >
                          <span className="block text-[10px] text-slate-500">
                            {String(hora).padStart(2, "0")}h
                          </span>
                          <strong className="mt-1 block text-xs text-slate-200">
                            {Math.round(prob_alagamento * 100)}%
                          </strong>
                        </div>
                      ))}
                    </div> */}
                  </>
                ) : (
                  <p className="py-12 text-center text-sm text-slate-500">
                    Não há dados horários disponíveis para esta previsão.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  Probabilidade de alagar
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <strong className="text-4xl font-light text-white">{probability}%</strong>
                  <span className="text-xs text-slate-400">nas próximas horas</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:min-w-52">
                <button
                  type="button"
                  onClick={downloadReport}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  <FileText size={15} />
                  Gerar Outro Relatório
                </button>
                <button
                  type="button"
                  onClick={saveToHistory}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  <Save size={15} />
                  Salvar no histórico
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-bold text-black transition hover:bg-amber-300"
                >
                  <Download size={15} />
                  Baixar PDF
                </button>
              </div>
            </div>
            {feedback && (
              <p role="status" className="mt-3 text-right text-xs text-emerald-300">
                {feedback}
              </p>
            )}
            {historyError && (
              <p role="alert" className="mt-3 text-right text-xs text-red-300">
                {historyError}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
