
import { DataSource } from "../types";
import { MOCK_SOURCES } from "../constants";

const STORAGE_KEY = 'data_warden_sources_v1';

export const StorageService = {
  /**
   * Loads sources from local storage.
   * If no data exists, initializes with MOCK_SOURCES and saves them.
   */
  loadSources: (): DataSource[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load from local storage", e);
    }
    
    // Fallback / Initial Seed
    const initialData = MOCK_SOURCES;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  },

  /**
   * Saves the current state of sources to local storage.
   */
  saveSources: (sources: DataSource[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
    } catch (e) {
      console.error("Failed to save to local storage", e);
    }
  },

  /**
   * Resets storage to default mock data (useful for demos).
   */
  resetStorage: (): DataSource[] => {
    localStorage.removeItem(STORAGE_KEY);
    return StorageService.loadSources();
  }
};
