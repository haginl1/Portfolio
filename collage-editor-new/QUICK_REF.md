# Collage Editor - Quick Reference

## 🚀 Quick Start

### Open the app
```
Open: collage-editor-new/index.html in your browser
```

### Typical workflow
1. **Add** images → **Arrange** if needed → **Edit** individual images → **Generate** print

## 📁 File Structure
```
js/
  app.js              ← Start here (main orchestrator)
  state.js            ← Core state management
  storage.js          ← LocalStorage handling
  ui-controller.js    ← UI updates & events
  grid-builder.js     ← Grid rendering
  image-manager.js    ← Image processing
  print-generator.js  ← 300 DPI printing
css/
  styles.css          ← All styling
index.html            ← HTML entry point
collage-manifest.json ← PWA config
collage-sw.js         ← Service worker
```

## 🔧 Common Tasks

### Adding a new feature

1. **Identify the module** that needs it
2. **Edit the module** file (e.g., `image-manager.js`)
3. **Add to UI** in `index.html`
4. **Wire up** in `ui-controller.js`
5. **Test** in browser

### Adding a filter
```javascript
// Step 1: In image-manager.js, add method:
static _applyMyFilter(data) {
  // Apply filter to image data
}

// Step 2: In applyFilter(), add case:
case 'myfilter':
  this._applyMyFilter(d);
  break;

// Step 3: In index.html, add button:
<button class="chip smyfilter" data-style="myfilter">My Filter</button>

// Step 4: Test - tap image, select filter, verify
```

### Adding an adjustment slider
```javascript
// Step 1: In state.js, add property:
contrast: 100,  // in settings

// Step 2: In index.html, add slider:
<input type="range" id="contrast" min="0" max="200" value="100">

// Step 3: In ui-controller.js, add listener:
document.getElementById('contrast').oninput = () => this.updateImageSettings();

// Step 4: In grid-builder.js, apply to inner:
inner.style.filter = `contrast(${settings.contrast / 100})`;
```

## 📊 State Structure

```javascript
{
  gridRows: 2,
  gridCols: 4,
  widthIn: 20,
  heightIn: 16,
  style: 'warmbw',
  mode: 'edit',
  selPos: 0,
  swapSrc: null,
  nextId: 1,
  imgs: [{id: 0, name: 'photo', src: 'data:...'}],
  order: [0, 1, 2],
  settings: [{
    id: 0,
    name: 'photo',
    zoom: 100,
    panX: 0,
    panY: 0,
    rotation: 0,
    colSpan: 1,
    rowSpan: 1
  }],
  hiResImgs: {0: 'data:...'}
}
```

## 🎯 Module Responsibilities

| Module | Responsibility | Key Methods |
|--------|-----------------|-------------|
| **state.js** | Central state store | addImage, deleteImage, updateImageSettings |
| **storage.js** | Persistence | save, load, clear |
| **ui-controller.js** | UI events & updates | setupEventListeners, updateSelectionPanel |
| **grid-builder.js** | Grid layout | build, packCells, createCell |
| **image-manager.js** | Image processing | processImage, applyFilter, drawStyledImage |
| **print-generator.js** | Print output | generate, getGridPlacements |
| **app.js** | Orchestration | init, addImages, generatePrint |

## 🔌 Event Flow

```
User Action
    ↓
Event Handler (ui-controller.js)
    ↓
State Update (state.js)
    ↓
Notify Listeners
    ↓
UI Listener Updates (ui-controller.js)
    ↓
Grid Rebuilds (grid-builder.js)
    ↓
Auto Save (storage.js)
    ↓
Visual Update (screen)
```

## 💾 LocalStorage Format

```javascript
// Key: 'collageEditor'
// Value: JSON stringified state object

JSON.parse(localStorage.getItem('collageEditor'))
// Returns: { gridRows, gridCols, imgs, order, settings, hiResImgs, ... }
```

## 🐛 Debugging Tips

### Check state
```javascript
console.log(app.state.export())
```

### Monitor state changes
```javascript
app.state.subscribe(change => console.log('Changed:', change))
```

### Check localStorage
```javascript
localStorage.getItem('collageEditor')
```

### View console errors
```
Press F12 → Console tab
```

### Test module loading
```javascript
import('./js/state.js').then(m => console.log('Loaded:', m.default))
```

## 🎨 Styling Quick Reference

### Key colors
```css
--primary-accent: #f0c060    /* Yellow/gold */
--secondary-accent: #60c0f0  /* Blue */
--dark-bg: #1a1a1a          /* Dark background */
--light-mat: #f5f0e0        /* Material color */
```

### Key classes
```css
.cell           /* Grid cell */
.cell.sel       /* Selected cell */
.cell.empty     /* Empty slot */
.chip           /* Filter chip */
.btn            /* Button */
.mode           /* Mode button */
```

## 📱 Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Stacked controls
- Touch-optimized buttons
- Full width grid

### Desktop (≥ 768px)
- Side-by-side layout
- Preview + controls
- Better spacing
- Larger grid

## ⌨️ Keyboard Support (Future)

Currently mouse/touch only. Potential shortcuts:
- `A` - Add images
- `D` - Delete image
- `E` - Edit mode
- `R` - Arrange mode
- `P` - Print
- `Z` - Zoom slider focus

## 🌐 Browser Support

| Browser | Min Version | Status |
|---------|-------------|--------|
| Chrome | 80 | ✅ |
| Firefox | 75 | ✅ |
| Safari | 12 | ✅ |
| Edge | 80 | ✅ |
| Mobile | Latest | ✅ |

## 📦 Deployment Checklist

- [ ] All modules present in js/ folder
- [ ] CSS file in css/ folder
- [ ] Manifest and Service Worker present
- [ ] HTML file references correct paths
- [ ] Server supports ES6 modules
- [ ] MIME types configured (.js = application/javascript)
- [ ] Service Worker registration working
- [ ] LocalStorage accessible
- [ ] Browser DevTools shows no errors
- [ ] Features work as expected

## 🔍 Testing Checklist

- [ ] Add multiple images
- [ ] Delete images
- [ ] Replace images
- [ ] Switch modes
- [ ] Adjust all sliders
- [ ] Change grid size
- [ ] Apply all filters
- [ ] Generate print
- [ ] Refresh page (data persists)
- [ ] Works offline

## 📚 Documentation Files

| File | Purpose | Read When |
|------|---------|-----------|
| **README.md** | Feature guide | Learning to use |
| **MIGRATION.md** | Upgrade path | Transitioning from old |
| **DEVELOPER.md** | Architecture | Building features |
| **SUMMARY.md** | Project overview | High-level view |
| **QUICK_REF.md** | This file | Need quick answers |

## 🚀 Next Steps

1. **Read** README.md for feature overview
2. **Try** the app in your browser
3. **Check** DEVELOPER.md to extend
4. **Build** new features following patterns
5. **Deploy** and enjoy!

## 💡 Pro Tips

- **Tip 1**: Use Arrange mode to quickly reorder images
- **Tip 2**: Set custom preset sizes for frequent sizes
- **Tip 3**: Use Warm B&W for best black & white results
- **Tip 4**: Stack images with row/column spanning for layouts
- **Tip 5**: Generate 8×10" for quick proofs before full size

## 🎓 Learning Path

1. **Beginner**: Read README.md, use the app
2. **Intermediate**: Read DEVELOPER.md, understand modules
3. **Advanced**: Add a new filter (see guide above)
4. **Expert**: Add a new adjustment slider
5. **Master**: Add new mode (e.g., "Compare" mode)

---

**Last Updated**: Refactoring Complete ✅
**Version**: Modular v1.0
**Status**: Production Ready 🚀
