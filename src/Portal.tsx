import { useEffect, useState, type FormEvent } from "react";
import App from "./App";
import { Camera, LogOut, UserRound } from "lucide-react";

type Page = "geral" | "rua" | "historico" | "login" | "cadastro";
type User = { id: number; name: string; email: string };
type Report = { id: number; region: string; address: string; probability: number; is_demo: boolean; created_at: string };
type Draft = { region: string; address: string; file: File };
const API = import.meta.env.VITE_APP_URL;
const input = "w-full rounded-lg border border-white/15 bg-[#050506] p-3 text-sm text-white focus:outline-none focus:border-red-400";
const button = "rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 disabled:opacity-50";
const panel = "rounded-2xl border border-white/10 bg-[#09090b] p-6";

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  if (!API) throw new Error("A URL da API não está configurada.");
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API.replace(/\/$/, "")}${path}`, { ...options, headers });
  if (!response.ok) {
    let message = `Erro na API (${response.status}).`;
    if (response.headers.get("content-type")?.includes("application/json")) {
      const body = await response.json();
      if (typeof body.detail === "string") message = body.detail;
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

function getPage(): Page {
  const page = window.location.hash.slice(1);
  return page === "rua" || page === "historico" || page === "login" || page === "cadastro" ? page : "geral";
}

function fileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      if (typeof reader.result !== "string" || !reader.result.includes(",")) {
        reject(new Error("Não foi possível ler a imagem."));
      } else {
        resolve(reader.result.slice(reader.result.indexOf(",") + 1));
      }
    };
    reader.readAsDataURL(file);
  });
}

export default function Portal() {
  const [page, setPage] = useState<Page>(getPage);
  const [token, setToken] = useState(() => sessionStorage.getItem("sessionToken") || "");
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(token));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const update = () => setPage(getPage());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    if (!token) { setUser(null); setSessionLoading(false); return; }
    setSessionLoading(true);
    request<User>("/auth/me", {}, token).then(setUser).catch((err) => {
      console.error(err);
      if (err instanceof ApiError && err.status === 401) {
        setError("Sessão expirada. Faça login novamente.");
        sessionStorage.removeItem("sessionToken");
        setToken("");
      } else {
        setError("Não foi possível validar a sessão. Verifique a conexão e recarregue a página.");
      }
    }).finally(() => setSessionLoading(false));
  }, [token]);

  function navigate(next: Page) {
    setError("");
    setNotice("");
    window.location.hash = next;
    setPage(next);
  }

  async function logout() {
    setBusy(true);
    try {
      await request<void>("/auth/logout", { method: "POST" }, token);
      sessionStorage.removeItem("sessionToken");
      setToken("");
      setUser(null);
      navigate("geral");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível sair.");
    } finally { setBusy(false); }
  }

  async function saveReport() {
    if (!draft) return;
    if (!user || !token) {
      navigate("login");
      setNotice("Faça login para salvar o relatório. Seus dados permanecem nesta aba.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await request("/reports", { method: "POST", body: JSON.stringify({
        region: draft.region, address: draft.address, image: await fileBase64(draft.file),
      }) }, token);
      setShowReport(false);
      navigate("historico");
      setNotice("Relatório demonstrativo salvo no histórico.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o relatório.");
    } finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-[#030303] text-slate-200">
    <nav aria-label="Navegação principal" className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#09090b] px-6 py-4">
      {(["geral", "rua", "historico"] as const).map((item) =>
        <button key={item} onClick={() => navigate(item)} aria-current={page === item ? "page" : undefined}
          className={`rounded px-4 py-2 text-sm capitalize ${page === item ? "bg-red-500/20 text-red-300" : "text-slate-400 hover:text-white"}`}>{item === "historico" ? "Histórico" : item}</button>)}
      <div className="ml-auto flex items-center gap-3 text-sm">
        {sessionLoading ? <span>Validando sessão...</span> : user ? <>
          <span className="flex items-center gap-2"><UserRound size={16} />{user.name}</span>
          <button onClick={logout} disabled={busy} className="flex items-center gap-1 text-slate-400 hover:text-white"><LogOut size={15} /> Sair</button>
        </> : <button className={button} onClick={() => navigate("login")}>Login</button>}
      </div>
    </nav>
    {notice && <p role="status" className="mx-auto mt-4 max-w-5xl px-6 text-sm text-emerald-300">{notice}</p>}
    {error && <p role="alert" className="mx-auto mt-4 max-w-5xl px-6 text-sm text-red-300">{error}</p>}
    {page === "geral" ? <App /> : <main className="mx-auto max-w-5xl px-6 py-8">
      {page === "rua" && <StreetForm draft={draft} onSubmit={(value) => { setDraft(value); setShowReport(true); setError(""); }} />}
      {(page === "login" || page === "cadastro") && <AuthForm mode={page} busy={busy} onSwitch={() => navigate(page === "login" ? "cadastro" : "login")}
        onSubmit={async (name, email, password) => {
          setBusy(true); setError("");
          try {
            if (page === "cadastro") {
              await request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
              navigate("login"); setNotice("Cadastro realizado. Faça login.");
            } else {
              const result = await request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
              sessionStorage.setItem("sessionToken", result.token);
              setToken(result.token); setUser(result.user);
              if (draft) { navigate("rua"); setShowReport(true); }
              else navigate("historico");
            }
          } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível concluir a operação."); }
          finally { setBusy(false); }
        }} />}
      {page === "historico" && (sessionLoading ? <p>Validando sessão...</p> : user && token
        ? <History token={token} />
        : <div className={panel}><h1 className="text-xl">Histórico</h1><p className="my-4 text-slate-400">Faça login para acessar seus relatórios.</p><button className={button} onClick={() => navigate("login")}>Entrar</button></div>)}
    </main>}
    {showReport && draft && page === "rua" && <div role="dialog" aria-modal="true" aria-labelledby="report-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className={`${panel} w-full max-w-2xl`}>
        <h2 id="report-title" className="text-2xl">Relatório demonstrativo</h2>
        <p className="mt-3 rounded bg-amber-500/10 p-3 text-sm text-amber-300">Exemplo fictício: a foto ainda não é analisada. Não use este resultado para decisões de segurança.</p>
        <p className="mt-5">Região: {draft.region}</p><p>Endereço: {draft.address}</p>
        <p className="mt-4 text-xl">Probabilidade ilustrativa: <strong>50%</strong></p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className={button} disabled={busy} onClick={saveReport}>{busy ? "Salvando..." : "Salvar no histórico"}</button>
          <button className={button} onClick={() => window.print()}>Imprimir / salvar PDF</button>
          <button className={button} onClick={() => setShowReport(false)}>Gerar outro relatório</button>
        </div>
      </div>
    </div>}
  </div>;
}

function StreetForm({ draft, onSubmit }: { draft: Draft | null; onSubmit: (draft: Draft) => void }) {
  const [region, setRegion] = useState(draft?.region || "");
  const [address, setAddress] = useState(draft?.address || "");
  const [file, setFile] = useState<File | null>(draft?.file || null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Envie uma imagem JPEG, PNG ou WebP de até 5 MB."); return;
    }
    if (!address.trim()) { setError("Informe o endereço."); return; }
    setError(""); onSubmit({ region, address: address.trim(), file });
  }
  return <form className={panel} onSubmit={submit}>
    <h1 className="text-2xl">Previsão por rua</h1>
    <p className="mt-2 text-sm text-slate-400">Envie uma foto e informe a localização para gerar um relatório demonstrativo.</p>
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div><label htmlFor="street-image" className="flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/25 p-4">
        {preview ? <img src={preview} alt="Prévia da imagem enviada" className="max-h-56 object-contain" /> : <><Camera size={36} /><span>Selecionar imagem</span></>}
      </label><input id="street-image" className="mt-3 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /><p className="mt-2 text-xs text-slate-400">JPEG, PNG ou WebP, até 5 MB.</p></div>
      <div className="space-y-4">
        <label className="block text-sm">Região<select required className={`${input} mt-2`} value={region} onChange={(e) => setRegion(e.target.value)}><option value="">Selecione</option>{["Centro", "Norte", "Sul", "Leste", "Oeste"].map((r) => <option key={r}>{r}</option>)}</select></label>
        <label className="block text-sm">Endereço<input required maxLength={255} className={`${input} mt-2`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua e número" /></label>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <button className={button} type="submit">Gerar relatório</button>
      </div>
    </div>
  </form>;
}

function AuthForm({ mode, busy, onSwitch, onSubmit }: { mode: "login" | "cadastro"; busy: boolean; onSwitch: () => void; onSubmit: (name: string, email: string, password: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return <form className={`${panel} mx-auto max-w-md space-y-4`} onSubmit={(e) => { e.preventDefault(); onSubmit(name, email, password); }}>
    <h1 className="text-2xl">{mode === "login" ? "Login" : "Cadastro"}</h1>
    {mode === "cadastro" && <label className="block text-sm">Nome<input required maxLength={120} className={`${input} mt-2`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
    <label className="block text-sm">E-mail<input required type="email" maxLength={254} className={`${input} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
    <label className="block text-sm">Senha<input required minLength={mode === "cadastro" ? 8 : 1} maxLength={128} type="password" className={`${input} mt-2`} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "cadastro" ? "new-password" : "current-password"} /></label>
    {mode === "cadastro" && <p className="text-xs text-slate-400">A senha deve ter pelo menos 8 caracteres.</p>}
    <button className={button} disabled={busy}>{busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}</button>
    <button type="button" onClick={onSwitch} className="block text-sm text-slate-400 underline">{mode === "login" ? "Faça seu cadastro" : "Já tenho uma conta"}</button>
  </form>;
}

function History({ token }: { token: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    request<Report[]>("/reports", {}, token).then((data) => { if (active) setReports(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Falha ao carregar histórico."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  async function remove(id: number) {
    if (!window.confirm("Excluir este relatório e sua imagem?")) return;
    try { await request(`/reports/${id}`, { method: "DELETE" }, token); setReports((items) => items.filter((item) => item.id !== id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Falha ao excluir relatório."); }
  }
  return <section><h1 className="text-2xl">Histórico</h1><p className="mt-2 text-sm text-slate-400">Seus últimos 100 relatórios salvos.</p>
    {error && <p role="alert" className="mt-4 text-red-300">{error}</p>}
    {loading ? <p className="mt-4">Carregando...</p> : reports.length === 0 ? <p className="mt-4 text-slate-400">Nenhum relatório salvo.</p> :
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reports.map((report) =>
        <article className={panel} key={report.id}>
          <ReportImage id={report.id} token={token} />
          <h2 className="mt-3 font-semibold">{report.address}</h2><p className="text-sm text-slate-400">{report.region} · {new Date(report.created_at).toLocaleString("pt-BR")}</p>
          <p className="mt-2 text-sm">{report.is_demo ? "Demonstração · " : ""}Probabilidade: {Math.round(Number(report.probability) * 100)}%</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={button} onClick={() => setSelectedReport(report)}>Ver / exportar relatório</button>
            <button className={button} onClick={() => remove(report.id)}>Excluir</button>
          </div>
        </article>)}</div>}
    {selectedReport && <HistoryReport report={selectedReport} token={token} onClose={() => setSelectedReport(null)} />}
  </section>;
}

function HistoryReport({ report, token, onClose }: { report: Report; token: string; onClose: () => void }) {
  const [imageReady, setImageReady] = useState(false);
  return <div role="dialog" aria-modal="true" aria-labelledby="history-report-title" className="print-report fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
    <div className={`${panel} max-h-full w-full max-w-2xl overflow-y-auto`}>
      <h2 id="history-report-title" className="text-2xl">{report.is_demo ? "Relatório demonstrativo" : "Relatório"}</h2>
      {report.is_demo && <p className="mt-3 rounded bg-amber-500/10 p-3 text-sm text-amber-300">Exemplo fictício: a foto ainda não é analisada. Não use este resultado para decisões de segurança.</p>}
      <p className="mt-5">Região: {report.region}</p>
      <p>Endereço: {report.address}</p>
      <p>Data: {new Date(report.created_at).toLocaleString("pt-BR")}</p>
      <p className="mt-4 text-xl">{report.is_demo ? "Probabilidade ilustrativa" : "Probabilidade"}: <strong>{Math.round(Number(report.probability) * 100)}%</strong></p>
      <div className="mt-4">
        <p className="mb-2 text-sm">Imagem enviada</p>
        <ReportImage id={report.id} token={token} onReady={setImageReady} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className={button} disabled={!imageReady} onClick={() => window.print()}>Imprimir / salvar PDF</button>
        <button className={button} onClick={onClose}>Fechar</button>
      </div>
    </div>
  </div>;
}

function ReportImage({ id, token, onReady }: { id: number; token: string; onReady?: (ready: boolean) => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    fetch(`${API.replace(/\/$/, "")}/reports/${id}/image`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => { if (!response.ok) throw new Error("Não foi possível carregar a imagem."); return response.blob(); })
      .then((blob) => { if (active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); } })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Erro ao carregar imagem."); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, token]);
  return error ? <p role="alert" className="text-sm text-red-300">{error}</p> : url ? <img src={url} alt="Imagem enviada para o relatório" className={onReady ? "max-h-64 max-w-full rounded-lg object-contain" : "h-40 w-full rounded-lg object-cover"} onLoad={() => onReady?.(true)} onError={() => { onReady?.(false); setError("Não foi possível exibir a imagem. Feche e abra o relatório para tentar novamente."); }} /> : <p className="text-sm text-slate-400">Carregando imagem...</p>;
}
