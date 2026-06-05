# Developer Guide - Collage Editor Architecture

## Module Dependency Graph

```
index.html
    ↓
app.js (main orchestrator)
    ├→ state.js (central state)
    ├→ storage.js (persistence)
    ├→ ui-controller.js
    │   ├→ grid-builder.js
    │   └→ image-manager.js
    ├→ grid-builder.js
    │   └→ image-manager.js (filters)
    ├→ print-generator.js
    │   └→ image-manager.js (filters)
    └→ collage-sw.js (service worker)
```

## State Management Pattern

### Architecture: Observable State
The `AppState` class uses a publish-subscribe pattern:

```javascript
// Subscribe to changes
const unsubscribe = state.subscribe(change => {
  console.log('State changed:', change);
});

// Make changes (triggers notification)
state.addImage(id, name, src);

// Unsubscribe
unsubscribe();
```

### State Structure
```javascript
{
  // Grid settings
  gridRows: 2,
  gridCols: 4,
  
  // Print settings
  widthIn: 20,
  heightIn: 16,
  
  // Display settings
  style: 'warmbw',      // natural, mcm, bw, warmbw
  mode: 'edit',         // edit or arrange
  
  // Selection state
  selPos: null,         // currently selected position
  swapSrc: null,        // swap source in arrange mode
  
  // Image data
  nextId: 0,
  imgs: [
    { id, name, src },  // preview image
    ...
  ],
  order: [id, id, ...], // position order
  settings: [
    {
      id, name,
      zoom, panX, panY, rotation,
      colSpan, rowSpan
    },
    ...
  ],
  
  // Print resources
  hiResImgs: {
    id: dataUrl,        // high-res version for printing
    ...
  }
}
```

## Module API Reference

### AppState (state.js)

```javascript
// Creation
const state = new AppState();

// Subscriptions
state.subscribe(listener) → unsubscribe()

// Image operations
state.addImage(id, name, src) → id
state.deleteImage(id)
state.replaceImage(id, newSrc)

// Selection
state.selectImage(pos)

// Settings
state.updateImageSettings(id, { zoom, panX, ... })

// Grid
state.updateGrid(rows, cols)

// Print
state.updatePrintSize(width, height)

// Mode/Style
state.setMode('edit'|'arrange')
state.setStyle('natural'|'mcm'|'bw'|'warmbw')

// Persistence
state.export() → data object
state.import(data)

// Reset
state.reset()
```

### StorageManager (storage.js)

```javascript
const storage = new StorageManager('key');

storage.save(state) → bool
storage.load() → data|null
storage.clear() → bool
```

### ImageManager (image-manager.js)

```javascript
// Static methods
ImageManager.processImage(file, callback, forHiRes)
ImageManager.loadImage(src) → Promise<img>
ImageManager.drawStyledImage(ctx, img, x, y, w, h, style)
ImageManager.applyFilter(ctx, imageData, w, h, style)
```

### GridBuilder (grid-builder.js)

```javascript
const builder = new GridBuilder(state);

builder.build(containerId)      // Renders grid
builder.packCells() → placements // Get layout info
```

### PrintGenerator (print-generator.js)

```javascript
const generator = new PrintGenerator(state);

generator.generate(onProgress) → Promise<blob>
  // onProgress callback: { text, percent }

generator.getGridPlacements() → placements
```

### UIController (ui-controller.js)

```javascript
const ui = new UIController(state, gridBuilder);

ui.init()                        // Set up all listeners
ui.updateImageSettings()
ui.updateSelectionPanel(pos)
ui.updateModeButtons()
ui.updateStyleChips()
ui.applyPreset(presetName)
ui.setSpan(width, height)
```

## Adding Features

### Example: Add a New Filter

**Step 1**: Add filter method to ImageManager

```javascript
// In image-manager.js
static _applySepiaFilter(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    
    data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    data[i+1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    data[i+2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
}
```

**Step 2**: Add case to applyFilter()

```javascript
case 'sepia':
  this._applySepiaFilter(d);
  break;
```

**Step 3**: Add UI button in index.html

```html
<button class="chip ssepia" data-style="sepia">Sepia</button>
```

**Step 4**: Add CSS styling

```css
.ssepia {
  background: #7a6544;
  color: #ddd;
}
```

### Example: Add Image Adjustment Control

**Step 1**: Add to state.js settings

```javascript
// In settings object initialization
brightness: 100,     // 0-200
saturation: 100,     // 0-200
```

**Step 2**: Add HTML slider in index.html

```html
<div class="grp">
  <div class="sld">
    <label style="flex: 1; margin-bottom: 0;">Brightness</label>
    <span class="val" id="brightnessV">100%</span>
  </div>
  <input type="range" id="brightness" min="0" max="200" value="100">
</div>
```

**Step 3**: Update ui-controller.js to handle slider

```javascript
// In setupEventListeners()
document.getElementById('brightness').oninput = () => this.updateImageSettings();

// In updateImageSettings()
set.brightness = +document.getElementById('brightness').value;

// In updateSelectionPanel()
document.getElementById('brightness').value = set.brightness;
document.getElementById('brightnessV').textContent = set.brightness + '%';
```

**Step 4**: Apply in grid rendering

```javascript
// In image-manager.js
inner.style.filter = `brightness(${settings.brightness / 100})`;
```

## Event Flow

### User adds images:
1. User clicks "Add Images" button
2. File input dialog opens → user selects files
3. `app.addImages(files)` called
4. For each file:
   - Hi-res version processed → stored in `hiResImgs`
   - Preview version processed → added to `imgs` and `settings`
5. `state.addImage()` triggers notification
6. `UI` listener → `gridBuilder.build()` → rendered
7. `storage.save()` persists state

### User edits image:
1. User taps image in grid
2. `gridBuilder.onCellClick(pos)` → `app.selectCell(pos)`
3. `state.selectImage(pos)` triggers notification
4. `UI` listener → `ui.updateSelectionPanel(pos)`
5. Panel populates with current settings
6. User adjusts slider
7. `ui.updateImageSettings()` → updates state
8. `state` notification → `ui` listener → `gridBuilder.build()` → renders
9. Auto-save triggered

### User generates print:
1. User clicks "Generate Print"
2. `app.generatePrint()` called
3. `printGen.generate(onProgress)` creates high-res canvas
4. For each image:
   - Load hi-res version
   - Calculate position/size
   - Draw with styling/filters
   - Update progress bar
5. Canvas → Blob → download
6. Notify user

## Testing Strategy

### Unit Testing Example (pseudocode)

```javascript
// Test state.js
describe('AppState', () => {
  test('addImage creates new image', () => {
    const state = new AppState();
    const id = state.addImage(1, 'test', 'data:...');
    expect(state.imgs.length).toBe(1);
    expect(state.order[0]).toBe(id);
  });

  test('selectImage triggers notification', () => {
    const state = new AppState();
    const called = jest.fn();
    state.subscribe(called);
    state.selectImage(0);
    expect(called).toHaveBeenCalledWith({ type: 'image_selected', pos: 0 });
  });
});
```

### Integration Testing Example

```javascript
// Test app flow
describe('App Flow', () => {
  test('add image and generate print', async () => {
    const app = new CollageEditorApp();
    await app.init();
    
    const file = new File(['...'], 'test.jpg');
    app.addImages([file]);
    
    const result = await app.generatePrint();
    expect(result).toBe(true);
  });
});
```

## Performance Optimization

### Current Optimizations
1. **Lazy module loading**: ES6 modules load on demand
2. **Efficient state updates**: Only changed data notified
3. **Canvas caching**: Print preview doesn't re-render unnecessarily
4. **Debounced saves**: Auto-save doesn't fire on every keystroke

### Potential Improvements
1. **Worker threads**: Offload print generation to Web Worker
2. **IndexedDB**: Use for larger image storage
3. **Compression**: Further optimize image sizes
4. **Virtualization**: For large image lists
5. **Memoization**: Cache filter application results

### Example: Web Worker for Printing

```javascript
// Create worker
const printWorker = new Worker('workers/print.worker.js');

// Use worker
printWorker.postMessage({
  type: 'generate_print',
  state: this.state.export(),
  images: loadedImages
});

printWorker.onmessage = ({ data: { blob, progress } }) => {
  updateProgress(progress);
  if (blob) downloadFile(blob);
};
```

## Debugging Tips

### Enable detailed logging

```javascript
// In app.js
const DEBUG = true;

state.subscribe(change => {
  if (DEBUG) console.log('State change:', change);
});
```

### Monitor localStorage

```javascript
// In console
localStorage.getItem('collageEditor') |> JSON.parse()
```

### Check module loading

```javascript
// In console
import('./js/state.js').then(m => console.log('State loaded:', m.default))
```

## Common Issues & Solutions

### Issue: "Module not found" error
**Cause**: Incorrect import path
**Solution**: Check relative paths, ensure files exist

### Issue: State not updating UI
**Cause**: Listener not subscribed properly
**Solution**: Check subscribe/notify pattern in module

### Issue: Print generation fails
**Cause**: Images failed to load
**Solution**: Check image URLs, verify CORS if needed

### Issue: LocalStorage quota exceeded
**Cause**: Too many large images stored
**Solution**: Implement cleanup, use IndexedDB for larger storage

## Code Style

### Naming Conventions
- `camelCase` for variables and functions
- `PascalCase` for classes
- `UPPER_SNAKE_CASE` for constants
- Prefix private methods with `_`

### Documentation
- JSDoc for public methods
- Comments for complex logic
- Clear variable names
- Meaningful commit messages

### Error Handling
- Try-catch for external operations
- Graceful fallbacks
- User-friendly error messages
- Console logs for debugging

## Future Refactoring Ideas

1. **Migrate to modern framework**: React/Vue (optional)
2. **Add TypeScript**: Type safety throughout
3. **Implement MVVM**: More structured pattern
4. **Add unit tests**: Jest configuration
5. **Add E2E tests**: Cypress configuration
6. **Improve accessibility**: ARIA labels, keyboard nav
7. **Optimize bundle**: Code splitting, tree shaking
8. **Add CI/CD**: Automated testing and deployment

## Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [Web.dev](https://web.dev/)
- [Can I Use](https://caniuse.com/)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)

---

**Happy coding! 🚀**
