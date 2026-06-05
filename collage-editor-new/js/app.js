/**
 * Main Application Module
 * Orchestrates all components
 */

import AppState from './state.js';
import StorageManager from './storage.js';
import ImageManager from './image-manager.js';
import GridBuilder from './grid-builder.js';
import PrintGenerator from './print-generator.js';
import UIController from './ui-controller.js';

class CollageEditorApp {
  constructor() {
    this.state = new AppState();
    this.storage = new StorageManager();
    this.gridBuilder = new GridBuilder(this.state);
    this.printGen = new PrintGenerator(this.state);
    this.ui = new UIController(this.state, this.gridBuilder);
  }

  async init() {
    // Load saved state
    const savedData = this.storage.load();
    if (savedData) {
      this.state.import(savedData);
      this.state.nextId = Math.max(...this.state.order, 0) + 1;
    }

    // Initialize UI
    this.ui.init();
    this.setupButtons();
    this.setupServiceWorker();

    // Initial render
    this.render();

    // Save state on changes
    this.state.subscribe(change => {
      if (!['image_selected', 'mode_changed'].includes(change.type)) {
        this.save();
      }
    });
  }

  setupButtons() {
    const bind = (id, handler) => {
      const el = document.getElementById(id);
      if (el) el.onclick = handler;
    };

    bind('addBtn', () => document.getElementById('addFile').click());
    bind('repBtn', () => {
      if (this.state.selPos === null) {
        alert('Tap an image first');
        return;
      }
      document.getElementById('repFile').click();
    });
    bind('delBtn', () => this.deleteImage());
    bind('resetOne', () => this.resetOne());
    bind('resetImage', () => this.resetImageTransforms());
    bind('resetAll', () => this.resetAll());
    bind('clearAll', () => this.clearAll());
    bind('generatePrint', () => this.generatePrint());
  }

  addImages(files) {
    let done = 0;
    files.forEach(file => {
      const id = this.state.nextId++;
      
      // Process hi-res version
      ImageManager.processImage(file, (hiSrc) => {
        this.state.hiResImgs[id] = hiSrc;
        this.save();
      }, true);

      // Process preview version
      ImageManager.processImage(file, (src, name) => {
        this.state.addImage(id, name, src);
        done++;
        if (done === files.length) {
          this.render();
          this.save();
        }
      }, false);
    });
  }

  replaceImage(id, file) {
    // Hi-res version
    ImageManager.processImage(file, (hiSrc) => {
      this.state.hiResImgs[id] = hiSrc;
      this.save();
    }, true);

    // Preview version
    ImageManager.processImage(file, (src, name) => {
      const img = this.state.imgs.find(m => m.id === id);
      const set = this.state.settings.find(s => s.id === id);
      if (img) img.src = src;
      if (set) set.name = name;
      this.render();
      this.save();
    }, false);
  }

  deleteImage() {
    if (this.state.selPos === null) return;
    if (!confirm('Delete this image?')) return;

    const id = this.state.order[this.state.selPos];
    this.state.deleteImage(id);
    this.render();
    this.save();
  }

  resetOne() {
    if (this.state.selPos === null) return;
    const set = this.state.settings.find(s => s.id === this.state.order[this.state.selPos]);
    if (set) {
      set.zoom = 100;
      set.panX = 0;
      set.panY = 0;
      set.rotation = 0;
      set.colSpan = 1;
      set.rowSpan = 1;
      this.ui.updateSelectionPanel(this.state.selPos);
      this.render();
      this.save();
    }
  }

  resetImageTransforms() {
    if (this.state.selPos === null) return;
    const set = this.state.settings.find(s => s.id === this.state.order[this.state.selPos]);
    if (set) {
      set.zoom = 100;
      set.panX = 0;
      set.panY = 0;
      set.rotation = 0;
      this.ui.updateSelectionPanel(this.state.selPos);
      this.render();
      this.save();
    }
  }

  resetAll() {
    if (!confirm('Reset to default images?')) return;
    this.state.reset();
    this.state.style = 'warmbw';
    this.state.updateGrid(2, 4);
    this.state.updatePrintSize(20, 16);
    this.render();
    this.save();
  }

  clearAll() {
    if (!confirm('Remove ALL images?')) return;
    this.state.reset();
    this.render();
    this.save();
  }

  async generatePrint() {
    const progress = document.getElementById('progress');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');

    progress.classList.add('show');

    try {
      await this.printGen.generate(({ text, percent }) => {
        progressText.textContent = text;
        progressFill.style.width = percent + '%';
      });
      
      setTimeout(() => progress.classList.remove('show'), 3000);
    } catch (err) {
      console.error('Print generation error:', err);
      alert('Error generating print');
      progress.classList.remove('show');
    }
  }

  save() {
    this.storage.save(this.state);
    const saved = document.getElementById('saved');
    if (saved) {
      saved.classList.add('show');
      setTimeout(() => saved.classList.remove('show'), 2000);
    }
  }

  render() {
    this.gridBuilder.build('grid');
    this.ui.updateImageCount();
    this.ui.updateGridDisplay();
    this.ui.updateModeButtons();
    this.ui.updateStyleChips();
    this.ui.updateEditsPanelState();
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('collage-sw.js').catch(() => {});
      });
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new CollageEditorApp();
  window.app.init();
});

export default CollageEditorApp;
