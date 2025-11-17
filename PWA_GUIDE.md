# Prestige PWA User Guide

## Overview

Prestige now supports **Progressive Web App (PWA)** mode, allowing users to view and interact with language documentation sessions directly in their web browser without installing the desktop application.

### ⚠️ Important Note: Desktop/Laptop Only

**SayMore (the tool that creates BOLD corpora) is Windows-only**, so the Prestige PWA is primarily useful for:
- **Desktop/laptop users** who want to view sessions without installing software
- **Windows users** sharing with others who have desktop/laptop browsers
- **Chromebook users** (Chrome OS supports File System Access API)

**Mobile limitations**: While the PWA technically works on mobile browsers, the File System Access API has limited mobile support, and most language documentation sessions are created on desktop computers anyway. The PWA shines for **desktop-to-desktop sharing** where the desktop app would be overkill for viewers.

## What Works in PWA Mode

### ✅ Full Features
- **Folder Access**: Open local project folders using File System Access API
- **EAF Parsing**: Load and parse ELAN annotation files
- **Video Playback**: Watch source videos with synchronized timelines
- **Audio Playback**: Play annotation audio segments (Careful/Translation)
- **Timeline Navigation**: Browse milestones and seek through content
- **Annotation Viewing**: View transcriptions and translations
- **WaveSurfer Visualization**: See audio waveforms for all tracks
- **Subtitle Display**: Show text overlays synchronized with video
- **Session State**: Save viewing preferences in browser storage

### ❌ Desktop-Only Features
- **Video Export**: Requires FFmpeg (use desktop app)
- **Audio Merging**: Requires FFmpeg (use desktop app)
- **Audio Conversion**: MP3 normalization (use desktop app)
- **File Watching**: Automatic folder monitoring (use manual reload)
- **Batch Processing**: Multiple file operations (use desktop app)

---

## Browser Requirements

### Supported Browsers
- ✅ **Chrome 86+** (Windows, Mac, Linux, ChromeOS)
- ✅ **Edge 86+** (Windows, Mac)
- ✅ **Safari 15.2+** (Mac, iOS 15.2+)
- ✅ **Opera 72+** (Windows, Mac, Linux)

### Unsupported Browsers
- ❌ **Firefox** (File System Access API not yet implemented)
- ❌ **Internet Explorer** (obsolete)
- ❌ **Safari < 15.2** (missing File System Access API)

---

## Getting Started

### Option 1: Hosted PWA (Recommended for Community Members)

1. **Visit the hosted URL**: `https://your-domain.com/prestige`
2. **Click "Select Folder"** and choose your project directory
3. **Grant permissions** when prompted
4. **Start viewing!** The app will load your session

### Option 2: Local Development

1. **Build the PWA**:
   ```bash
   npm run web-prod
   ```

2. **Serve locally**:
   ```bash
   npx serve -s build
   ```

3. **Open browser**: Navigate to `http://localhost:3000`

### Option 3: Install as PWA (Offline Access)

1. Visit the PWA URL in Chrome/Edge
2. Click the **Install** button in the address bar (⊕ icon)
3. The app installs as a standalone application
4. Access from Start Menu (Windows) or Applications (Mac)
5. Works offline after first load!

---

## How to Use

### Opening a Project Folder

1. Click **"Select Folder"** button
2. Browser will show a folder picker dialog
3. Navigate to your project folder containing:
   - `.eaf` file (ELAN annotations)
   - `.mp4` or video file (source media)
   - `_Annotations/` folder (Careful/Translation segments)
4. Click **"Select Folder"** or **"Open"**
5. Grant read permission when prompted

**Folder Structure Example**:
```
My_Language_Documentation/
├── My_Story.eaf
├── My_Story_Source_01.mp4
└── My_Story_Source_01_StandardAudio.wav_Annotations/
    ├── 0.5_2.3_Careful.wav
    ├── 2.3_5.1_Careful.wav
    ├── 0.5_2.3_Translation.wav
    ├── 2.3_5.1_Translation.wav
    ├── Careful_Merged.mp3 (optional, if created by desktop app)
    └── Translation_Merged.mp3 (optional)
```

### Playing Content

1. **Video controls** work like any media player:
   - Play/Pause: Spacebar or click button
   - Seek: Click timeline or use keyboard arrows
   - Volume: Adjust slider or use mouse wheel

2. **Timeline milestones**:
   - Click any milestone to jump to that segment
   - Annotation audio plays automatically with each segment

3. **Toggle tracks**:
   - Enable/disable Careful audio
   - Enable/disable Translation audio
   - Show/hide subtitle text overlays

### Viewing Annotations

1. **Annotation Table**: Browse all segments in tabular format
2. **Text Display**: View transcription and translation side-by-side
3. **Metadata**: See timing information and linguistic types

---

## Performance Tips

### Optimizing Playback

**Merged Audio (Fast)**:
- If your project was created with the desktop app, merged audio files (`Careful_Merged.mp3`, `Translation_Merged.mp3`) already exist
- PWA uses these for instant playback (no loading delay)

**Individual Segments (Still Fast)**:
- If no merged files exist, PWA loads individual WAV segments on-demand
- Each segment loads in ~50-150ms from your local disk
- Segments are cached in memory (20 most recent)
- Playback is seamless with preloading

### Cache Management

- **Browser cache**: PWA caches app resources for offline use
- **Audio cache**: Recent segments stay in memory
- **Clear cache**: Use browser DevTools → Application → Clear Storage

### Troubleshooting Slow Performance

1. **Check file sizes**: Very large video files (>500MB) may load slowly
2. **Close other tabs**: Free up browser memory
3. **Update browser**: Ensure latest version for best performance
4. **Hardware acceleration**: Enable in browser settings

---

## Permissions

### What Permissions Are Needed?

**File System Access** (Required):
- Read files from the folder you select
- No write access unless you save annotations
- Permission is per-folder, per-session

**Service Worker** (Optional):
- Enables offline mode
- Caches app resources
- Improves load times

### Granting Permissions

1. **First time**: Browser asks "Allow this site to read files?"
2. Click **"Allow"** or **"View files"**
3. **Subsequent visits**: Permission persists until you reload
4. **Revoking**: Browser settings → Site Settings → Permissions

### Privacy & Security

- ✅ **All data stays local** - nothing uploads to servers
- ✅ **No tracking** - app runs entirely in your browser
- ✅ **Permissions expire** - close tab = lose folder access
- ✅ **IndexedDB storage** - can store folder handles for convenience

---

## Offline Mode

### Making PWA Available Offline

1. **Visit PWA while online** (first time loads app)
2. **Service worker installs** (automatic)
3. **App caches** (HTML, CSS, JS stored locally)
4. **Close browser** and disconnect internet
5. **Reopen PWA** - app loads from cache!

### What Works Offline?

- ✅ App interface and controls
- ✅ Previously opened project folders (if re-granted permission)
- ✅ Playback of local media files

### What Doesn't Work Offline?

- ❌ Opening new folders (browser API requires online check)
- ❌ Loading remote media (if using HTTP URLs)
- ❌ Accessing online documentation/help

---

## Differences from Desktop App

| Feature | Desktop App | PWA |
|---------|-------------|-----|
| **Folder Access** | Full OS file system | File System Access API (user grants) |
| **Video Export** | ✅ FFmpeg | ❌ Not supported |
| **Audio Merging** | ✅ FFmpeg | ❌ Not supported (uses individual segments) |
| **File Watching** | ✅ Automatic | ❌ Manual reload |
| **Offline Mode** | ✅ Native | ✅ Service Worker |
| **Multi-Window** | ✅ Three windows | ❌ Single window |
| **Performance** | ⚡ Native | ⚡ Nearly identical for playback |
| **Installation** | Installer (~200MB) | Web install (~5MB) |
| **Updates** | Manual reinstall | Automatic on refresh |

---

## Frequently Asked Questions

### Can I use PWA without internet?

**Yes**, after first visit:
1. Visit PWA online once to install service worker
2. App caches to your device
3. Open PWA offline - works from cache
4. Note: Opening new folders may require brief online connectivity for permission checks

### Can I export videos in PWA mode?

**No**, video export requires FFmpeg which only runs in desktop app. Use PWA for viewing, desktop app for exporting.

### How much storage does PWA use?

- App cache: ~5-10 MB (HTML/CSS/JS)
- Audio segment cache: ~5-10 MB (20 most recent segments)
- IndexedDB: <1 MB (folder handles, preferences)
- **Total**: ~15-20 MB maximum

### Does PWA upload my files to a server?

**No!** All files stay on your computer. The PWA reads directly from your local disk using browser APIs. Nothing uploads anywhere.

### Can multiple users access the same project?

**Yes**, if:
- Desktop app created the project folder
- Multiple users have read access to that folder
- Each user opens PWA and selects the folder
- All data remains local to each user's browser

### What if my browser doesn't support File System Access API?

You have two options:
1. **Use supported browser**: Chrome 86+, Edge 86+, Safari 15.2+
2. **Install desktop app**: Full functionality on any OS

---

## Advanced Usage

### Developer Mode

**Enable verbose logging**:
```javascript
localStorage.setItem('PRESTIGE_DEBUG', 'true');
```

**Check API support**:
```javascript
console.log('File System Access:', 'showDirectoryPicker' in window);
console.log('Service Worker:', 'serviceWorker' in navigator);
```

### Custom Deployment

**Build for production**:
```bash
npm run web-prod
```

**Deploy to static hosting**:
- Upload `build/` folder to Netlify, Vercel, GitHub Pages, etc.
- Ensure HTTPS (required for service workers)
- Update `manifest.json` with your domain

**Configure service worker**:
- Edit `src/serviceWorker.ts` for custom caching
- Set cache expiration policies
- Add offline fallback pages

---

## Troubleshooting

### "Permission denied" error

**Solution**: Click "Select Folder" again and grant permission when prompted

### "File not found" error

**Solution**: Ensure folder structure is correct and .eaf file exists

### Audio doesn't play

**Checklist**:
- ✅ Browser volume is up
- ✅ WAV files exist in `_Annotations/` folder
- ✅ File permissions allow browser to read
- ✅ Audio format is supported (WAV, MP3)

### Video is choppy

**Solutions**:
- Reduce video quality (use desktop app to re-encode)
- Close other browser tabs
- Enable hardware acceleration in browser settings
- Use smaller video files (<500MB recommended)

### "This feature requires desktop app"

This means you tried to use a feature only available in desktop mode:
- Video export
- Audio merging/conversion
- Batch operations

**Solution**: Install desktop app for these features

### PWA won't install

**Requirements**:
- Must use HTTPS (not HTTP)
- Must have valid `manifest.json`
- Must have service worker registered
- Chrome/Edge only (Safari doesn't support install prompt)

---

## Support

### Getting Help

- **Desktop App Issues**: Check main [README.md](./README.md)
- **PWA-Specific Issues**: See [GitHub Issues](https://github.com/MattGyverLee/prestige/issues)
- **Browser Compatibility**: Check [caniuse.com/native-filesystem-api](https://caniuse.com/native-filesystem-api)

### Reporting Bugs

Include:
1. Browser name and version
2. Operating system
3. Steps to reproduce
4. Expected vs actual behavior
5. Browser console errors (F12 → Console)

---

## Technical Details

### Architecture

```
┌─────────────────────────────────────┐
│  React/Redux UI (Shared)            │
├─────────────────────────────────────┤
│  Unified API Layer                  │
│  ├─ Electron API (Desktop)          │
│  └─ Web API (PWA)                   │
├─────────────────────────────────────┤
│  Platform Layer                     │
│  ├─ Node.js + Electron (Desktop)    │
│  └─ Browser APIs (PWA)              │
└─────────────────────────────────────┘
```

### APIs Used

- **File System Access API**: Local file reading
- **Web Audio API**: Segment playback with mixing
- **Service Worker API**: Offline caching
- **IndexedDB**: Persistent storage
- **DOMParser**: EAF XML parsing

### Browser Support Detection

The app automatically detects:
1. `window.electronAPI` → Use Electron mode
2. `window.showDirectoryPicker` → Use PWA mode
3. Neither → Show limited functionality warning

---

## Roadmap

### Future PWA Enhancements

- [ ] **WebAssembly FFmpeg**: Video export in browser (slow but possible)
- [ ] **Cloud Sync**: Optional sync to Google Drive/Dropbox
- [ ] **Collaborative Viewing**: Share sessions with URLs
- [ ] **Mobile Support**: iOS/Android optimizations
- [ ] **Progressive Loading**: Stream large videos in chunks
- [ ] **Offline EAF Editing**: Annotation editing without desktop app

---

## Conclusion

The Prestige PWA provides **80% of desktop app functionality** with:
- ✅ **Zero installation** for viewers
- ✅ **Instant updates** via web
- ✅ **Cross-platform** compatibility
- ✅ **Offline** capabilities
- ✅ **Secure** local-only data

For power users needing export and advanced features, the desktop app remains the best choice. For community members viewing and learning from corpus data, the PWA is perfect!

Enjoy exploring your language documentation! 🌍🎙️📚
