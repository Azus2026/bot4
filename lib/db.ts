import { openDB, DBSchema, IDBPDatabase } from "idb";
import { AppSettings, BusinessLead, SearchCacheEntry, SellerProfile } from "@/types/lead";

const DB_NAME = "radar_de_clientes_db";
const DB_VERSION = 1;

interface RadarDBSchema extends DBSchema {
  leads: {
    key: string;
    value: BusinessLead;
    indexes: {
      "by-status": string;
      "by-savedAt": string;
      "by-category": string;
    };
  };
  searchCache: {
    key: string;
    value: SearchCacheEntry;
    indexes: {
      "by-timestamp": number;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

export const DEFAULT_SELLER_PROFILE: SellerProfile = {
  fullName: "Jose Rivas",
  brandName: "Hik",
  onchainTrackRecordUrl: "https://app.zaps.wtf/creator/Hik18977534",
  clanName: "Hik | ETHGas ⛽",
  clanScore: 618,
  volumeGenerated: "$3.8M USD",
  globalRank: "#6 de 355",
  zapsCount: 212,
  primaryServices: [
    "Páginas Web Modernas de Alta Velocidad y Conversión",
    "Agentes de Inteligencia Artificial para WhatsApp (Atención 24/7)",
    "Sistemas Automatizados de Citas y Reservas Online",
  ],
  investorProgramTitle: "Grupo Inicial de Inversores Fundadores (Trading On-Chain)",
  specialIncentives:
    "Para negocios con local u oficina que requieran remodelación: levantamiento de planos 3D y presupuesto de arquitectura interior 100% GRATIS solo por unirse al grupo inicial de inversores.",
  defaultTone: "CONSULTIVE",
};

export const DEFAULT_SETTINGS: AppSettings = {
  googleCloudApiKey: "",
  placesApiQuotaLimit: 800,
  placesApiCallCountThisMonth: 0,
  lastQuotaResetDate: new Date().toISOString(),
  sellerProfile: DEFAULT_SELLER_PROFILE,
};

let dbPromise: Promise<IDBPDatabase<RadarDBSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<RadarDBSchema>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB no está disponible en el servidor"));
  }

  if (!dbPromise) {
    dbPromise = openDB<RadarDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store Leads
        if (!db.objectStoreNames.contains("leads")) {
          const leadStore = db.createObjectStore("leads", { keyPath: "id" });
          leadStore.createIndex("by-status", "status");
          leadStore.createIndex("by-savedAt", "savedAt");
          leadStore.createIndex("by-category", "category");
        }

        // Store Search Cache
        if (!db.objectStoreNames.contains("searchCache")) {
          const cacheStore = db.createObjectStore("searchCache", { keyPath: "cacheKey" });
          cacheStore.createIndex("by-timestamp", "timestamp");
        }

        // Store Settings
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
      },
    });
  }

  return dbPromise;
}

export class DataRepository {
  // === LEADS ===
  static async saveLead(lead: BusinessLead): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    const leadToSave: BusinessLead = {
      ...lead,
      savedAt: lead.savedAt || now,
      updatedAt: now,
    };
    await db.put("leads", leadToSave);
  }

  static async saveLeadsBatch(leads: BusinessLead[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction("leads", "readwrite");
    const now = new Date().toISOString();
    for (const lead of leads) {
      await tx.store.put({
        ...lead,
        savedAt: lead.savedAt || now,
        updatedAt: now,
      });
    }
    await tx.done;
  }

  static async getLeadById(id: string): Promise<BusinessLead | undefined> {
    const db = await getDb();
    return await db.get("leads", id);
  }

  static async getAllLeads(filters?: { status?: string; category?: string }): Promise<BusinessLead[]> {
    const db = await getDb();
    let leads = await db.getAll("leads");

    if (filters?.status) {
      leads = leads.filter((l) => l.status === filters.status);
    }
    if (filters?.category) {
      leads = leads.filter((l) => l.category.toLowerCase().includes(filters.category!.toLowerCase()));
    }

    return leads.sort((a, b) => {
      const dateA = a.updatedAt || a.savedAt || "";
      const dateB = b.updatedAt || b.savedAt || "";
      return dateB.localeCompare(dateA);
    });
  }

  static async updateLeadStatus(id: string, status: BusinessLead["status"]): Promise<void> {
    const db = await getDb();
    const lead = await db.get("leads", id);
    if (lead) {
      lead.status = status;
      lead.updatedAt = new Date().toISOString();
      await db.put("leads", lead);
    }
  }

  static async updateLeadNotes(id: string, notes: string, nextFollowUpDate?: string): Promise<void> {
    const db = await getDb();
    const lead = await db.get("leads", id);
    if (lead) {
      lead.notes = notes;
      if (nextFollowUpDate !== undefined) {
        lead.nextFollowUpDate = nextFollowUpDate;
      }
      lead.updatedAt = new Date().toISOString();
      await db.put("leads", lead);
    }
  }

  static async deleteLead(id: string): Promise<void> {
    const db = await getDb();
    await db.delete("leads", id);
  }

  // === SEARCH CACHE (7 DÍAS TTL) ===
  static async getCachedSearch(cacheKey: string): Promise<SearchCacheEntry | null> {
    try {
      const db = await getDb();
      const entry = await db.get("searchCache", cacheKey);
      if (!entry) return null;

      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - entry.timestamp > SEVEN_DAYS_MS) {
        await db.delete("searchCache", cacheKey);
        return null;
      }

      return entry;
    } catch {
      return null;
    }
  }

  static async setCachedSearch(entry: SearchCacheEntry): Promise<void> {
    try {
      const db = await getDb();
      await db.put("searchCache", entry);
    } catch (e) {
      console.warn("No se pudo guardar la caché de búsqueda:", e);
    }
  }

  // === SETTINGS & QUOTA ===
  static async getSettings(): Promise<AppSettings> {
    try {
      const db = await getDb();
      const stored = await db.get("settings", "app_settings");
      if (!stored) {
        // Inicializar con valores predeterminados
        await db.put("settings", DEFAULT_SETTINGS, "app_settings");
        return DEFAULT_SETTINGS;
      }
      return {
        ...DEFAULT_SETTINGS,
        ...stored,
        sellerProfile: {
          ...DEFAULT_SETTINGS.sellerProfile,
          ...(stored.sellerProfile || {}),
        },
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const db = await getDb();
    const current = await this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...settings,
      sellerProfile: {
        ...current.sellerProfile,
        ...(settings.sellerProfile || {}),
      },
    };
    await db.put("settings", updated, "app_settings");
    return updated;
  }

  static async incrementQuotaCounter(): Promise<number> {
    try {
      const db = await getDb();
      const current = await this.getSettings();

      // Reset mensual si es un nuevo mes
      const lastReset = new Date(current.lastQuotaResetDate);
      const now = new Date();
      let count = current.placesApiCallCountThisMonth + 1;

      if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        count = 1;
        current.lastQuotaResetDate = now.toISOString();
      }

      current.placesApiCallCountThisMonth = count;
      await db.put("settings", current, "app_settings");
      return count;
    } catch {
      return 1;
    }
  }
}
