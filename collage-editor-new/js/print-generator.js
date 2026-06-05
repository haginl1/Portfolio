/**
 * Print Generator Module
 * Handles high-quality print generation
 */

import ImageManager from './image-manager.js';

class PrintGenerator {
  constructor(state) {
    this.state = state;
  }

  async generate(onProgress) {
    if (this.state.order.length === 0) {
      alert('Add some images first!');
      return;
    }

    const size = {
      w: Math.round(this.state.widthIn * 300),
      h: Math.round(this.state.heightIn * 300),
      name: this.state.widthIn + 'x' + this.state.heightIn
    };

    const canvas = document.createElement('canvas');
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext('2d');

    // Background colors
    const bgColors = {
      bw: '#1a1a1a',
      warmbw: '#1f1c18',
      mcm: '#2d2d28',
      natural: '#2d2d28'
    };

    const matColors = {
      bw: '#f8f8f8',
      warmbw: '#f5f0e6',
      mcm: '#e8e4dc',
      natural: '#f5f0e6'
    };

    ctx.fillStyle = bgColors[this.state.style];
    ctx.fillRect(0, 0, size.w, size.h);

    const margin = Math.round(size.w * 0.017);
    const gap = Math.round(size.w * 0.005);
    const matW = Math.round(size.w * 0.004);
    const shadowOff = Math.round(size.w * 0.0013);

    const placements = this.getGridPlacements();
    const availW = size.w - margin * 2 - gap * (this.state.gridCols - 1);
    const availH = size.h - margin * 2 - gap * (this.state.gridRows - 1);
    const unitW = availW / this.state.gridCols;
    const unitH = availH / this.state.gridRows;

    onProgress?.({ text: 'Loading images...', percent: 10 });

    // Load all images
    const loadedImgs = {};
    for (let i = 0; i < this.state.order.length; i++) {
      const id = this.state.order[i];
      const imgData = this.state.imgs.find(m => m.id === id);
      if (!imgData) continue;

      const src = this.state.hiResImgs[id] || imgData.src;
      try {
        loadedImgs[id] = await ImageManager.loadImage(src);
      } catch (err) {
        console.error('Failed to load image:', id, err);
      }
      onProgress?.({ text: 'Loading images...', percent: 10 + 40 * (i + 1) / this.state.order.length });
    }

    onProgress?.({ text: 'Rendering print...', percent: 50 });

    // Render cells
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      const x = margin + p.col * (unitW + gap);
      const y = margin + p.row * (unitH + gap);
      const cellW = p.colSpan * unitW + (p.colSpan - 1) * gap;
      const cellH = p.rowSpan * unitH + (p.rowSpan - 1) * gap;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x + shadowOff, y + shadowOff, cellW, cellH);

      // Mat
      ctx.fillStyle = matColors[this.state.style];
      ctx.fillRect(x, y, cellW, cellH);

      if (p.type === 'img' && loadedImgs[p.id]) {
        const img = loadedImgs[p.id];
        const imgX = x + matW;
        const imgY = y + matW;
        const imgW = cellW - matW * 2;
        const imgH = cellH - matW * 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(imgX, imgY, imgW, imgH);
        ctx.clip();

        const zoom = p.set.zoom / 100;
        const drawW = imgW * zoom;
        const drawH = imgH * zoom;
        const offX = (imgW - drawW) / 2 + p.set.panX / 100 * imgW;
        const offY = (imgH - drawH) / 2 + p.set.panY / 100 * imgH;
        const rot = (p.set.rotation || 0) * Math.PI / 180;

        ctx.translate(imgX + offX + drawW / 2, imgY + offY + drawH / 2);
        ctx.rotate(rot);
        ImageManager.drawStyledImage(ctx, img, -drawW / 2, -drawH / 2, drawW, drawH, this.state.style);

        ctx.restore();
      }

      onProgress?.({ text: 'Rendering print...', percent: 50 + 40 * (i + 1) / placements.length });
      await new Promise(r => setTimeout(r, 10));
    }

    onProgress?.({ text: 'Creating file...', percent: 95 });
    await new Promise(r => setTimeout(r, 100));

    // Download
    return new Promise((resolve) => {
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Collage_${size.name}in_${this.state.style.toUpperCase()}_300dpi.jpg`;
        a.click();
        URL.revokeObjectURL(url);
        
        onProgress?.({ text: 'Done! Check your downloads.', percent: 100 });
        resolve(true);
      }, 'image/jpeg', 0.95);
    });
  }

  getGridPlacements() {
    // Mirror grid-builder.packCells: span-aware row-major packing.
    // Images that don't fit are excluded (overflow handled by preview UI).
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
            placements.push({ id, type: 'img', row: r, col: c, colSpan: cs, rowSpan: rs, set });
            placed = true;
          }
        }
      }
    }

    return placements;
  }
}

export default PrintGenerator;
