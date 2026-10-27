import type { Decision } from "../../game/stats";

/**
 * Storage boundary for training history.
 * Free currently uses browser storage. A future paid-plan adapter can use
 * Supabase or another database without coupling the UI to a provider.
 */
export interface TrainingStorage {
  loadDecisions(): Promise<Decision[]>;
  saveDecision(decision: Decision): Promise<void>;
  clearDecisions(): Promise<void>;
}

const DECISIONS_KEY = "pk_decisions_v4";
const MAX_DECISIONS = 2000;

function readLocal(): Decision[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(DECISIONS_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Decision =>
      item !== null &&
      typeof item === "object" &&
      typeof item.spot === "string" &&
      typeof item.action === "string" &&
      typeof item.score === "number" &&
      typeof item.deviation === "string" &&
      typeof item.ts === "number"
    ).slice(-MAX_DECISIONS);
  } catch {
    return [];
  }
}

export const localTrainingStorage: TrainingStorage = {
  async loadDecisions() {
    return readLocal();
  },
  async saveDecision(decision) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DECISIONS_KEY, JSON.stringify([...readLocal(), decision].slice(-MAX_DECISIONS)));
    } catch (error) {
      // Do not silently report a successful save when browser storage fails.
      throw new Error("Não foi possível salvar seu histórico neste navegador. Libere espaço ou verifique as permissões de armazenamento e tente novamente.", { cause: error });
    }
  },
  async clearDecisions() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(DECISIONS_KEY);
    } catch {
      // Clearing local history is best-effort if browser storage is unavailable.
    }
  },
};

/** Swap this provider when a remote storage adapter is implemented and tested. */
export const trainingStorage: TrainingStorage = localTrainingStorage;
