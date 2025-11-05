/**
 * Preload Script for Prestige
 *
 * This script runs in a privileged context and exposes a secure API
 * to the renderer process via contextBridge. This allows the frontend
 * to access backend functionality without nodeIntegration enabled.
 *
 * Security: This script has access to Node.js APIs, but the renderer
 * process only has access to what we explicitly expose via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose secure API to renderer process
 *
 * All IPC calls go through this API, preventing direct Node.js access
 * in the renderer process while maintaining necessary functionality.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ============================================================================
  // File System Operations
  // ============================================================================

  /**
   * Read directory contents recursively
   * @param {string} dirPath - Path to directory
   * @returns {Promise<Array>} Array of file information objects
   */
  readDirectory: (dirPath) => ipcRenderer.invoke('fs:readDirectory', dirPath),

  /**
   * Read file contents
   * @param {string} filePath - Path to file
   * @returns {Promise<Buffer|string>} File contents
   */
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),

  /**
   * Write file contents
   * @param {string} filePath - Path to file
   * @param {string} content - Content to write
   * @returns {Promise<void>}
   */
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),

  /**
   * Check if file/directory exists
   * @param {string} path - Path to check
   * @returns {Promise<boolean>}
   */
  exists: (path) => ipcRenderer.invoke('fs:exists', path),

  /**
   * Delete file
   * @param {string} filePath - Path to file
   * @returns {Promise<void>}
   */
  deleteFile: (filePath) => ipcRenderer.invoke('fs:deleteFile', filePath),

  /**
   * Get directory snapshot (for caching)
   * @param {string} dirPath - Path to directory
   * @returns {Promise<string>} JSON string of directory structure with mtimes
   */
  getDirectorySnapshot: (dirPath) => ipcRenderer.invoke('fs:getDirectorySnapshot', dirPath),

  /**
   * Get file stats
   * @param {string} filePath - Path to file
   * @returns {Promise<object>} File stats (mtime, size, etc.)
   */
  getFileStats: (filePath) => ipcRenderer.invoke('fs:getFileStats', filePath),

  /**
   * Clear Chrome/Electron cache
   * @returns {Promise<void>}
   */
  clearCache: () => ipcRenderer.invoke('fs:clearCache'),

  // ============================================================================
  // Path Operations
  // ============================================================================

  /**
   * Parse file path
   * @param {string} filePath - Path to parse
   * @returns {Promise<object>} Parsed path object {dir, name, ext, base}
   */
  parsePath: (filePath) => ipcRenderer.invoke('path:parse', filePath),

  /**
   * Join path segments
   * @param {...string} segments - Path segments to join
   * @returns {Promise<string>} Joined path
   */
  joinPath: (...segments) => ipcRenderer.invoke('path:join', ...segments),

  /**
   * Get path separator for current platform
   * @returns {Promise<string>} Path separator ('/' or '\\')
   */
  getPathSeparator: () => ipcRenderer.invoke('path:separator'),

  // ============================================================================
  // File Utilities
  // ============================================================================

  /**
   * Convert file path to file:// URL
   * @param {string} filePath - Path to convert
   * @returns {Promise<string>} File URL
   */
  pathToFileURL: (filePath) => ipcRenderer.invoke('util:pathToFileURL', filePath),

  /**
   * Get MIME type of file
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} MIME type
   */
  getMimeType: (filePath) => ipcRenderer.invoke('util:getMimeType', filePath),

  /**
   * Get current working directory
   * @returns {Promise<string>} Current working directory
   */
  getCwd: () => ipcRenderer.invoke('util:getCwd'),

  /**
   * Get user data path (for cache, etc.)
   * @returns {Promise<string>} User data directory path
   */
  getUserDataPath: () => ipcRenderer.invoke('util:getUserDataPath'),

  // ============================================================================
  // File Watching
  // ============================================================================

  /**
   * Start watching a directory for changes
   * @param {string} dirPath - Path to directory
   * @param {object} options - Chokidar options
   * @returns {Promise<string>} Watcher ID
   */
  startWatcher: (dirPath, options) => ipcRenderer.invoke('watcher:start', dirPath, options),

  /**
   * Stop watching a directory
   * @param {string} watcherId - Watcher ID from startWatcher
   * @returns {Promise<void>}
   */
  stopWatcher: (watcherId) => ipcRenderer.invoke('watcher:stop', watcherId),

  /**
   * Listen for file system events
   * @param {string} event - Event name ('file:added', 'file:changed', 'file:deleted', 'watcher:ready', 'watcher:error')
   * @param {function} callback - Event callback
   */
  onFileSystemEvent: (callback) => {
    ipcRenderer.on('fs:event', (event, data) => callback(data));
  },

  /**
   * Remove file system event listener
   */
  removeFileSystemEventListener: () => {
    ipcRenderer.removeAllListeners('fs:event');
  },

  // ============================================================================
  // FFmpeg Operations
  // ============================================================================

  /**
   * Convert video file to different format
   * @param {object} options - Conversion options
   * @returns {Promise<string>} Output file path
   */
  convertVideo: (options) => ipcRenderer.invoke('ffmpeg:convertVideo', options),

  /**
   * Convert audio to MP3 with normalization
   * @param {string} inputPath - Input audio file
   * @param {string} outputPath - Output MP3 file
   * @param {object} options - Conversion options (bitrate, channels, etc.)
   * @returns {Promise<string>} Output file path
   */
  convertAudioToMP3: (inputPath, outputPath, options) =>
    ipcRenderer.invoke('ffmpeg:convertToMP3', inputPath, outputPath, options),

  /**
   * Merge multiple audio files
   * @param {Array<string>} inputFiles - Array of input file paths
   * @param {string} outputPath - Output file path
   * @param {object} options - Merge options
   * @returns {Promise<object>} Result with output path and timecodes
   */
  mergeAudioFiles: (inputFiles, outputPath, options) =>
    ipcRenderer.invoke('ffmpeg:mergeAudio', inputFiles, outputPath, options),

  /**
   * Get media file metadata using ffprobe
   * @param {string} filePath - Path to media file
   * @returns {Promise<object>} Media metadata
   */
  getMediaMetadata: (filePath) => ipcRenderer.invoke('ffmpeg:probe', filePath),

  /**
   * Export video with multiple audio tracks and clips
   * @param {Array<object>} clips - Array of clip objects with V1, A1, A2 parameters
   * @param {string} outputPath - Output file path
   * @param {object} options - Export options
   * @returns {Promise<string>} Output file path
   */
  exportVideo: (clips, outputPath, options) =>
    ipcRenderer.invoke('ffmpeg:exportVideo', clips, outputPath, options),

  /**
   * Listen for FFmpeg progress events
   * @param {function} callback - Progress callback
   */
  onFFmpegProgress: (callback) => {
    ipcRenderer.on('ffmpeg:progress', (event, data) => callback(data));
  },

  /**
   * Remove FFmpeg progress listener
   */
  removeFFmpegProgressListener: () => {
    ipcRenderer.removeAllListeners('ffmpeg:progress');
  },

  // ============================================================================
  // XML/EAF Processing
  // ============================================================================

  /**
   * Parse EAF (ELAN Annotation Format) XML file
   * @param {string} filePath - Path to EAF file
   * @returns {Promise<object>} Parsed EAF data
   */
  parseEAF: (filePath) => ipcRenderer.invoke('xml:parseEAF', filePath),

  /**
   * Parse generic XML file
   * @param {string} filePath - Path to XML file
   * @returns {Promise<object>} Parsed XML data
   */
  parseXML: (filePath) => ipcRenderer.invoke('xml:parse', filePath),

  // ============================================================================
  // Electron Utilities
  // ============================================================================

  /**
   * Check if running in development mode
   * @returns {Promise<boolean>}
   */
  isDev: () => ipcRenderer.invoke('util:isDev'),

  /**
   * Get platform information
   * @returns {Promise<object>} {platform: string, separator: string, ...}
   */
  getPlatform: () => ipcRenderer.invoke('util:getPlatform'),

  /**
   * Send message to main process (legacy IPC support)
   * @param {string} channel - IPC channel
   * @param {any} data - Data to send
   */
  send: (channel, data) => {
    // Whitelist of allowed channels for security
    const validChannels = ['toggle-image', 'toggle-settings'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  /**
   * Listen for messages from main process
   * @param {string} channel - IPC channel
   * @param {function} callback - Message callback
   */
  on: (channel, callback) => {
    // Whitelist of allowed channels for security
    const validChannels = ['image'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, data) => callback(data));
    }
  },
});

// Log that preload script has loaded (helpful for debugging)
console.log('[Preload] Secure API exposed to renderer process');
