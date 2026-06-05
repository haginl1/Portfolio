/**
 * Image Manager Module
 * Handles image processing, compression, and manipulation
 */

class ImageManager {
  static processImage(file, callback, forHiRes = false) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const max = forHiRes ? 2000 : 800;
        
        // Resize if needed
        if (w > max || h > max) {
          if (w > h) {
            h = Math.round(h * max / w);
            w = max;
          } else {
            w = Math.round(w * max / h);
            h = max;
          }
        }
        
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        
        const quality = forHiRes ? 0.92 : 0.75;
        const name = file.name.replace(/\.[^.]+$/, '');
        callback(canvas.toDataURL('image/jpeg', quality), name);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  static loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  static applyFilter(ctx, imageData, w, h, style) {
    const d = imageData.data;
    
    switch (style) {
      case 'bw':
        this._applyBW(d);
        break;
      case 'warmbw':
        this._applyWarmBW(d);
        break;
      case 'mcm':
        this._applyMCM(d);
        break;
      case 'natural':
      default:
        // No filter
        break;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  static _applyBW(data) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
      const contrast = ((gray / 255 - 0.5) * 1.2 + 0.5) * 255;
      data[i] = data[i+1] = data[i+2] = Math.max(0, Math.min(255, contrast));
    }
  }

  static _applyWarmBW(data) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
      const contrast = ((gray / 255 - 0.5) * 1.15 + 0.5) * 255;
      data[i] = Math.min(255, contrast * 1.1);
      data[i+1] = Math.min(255, contrast * 1.0);
      data[i+2] = Math.min(255, contrast * 0.85);
    }
  }

  static _applyMCM(data) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const gray = (r + g + b) / 3;
      data[i] = r * 0.5 + gray * 0.5;
      data[i+1] = g * 0.5 + gray * 0.45;
      data[i+2] = b * 0.5 + gray * 0.35;
    }
  }

  static drawStyledImage(ctx, img, x, y, w, h, style) {
    const tc = document.createElement('canvas');
    tc.width = w;
    tc.height = h;
    const tctx = tc.getContext('2d');
    
    // Scale and draw image
    const scale = Math.max(w / img.width, h / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    const sx = (w - sw) / 2;
    const sy = (h - sh) / 2;
    
    tctx.drawImage(img, sx, sy, sw, sh);
    
    // Apply style filter
    if (style !== 'natural') {
      const imageData = tctx.getImageData(0, 0, w, h);
      this.applyFilter(tctx, imageData, w, h, style);
    }
    
    ctx.drawImage(tc, x, y);
  }
}

export default ImageManager;
