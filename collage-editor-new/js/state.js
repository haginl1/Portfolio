/**
 * State Management Module
 * Handles all application state and persistence
 */

class AppState {
  constructor() {
    this.gridRows = 2;
    this.gridCols = 4;
    this.widthIn = 20;
    this.heightIn = 16;
    this.style = 'warmbw';
    this.mode = 'edit';
    this.selPos = null;
    this.swapSrc = null;
    this.nextId = 0;
    
    this.imgs = [];
    this.order = [];
    this.settings = [];
    this.hiResImgs = {};
    
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(change) {
    this.listeners.forEach(listener => listener(change));
  }

  // Image operations
  addImage(id, name, src) {
    this.imgs.push({ id, name, src });
    this.order.push(id);
    this.settings.push({
      id, name, zoom: 100, panX: 0, panY: 0, rotation: 0, colSpan: 1, rowSpan: 1
    });
    this.notify({ type: 'image_added', id });
    return id;
  }

  deleteImage(id) {
    this.imgs = this.imgs.filter(m => m.id !== id);
    this.order = this.order.filter(o => o !== id);
    this.settings = this.settings.filter(s => s.id !== id);
    delete this.hiResImgs[id];
    this.selPos = null;
    this.notify({ type: 'image_deleted', id });
  }

  replaceImage(id, newSrc) {
    const img = this.imgs.find(m => m.id === id);
    if (img) {
      img.src = newSrc;
      this.notify({ type: 'image_replaced', id });
    }
  }

  // Selection operations
  selectImage(pos) {
    this.selPos = pos;
    this.notify({ type: 'image_selected', pos });
  }

  // Settings operations
  updateImageSettings(id, updates) {
    const setting = this.settings.find(s => s.id === id);
    if (setting) {
      Object.assign(setting, updates);
      this.notify({ type: 'settings_updated', id, updates });
    }
  }

  // Grid operations
  updateGrid(rows, cols) {
    this.gridRows = Math.max(1, Math.min(12, rows));
    this.gridCols = Math.max(1, Math.min(12, cols));
    this.notify({ type: 'grid_updated' });
  }

  // Print operations
  updatePrintSize(width, height) {
    this.widthIn = Math.max(1, Math.min(60, width));
    this.heightIn = Math.max(1, Math.min(60, height));
    this.notify({ type: 'print_size_updated' });
  }

  // Mode operations
  setMode(newMode) {
    this.mode = newMode;
    this.swapSrc = null;
    this.notify({ type: 'mode_changed', mode: newMode });
  }

  // Style operations
  setStyle(newStyle) {
    this.style = newStyle;
    this.notify({ type: 'style_changed', style: newStyle });
  }

  reset() {
    this.imgs = [];
    this.order = [];
    this.settings = [];
    this.hiResImgs = {};
    this.selPos = null;
    this.notify({ type: 'reset' });
  }

  export() {
    return {
      gridRows: this.gridRows,
      gridCols: this.gridCols,
      widthIn: this.widthIn,
      heightIn: this.heightIn,
      style: this.style,
      mode: this.mode,
      imgs: this.imgs,
      order: this.order,
      settings: this.settings,
      hiResImgs: this.hiResImgs,
      nextId: this.nextId
    };
  }

  import(data) {
    Object.assign(this, data);
    this.notify({ type: 'imported' });
  }
}

export default AppState;
