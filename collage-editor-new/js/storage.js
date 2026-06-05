/**
 * Storage Module
 * Handles LocalStorage persistence
 */

class StorageManager {
  constructor(storageKey = 'collageEditor') {
    this.storageKey = storageKey;
  }

  save(state) {
    try {
      const data = state.export();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Storage save error:', err);
      return false;
    }
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Storage load error:', err);
      return null;
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (err) {
      console.error('Storage clear error:', err);
      return false;
    }
  }

  saveState(state) {
    this.save(state);
  }
}

export default StorageManager;
