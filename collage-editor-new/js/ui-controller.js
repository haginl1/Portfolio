/**
 * UI Controller Module
 * Handles all UI interactions and DOM updates
 */

class UIController {
  constructor(state, gridBuilder) {
    this.state = state;
    this.gridBuilder = gridBuilder;
    this.updateCount = 0;
  }

  init() {
    this.setupEventListeners();
    this.setupStateListeners();
  }

  setupEventListeners() {
    // File inputs
    document.getElementById('addFile').onchange = (e) => this.handleAddFiles(e);
    document.getElementById('repFile').onchange = (e) => this.handleReplaceFile(e);

    // Buttons
    document.getElementById('mEdit').onclick = () => this.state.setMode('edit');
    document.getElementById('mArr').onclick = () => this.state.setMode('arrange');

    // Adjustment sliders
    ['zoom', 'panX', 'panY', 'rot', 'colSpan', 'rowSpan'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => this.updateImageSettings();
    });

    // Grid inputs (with confirm-on-shrink-would-hide-images guard)
    document.getElementById('gridRows').onchange = (e) =>
      this.changeGrid(parseInt(e.target.value), this.state.gridCols, e.target);
    document.getElementById('gridCols').onchange = (e) =>
      this.changeGrid(this.state.gridRows, parseInt(e.target.value), e.target);

    // Print size inputs
    document.getElementById('widthIn').onchange = (e) =>
      this.state.updatePrintSize(parseFloat(e.target.value), this.state.heightIn);
    document.getElementById('heightIn').onchange = (e) =>
      this.state.updatePrintSize(this.state.widthIn, parseFloat(e.target.value));

    // Preset selector
    document.getElementById('preset').onchange = (e) => this.applyPreset(e.target.value);

    // Style chips (scoped to elements with data-style so size chips don't trigger this)
    document.querySelectorAll('.chip[data-style]').forEach(chip => {
      chip.onclick = (e) => this.state.setStyle(e.currentTarget.dataset.style);
    });

    // Size quick chips (data-w / data-h; -1 means span full axis)
    document.querySelectorAll('.chip.sz').forEach(chip => {
      chip.onclick = (e) => {
        const w = parseInt(e.currentTarget.dataset.w, 10);
        const h = parseInt(e.currentTarget.dataset.h, 10);
        this.setSpan(w, h);
      };
    });
  }

  setupStateListeners() {
    this.state.subscribe(change => {
      switch (change.type) {
        case 'grid_updated':
          this.updateGridDisplay();
          this.gridBuilder.build('grid');
          break;
        case 'print_size_updated':
          this.updatePrintSizeDisplay();
          this.gridBuilder.build('grid');
          break;
        case 'image_selected':
          this.updateSelectionPanel(change.pos);
          break;
        case 'mode_changed':
          this.updateModeButtons();
          this.updateEditsPanelState();
          break;
        case 'style_changed':
          this.updateStyleChips();
          this.gridBuilder.build('grid');
          break;
        case 'image_added':
        case 'image_deleted':
        case 'image_replaced':
          this.updateImageCount();
          this.gridBuilder.build('grid');
          break;
        case 'image_resized':
          this.gridBuilder.build('grid');
          if (this.state.selPos !== null && this.state.order[this.state.selPos] === change.id) {
            this.syncSpanInputs(change.id);
          }
          break;
      }
    });
  }

  syncSpanInputs(id) {
    const set = this.state.settings.find(s => s.id === id);
    if (!set) return;
    document.getElementById('colSpan').value = set.colSpan;
    document.getElementById('rowSpan').value = set.rowSpan;
    document.getElementById('colSpanV').textContent = set.colSpan;
    document.getElementById('rowSpanV').textContent = set.rowSpan;
  }

  updateImageSettings() {
    if (this.state.selPos === null) return;

    const id = this.state.order[this.state.selPos];
    const set = this.state.settings.find(s => s.id === id);
    if (!set) return;

    set.zoom = +document.getElementById('zoom').value;
    set.panX = +document.getElementById('panX').value;
    set.panY = +document.getElementById('panY').value;
    set.rotation = +document.getElementById('rot').value;

    const rawCol = parseInt(document.getElementById('colSpan').value, 10);
    const rawRow = parseInt(document.getElementById('rowSpan').value, 10);
    if (Number.isFinite(rawCol)) {
      set.colSpan = Math.max(1, Math.min(this.state.gridCols, rawCol));
    }
    if (Number.isFinite(rawRow)) {
      set.rowSpan = Math.max(1, Math.min(this.state.gridRows, rawRow));
    }

    document.getElementById('zoomV').textContent = set.zoom + '%';
    document.getElementById('panXV').textContent = set.panX + '%';
    document.getElementById('panYV').textContent = set.panY + '%';
    document.getElementById('rotV').textContent = set.rotation + '°';
    document.getElementById('colSpanV').textContent = set.colSpan;
    document.getElementById('rowSpanV').textContent = set.rowSpan;

    this.gridBuilder.build('grid');
  }

  updateSelectionPanel(pos) {
    const id = this.state.order[pos];
    const set = this.state.settings.find(s => s.id === id);
    if (!set) return;

    document.getElementById('info').innerHTML = `<h4>${set.name}</h4><p>Position #${pos + 1}</p>`;
    document.getElementById('zoom').value = set.zoom;
    document.getElementById('zoomV').textContent = set.zoom + '%';
    document.getElementById('panX').value = set.panX;
    document.getElementById('panXV').textContent = set.panX + '%';
    document.getElementById('panY').value = set.panY;
    document.getElementById('panYV').textContent = set.panY + '%';
    document.getElementById('rot').value = set.rotation || 0;
    document.getElementById('rotV').textContent = (set.rotation || 0) + '°';
    document.getElementById('name').value = set.name;
    document.getElementById('colSpan').value = set.colSpan || 1;
    document.getElementById('rowSpan').value = set.rowSpan || 1;
    document.getElementById('colSpanV').textContent = set.colSpan || 1;
    document.getElementById('rowSpanV').textContent = set.rowSpan || 1;

    this.updateEditsPanelState();
  }

  updateModeButtons() {
    const isEdit = this.state.mode === 'edit';
    document.getElementById('mEdit').className = 'mode' + (isEdit ? ' on' : '');
    document.getElementById('mArr').className = 'mode' + (!isEdit ? ' on swap' : '');
  }

  updateEditsPanelState() {
    const panel = document.getElementById('edits');
    const isActive = this.state.mode === 'edit' && this.state.selPos !== null;
    panel.classList.toggle('is-disabled', !isActive);
  }

  updateStyleChips() {
    document.querySelectorAll('.chip[data-style]').forEach(c => c.classList.remove('on'));
    const selector = `.chip[data-style="${this.state.style}"]`;
    document.querySelector(selector)?.classList.add('on');
    this.gridBuilder.build('grid');
  }

  updateGridDisplay() {
    document.getElementById('gridRows').value = this.state.gridRows;
    document.getElementById('gridCols').value = this.state.gridCols;
    document.getElementById('slotsNote').innerHTML = `<b>${this.state.gridRows * this.state.gridCols}</b> slots`;
  }

  updatePrintSizeDisplay() {
    document.getElementById('widthIn').value = this.state.widthIn;
    document.getElementById('heightIn').value = this.state.heightIn;
    const grid = document.getElementById('grid');
    if (grid) grid.style.aspectRatio = `${this.state.widthIn} / ${this.state.heightIn}`;
  }

  updateImageCount() {
    document.getElementById('cnt').innerHTML = `<b>${this.state.order.length}</b> images`;
  }

  changeGrid(newRows, newCols, inputEl) {
    const capacity = newRows * newCols;
    const imageCount = this.state.order.length;
    if (imageCount > capacity) {
      const hidden = imageCount - capacity;
      const ok = confirm(`This will hide ${hidden} image${hidden === 1 ? '' : 's'} (they stay saved). Continue?`);
      if (!ok) {
        inputEl.value = inputEl.id === 'gridRows' ? this.state.gridRows : this.state.gridCols;
        return;
      }
    }
    this.state.updateGrid(newRows, newCols);
  }

  applyPreset(preset) {
    if (preset === 'custom') return;
    
    const presets = {
      '20x16': [20, 16, 2, 4],
      '16x20': [16, 20, 4, 2],
      '8x10': [8, 10, 4, 2]
    };

    if (presets[preset]) {
      const [w, h, r, c] = presets[preset];
      this.state.updatePrintSize(w, h);
      this.state.updateGrid(r, c);
    }
  }

  setSpan(w, h) {
    if (this.state.selPos === null) return;
    const set = this.state.settings.find(s => s.id === this.state.order[this.state.selPos]);
    if (!set) return;

    set.colSpan = w === -1 ? this.state.gridCols : Math.max(1, Math.min(this.state.gridCols, w));
    set.rowSpan = h === -1 ? this.state.gridRows : Math.max(1, Math.min(this.state.gridRows, h));
    document.getElementById('colSpan').value = set.colSpan;
    document.getElementById('rowSpan').value = set.rowSpan;
    document.getElementById('colSpanV').textContent = set.colSpan;
    document.getElementById('rowSpanV').textContent = set.rowSpan;
    this.gridBuilder.build('grid');
  }

  handleAddFiles(e) {
    const files = Array.from(e.target.files);
    // Delegate to app
    if (window.app) window.app.addImages(files);
  }

  handleReplaceFile(e) {
    const file = e.target.files[0];
    if (!file || this.state.selPos === null) return;
    if (window.app) window.app.replaceImage(this.state.order[this.state.selPos], file);
  }
}

export default UIController;
