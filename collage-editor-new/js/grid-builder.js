/**
 * Grid Builder Module
 * Handles grid layout and rendering
 */

class GridBuilder {
  constructor(state) {
    this.state = state;
  }

  build(containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    
    grid.innerHTML = '';
    grid.style.gridTemplateRows = `repeat(${this.state.gridRows}, 1fr)`;
    grid.style.gridTemplateColumns = `repeat(${this.state.gridCols}, 1fr)`;
    
    const placements = this.packCells();
    const usedIds = new Set(placements.map(p => p.id).filter(id => id !== null));
    
    placements.forEach((placement, pos) => {
      const cell = this.createCell(placement, pos);
      grid.appendChild(cell);
    });
    
    // Add empty cells in the actual unoccupied slots (accounting for spans)
    const totalSlots = this.state.gridRows * this.state.gridCols;
    const usedSlots = placements.reduce((sum, p) => sum + p.colSpan * p.rowSpan, 0);
    const emptyCount = Math.max(0, totalSlots - usedSlots);
    if (emptyCount > 0) {
      const occupied = Array.from({ length: this.state.gridRows }, () =>
        new Array(this.state.gridCols).fill(false));
      for (const p of placements) {
        for (let dr = 0; dr < p.rowSpan; dr++) {
          for (let dc = 0; dc < p.colSpan; dc++) {
            occupied[p.row + dr][p.col + dc] = true;
          }
        }
      }
      for (let r = 0; r < this.state.gridRows; r++) {
        for (let c = 0; c < this.state.gridCols; c++) {
          if (!occupied[r][c]) {
            const emptyCell = this.createEmptyCell();
            emptyCell.style.gridColumn = `${c + 1} / span 1`;
            emptyCell.style.gridRow = `${r + 1} / span 1`;
            grid.appendChild(emptyCell);
          }
        }
      }
    }

    // Hidden-overflow badge (images that exist in state but don't fit the grid)
    this.renderOverflowBadge(grid, placements.length);
  }

  renderOverflowBadge(grid, placedCount) {
    const existing = document.getElementById('overflowBadge');
    if (existing) existing.remove();

    const hidden = this.state.order.length - placedCount;
    if (hidden <= 0) return;

    const badge = document.createElement('div');
    badge.id = 'overflowBadge';
    badge.className = 'overflow-badge';
    badge.innerHTML = `+${hidden} hidden — enlarge the grid or delete to show`;
    grid.parentElement.appendChild(badge);
  }

  createCell(placement, pos) {
    const cell = document.createElement('div');
    cell.id = 'c' + pos;
    cell.className = 'cell';
    
    if (placement.type === 'img' && placement.id !== null) {
      const id = placement.id;
      const set = this.state.settings.find(s => s.id === id);
      const img = this.state.imgs.find(m => m.id === id);
      
      if (set && img) {
        cell.classList.add(this.state.style);
        if (this.state.selPos === pos) cell.classList.add('sel');
        if (this.state.swapSrc === pos) cell.classList.add('swap');
        
        const inner = document.createElement('div');
        inner.id = 'i' + pos;
        inner.className = 'inner';
        inner.style.backgroundImage = `url('${img.src}')`;
        const rot = (set.rotation || 0) * Math.PI / 180;
        inner.style.transform = 
          `rotate(${set.rotation || 0}deg) scale(${set.zoom / 100}) translate(${set.panX}%, ${set.panY}%)`;
        
        const lbl = document.createElement('div');
        lbl.className = 'lbl';
        lbl.textContent = set.name;
        
        const ps = document.createElement('div');
        ps.className = 'pos';
        ps.textContent = `${pos + 1}`;
        
        cell.append(inner, lbl, ps);
        cell.style.gridColumn = `${placement.col + 1} / span ${placement.colSpan}`;
        cell.style.gridRow = `${placement.row + 1} / span ${placement.rowSpan}`;
        cell.dataset.col = placement.col;
        cell.dataset.row = placement.row;

        const handleR = document.createElement('div');
        handleR.className = 'resize-handle resize-handle-r';
        handleR.title = 'Drag to resize width';
        this.attachResizeDrag(handleR, id, 'col');

        const handleB = document.createElement('div');
        handleB.className = 'resize-handle resize-handle-b';
        handleB.title = 'Drag to resize height';
        this.attachResizeDrag(handleB, id, 'row');

        cell.append(handleR, handleB);

        if (this.state.mode === 'edit') {
          cell.onclick = () => this.onCellClick(pos);
        } else if (this.state.mode === 'arrange') {
          cell.onclick = () => this.onCellSwap(pos);
        }
      }
    }

    return cell;
  }

  attachResizeDrag(handle, imageId, axis) {
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const set = this.state.settings.find(s => s.id === imageId);
      if (!set) return;
      const grid = document.getElementById('grid');
      const cell = handle.parentElement;
      if (!grid || !cell) return;

      const cellW = grid.clientWidth / this.state.gridCols;
      const cellH = grid.clientHeight / this.state.gridRows;
      const startX = e.clientX;
      const startY = e.clientY;
      const startColSpan = set.colSpan || 1;
      const startRowSpan = set.rowSpan || 1;
      const startCol = parseInt(cell.dataset.col, 10) || 0;
      const startRow = parseInt(cell.dataset.row, 10) || 0;
      // Clamp drag growth to what fits from this cell's position
      const maxColSpan = this.state.gridCols - startCol;
      const maxRowSpan = this.state.gridRows - startRow;
      let moved = false;

      handle.setPointerCapture(e.pointerId);
      handle.classList.add('dragging');

      const onMove = (ev) => {
        if (axis === 'col') {
          const delta = Math.round((ev.clientX - startX) / cellW);
          if (delta !== 0) moved = true;
          const next = Math.max(1, Math.min(maxColSpan, startColSpan + delta));
          if (next !== set.colSpan) {
            set.colSpan = next;
            cell.style.gridColumn = `${startCol + 1} / span ${next}`;
          }
        } else {
          const delta = Math.round((ev.clientY - startY) / cellH);
          if (delta !== 0) moved = true;
          const next = Math.max(1, Math.min(maxRowSpan, startRowSpan + delta));
          if (next !== set.rowSpan) {
            set.rowSpan = next;
            cell.style.gridRow = `${startRow + 1} / span ${next}`;
          }
        }
      };

      const onUp = () => {
        handle.releasePointerCapture?.(e.pointerId);
        handle.classList.remove('dragging');
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
        if (moved) {
          // Block the synthetic click from the drag — but only briefly, in case
          // the browser doesn't actually fire one (which would leave the listener stale)
          const cancelClick = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
          window.addEventListener('click', cancelClick, { capture: true });
          setTimeout(() => window.removeEventListener('click', cancelClick, { capture: true }), 50);
          // Notify once at end: triggers save + full rebuild + input sync
          this.state.notify({ type: 'image_resized', id: imageId });
        }
      };

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    });

    // Prevent click-through to the cell underneath
    handle.addEventListener('click', (e) => e.stopPropagation());
  }

  createEmptyCell() {
    const cell = document.createElement('div');
    cell.className = 'cell empty';
    cell.onclick = () => document.getElementById('addFile')?.click();
    return cell;
  }

  packCells() {
    // Span-aware packing that mirrors CSS Grid's `grid-auto-flow: row`:
    // for each image, scan row-major for the first slot where its full
    // colSpan/rowSpan fits in unoccupied cells. Images that don't fit
    // anywhere are treated as overflow (excluded from placements →
    // surfaced via the +N hidden badge).
    const rows = this.state.gridRows;
    const cols = this.state.gridCols;
    const occupied = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const placements = [];

    for (const id of this.state.order) {
      const set = this.state.settings.find(s => s.id === id);
      if (!set) continue;
      const cs = Math.max(1, Math.min(cols, set.colSpan || 1));
      const rs = Math.max(1, Math.min(rows, set.rowSpan || 1));

      let placed = false;
      for (let r = 0; r <= rows - rs && !placed; r++) {
        for (let c = 0; c <= cols - cs && !placed; c++) {
          let fits = true;
          for (let dr = 0; dr < rs && fits; dr++) {
            for (let dc = 0; dc < cs && fits; dc++) {
              if (occupied[r + dr][c + dc]) fits = false;
            }
          }
          if (fits) {
            for (let dr = 0; dr < rs; dr++) {
              for (let dc = 0; dc < cs; dc++) occupied[r + dr][c + dc] = true;
            }
            placements.push({ id, row: r, col: c, colSpan: cs, rowSpan: rs, type: 'img', set });
            placed = true;
          }
        }
      }
    }

    return placements;
  }

  onCellClick(pos) {
    this.state.selectImage(pos);
  }

  onCellSwap(pos) {
    if (this.state.swapSrc === null) {
      this.state.swapSrc = pos;
      this.build('grid');
    } else {
      const srcId = this.state.order[this.state.swapSrc];
      const dstId = this.state.order[pos];
      [this.state.order[this.state.swapSrc], this.state.order[pos]] = 
      [this.state.order[pos], this.state.order[this.state.swapSrc]];
      this.state.swapSrc = null;
      this.build('grid');
      this.state.notify({ type: 'images_swapped' });
    }
  }
}

export default GridBuilder;
