# Collage Editor - Refactored

A modern, modular web-based photo collage creator with professional printing capabilities.

## 🎯 What's New

### Architecture Improvements
- **Modular Structure**: Separated concerns into focused modules
- **State Management**: Centralized state with reactive updates
- **Better Maintainability**: Cleaner code organization and separation of concerns
- **Enhanced Error Handling**: Proper error management throughout
- **Improved Performance**: Optimized image processing and rendering

### Project Structure

```
collage-editor-new/
├── index.html                 # Main entry point
├── css/
│   └── styles.css            # Extracted and organized styles
├── js/
│   ├── app.js                # Main application orchestrator
│   ├── state.js              # State management with observable pattern
│   ├── storage.js            # LocalStorage persistence layer
│   ├── image-manager.js      # Image processing utilities
│   ├── grid-builder.js       # Grid layout and rendering
│   ├── print-generator.js    # 300 DPI print generation
│   └── ui-controller.js      # UI interactions and DOM updates
├── collage-manifest.json     # PWA manifest
├── collage-sw.js             # Service Worker for offline support
└── README.md                 # This file
```

## 🚀 Features

### Core Functionality
- ✅ Add multiple images from your device
- ✅ Arrange images in customizable grids (1-12 rows/columns)
- ✅ Adjust individual images: zoom, pan, rotation, span
- ✅ Apply artistic filters (Natural, MCM, B&W, Warm B&W)
- ✅ Generate high-resolution prints (300 DPI)
- ✅ Auto-save to browser LocalStorage
- ✅ Works offline as a Progressive Web App

### Edit Mode
- Select individual images
- Adjust position and zoom with sliders
- Name images for organization
- Set cell spanning (1-12 cells wide/tall)
- Reset individual or all settings

### Arrange Mode
- Swap image positions by tapping cells
- Quick visual feedback with highlighting

### Print Generation
- Professional 300 DPI output
- Real materials: mats, shadows, styling
- Multiple size presets (20×16", 16×20", 8×10")
- Custom dimensions support
- Style-matched materials and shadows

## 📦 Modules Explained

### `state.js` - State Management
Centralized application state with a reactive subscription model:
- Manages all grid, image, and adjustment data
- Provides methods for state mutations
- Notifies listeners of changes
- Exports/imports state for persistence

### `storage.js` - Persistence Layer
Handles LocalStorage operations:
- Save state to browser storage
- Load previously saved projects
- Error handling for quota issues

### `image-manager.js` - Image Processing
Utilities for working with images:
- Image compression for preview and printing
- Filter effects (B&W, warm B&W, MCM)
- Image loading with error handling
- Styled image drawing to canvas

### `grid-builder.js` - Layout Engine
Manages the visual grid:
- Creates grid layout based on state
- Handles cell spanning
- Manages click interactions
- Updates grid on state changes

### `print-generator.js` - Print Engine
Generates high-quality prints:
- 300 DPI canvas rendering
- Material styling (mats, shadows)
- Filter application
- Progress tracking
- Blob to file download

### `ui-controller.js` - User Interface
Orchestrates all UI interactions:
- Event listener setup
- DOM updates based on state
- Slider and input handling
- Panel visibility management

### `app.js` - Application Coordinator
Main application class:
- Initializes all modules
- Coordinates module interactions
- Handles lifecycle events
- Manages user actions

## 🔧 Development

### Installation
1. Open `index.html` in a modern web browser
2. Add images to start creating
3. Changes auto-save to LocalStorage

### Browser Support
- Chrome/Edge 80+
- Firefox 75+
- Safari 12+
- Mobile browsers (iOS Safari, Chrome Android)

### PWA Installation
1. Visit the app in a modern browser
2. Look for "Install" option in browser menu
3. Or add to home screen (mobile)

## 📝 How to Use

### Basic Workflow
1. **Add Images**: Click "+ Add Images" button
2. **Arrange**: Switch to "Arrange" mode to reorder
3. **Edit**: Switch to "Edit" mode to adjust individual images
4. **Style**: Select a filter from the style chips
5. **Print**: Click "Generate Print" for 300 DPI output

### Keyboard Shortcuts
- None currently (touch/click based)

### Tips
- Use Edit mode to zoom and position images perfectly
- Use Arrange mode for quick reordering
- Warm B&W works great for black & white photos
- Try MCM for color photos with vintage look
- Custom size presets save frequently used dimensions

## 🎨 Customization

### Modifying Styles
Edit `css/styles.css`:
- Colors: Search for `#1a1a1a`, `#f0c060`
- Grid gaps and padding: Look for grid-related properties
- Button styling: Modify `.btn` classes
- Filter effects: Adjust in `image-manager.js`

### Adding New Filters
1. Add filter method to `ImageManager` class in `image-manager.js`
2. Add chip button in `index.html`
3. Add case to `applyFilter()` switch statement
4. Add styling class for preview

### Extending State
1. Add property to `AppState` constructor
2. Create getter/setter if needed
3. Add notification in mutation method
4. Update any dependent listeners

## 🐛 Troubleshooting

### Images not loading
- Check browser console for errors
- Verify images aren't corrupted
- Try a different format (JPG, PNG, WebP)

### Storage not working
- Clear browser cache
- Check LocalStorage quota
- Try a different browser

### Print generation slow
- Reduce image count
- Use smaller images
- Close other browser tabs

## 🔒 Privacy
- All processing happens in your browser
- No data sent to servers
- Images stored only in browser LocalStorage
- Service worker enables offline functionality

## 📄 License
This project is part of the haginl1/Portfolio repository.

## 🎓 What Was Improved

### Before (Monolithic)
- 1000+ lines in single HTML file
- All CSS inline in `<style>` tag
- All JavaScript in one `<script>` block
- Global variables scattered throughout
- Mixed concerns (UI, state, rendering)
- Difficult to test and maintain

### After (Modular)
- Clean separation of concerns
- ~100 lines per module (focused)
- External CSS stylesheet
- Observable state management
- Easy to test individual modules
- Clear data flow
- Better error handling
- Improved performance through modularization

## 🚀 Future Enhancements

Possible improvements:
- [ ] Undo/redo functionality
- [ ] Multiple project management
- [ ] Cloud backup/sync
- [ ] Preset templates
- [ ] More filter effects
- [ ] Drag-and-drop reordering
- [ ] Keyboard shortcuts
- [ ] Theme customization
- [ ] Export as PSD/other formats
- [ ] Social sharing
- [ ] Photo effects (brightness, contrast, etc.)

---

**Created with ❤️ by GitHub Copilot**
**Refactored for better functionality and maintainability**
