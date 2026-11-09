import type { District } from "./types";

export async function fetchDistricts(): Promise<District[]> {
  const response = await fetch(`${import.meta.env.VITE_APP_URL}/distritos`);
  if (!response.ok) throw new Error("Não foi possível carregar os distritos.");
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("A API retornou uma lista de distritos inválida.");
  return data;
}