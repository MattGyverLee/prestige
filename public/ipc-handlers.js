/**
 * IPC Handlers for Prestige
 *
 * This module sets up all IPC handlers for secure communication between
 * the main process and renderer process. All Node.js operations that were
 * previously in the renderer are now handled here.
 */

const { ipcMain, app } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const isDev = require('electron-is-dev');
const mime = require('mime');
const fileUrl = require('file-url');
const xml2js = require('xml2js');
const chokidar = require('chokidar');
const ffmpegStatic = require('ffmpeg-static-electron');
const ffprobeStatic = require('ffprobe-static-electron');
const fluentFfmpeg = require('fluent-ffmpeg');

// Store active watchers
const watchers = new Map();

/**
 * Setup FFmpeg paths based on environment
 */
function setupFFmpegPaths() {
  if (isDev) {
    fluentFfmpeg.setFfmpegPath(`${process.cwd()}/bin/win/x64/ffmpeg.exe`);
    fluentFfmpeg.setFfprobePath(`${process.cwd()}/bin/win/x64/ffprobe.exe`);
  } else {
    fluentFfmpeg.setFfmpegPath(`${process.cwd()}/resources${ffmpegStatic.path}`);
    fluentFfmpeg.setFfprobePath(`${process.cwd()}/resources${ffprobeStatic.path}`);
  }
}

// Initialize FFmpeg paths
setupFFmpegPaths();

/**
 * Register all IPC handlers
 * @param {BrowserWindow} mainWindow - Main application window
 */
function registerIPCHandlers(mainWindow) {
  // ==========================================================================
  // File System Operations
  // ==========================================================================

  /**
   * Read directory contents recursively
   */
  ipcMain.handle('fs:readDirectory', async (event, dirPath) => {
    try {
      const files = await fs.readdir(dirPath);
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            isDirectory: stats.isDirectory(),
            size: stats.size,
            mtime: stats.mtime,
          };
        })
      );
      return fileStats;
    } catch (error) {
      console.error('Error reading directory:', error);
      throw error;
    }
  });

  /**
   * Read file contents
   */
  ipcMain.handle('fs:readFile', async (event, filePath) => {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  /**
   * Write file contents
   */
  ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
    try {
      await fs.writeFile(filePath, content, 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  });

  /**
   * Check if file/directory exists
   */
  ipcMain.handle('fs:exists', async (event, checkPath) => {
    try {
      return await fs.pathExists(checkPath);
    } catch (error) {
      return false;
    }
  });

  /**
   * Delete file
   */
  ipcMain.handle('fs:deleteFile', async (event, filePath) => {
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  });

  /**
   * Get directory snapshot (recursive file listing with mtimes)
   */
  ipcMain.handle('fs:getDirectorySnapshot', async (event, dirPath) => {
    const walkSync = async (dir, filelist = []) => {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = await fs.stat(filepath);
        if (stats.isDirectory()) {
          filelist = await walkSync(filepath, filelist);
        } else {
          filelist.push(`${filepath}, ${stats.mtime}`);
        }
      }
      return filelist;
    };

    try {
      const fileList = await walkSync(dirPath);
      return JSON.stringify(fileList.flat());
    } catch (error) {
      console.error('Error getting directory snapshot:', error);
      throw error;
    }
  });

  /**
   * Get file stats
   */
  ipcMain.handle('fs:getFileStats', async (event, filePath) => {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime,
        ctime: stats.ctime,
        birthtime: stats.birthtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };
    } catch (error) {
      console.error('Error getting file stats:', error);
      throw error;
    }
  });

  /**
   * Clear Electron cache
   */
  ipcMain.handle('fs:clearCache', async () => {
    try {
      const chromeCacheDir = path.join(app.getPath('userData'), 'Cache');
      if (await fs.pathExists(chromeCacheDir)) {
        const files = await fs.readdir(chromeCacheDir);
        for (const file of files) {
          const filename = path.join(chromeCacheDir, file);
          try {
            await fs.unlink(filename);
          } catch (e) {
            console.log('Could not delete cache file:', e);
          }
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  });

  // ==========================================================================
  // Path Operations
  // ==========================================================================

  /**
   * Parse file path
   */
  ipcMain.handle('path:parse', (event, filePath) => {
    return path.parse(filePath);
  });

  /**
   * Join path segments
   */
  ipcMain.handle('path:join', (event, ...segments) => {
    return path.join(...segments);
  });

  /**
   * Get path separator
   */
  ipcMain.handle('path:separator', () => {
    return path.sep;
  });

  // ==========================================================================
  // File Utilities
  // ==========================================================================

  /**
   * Convert path to file URL
   */
  ipcMain.handle('util:pathToFileURL', (event, filePath) => {
    return fileUrl(filePath);
  });

  /**
   * Get MIME type
   */
  ipcMain.handle('util:getMimeType', (event, filePath) => {
    const mimeType = mime.getType(filePath);
    if (mimeType) return mimeType;

    const parsedPath = path.parse(filePath);
    return `file/${parsedPath.ext}`;
  });

  /**
   * Get current working directory
   */
  ipcMain.handle('util:getCwd', () => {
    return process.cwd();
  });

  /**
   * Get user data path
   */
  ipcMain.handle('util:getUserDataPath', () => {
    return app.getPath('userData');
  });

  /**
   * Check if in dev mode
   */
  ipcMain.handle('util:isDev', () => {
    return isDev;
  });

  /**
   * Get platform info
   */
  ipcMain.handle('util:getPlatform', () => {
    return {
      platform: process.platform,
      separator: path.sep,
      arch: process.arch,
    };
  });

  // ==========================================================================
  // File Watching (Chokidar)
  // ==========================================================================

  /**
   * Start watching a directory
   */
  ipcMain.handle('watcher:start', (event, dirPath, options = {}) => {
    const watcherId = `watcher_${Date.now()}_${Math.random()}`;

    const watcher = chokidar.watch(dirPath, {
      ignored: /[/\\]\./,
      persistent: true,
      ignoreInitial: options.ignoreInitial || false,
      ...options,
    });

    // Forward chokidar events to renderer
    watcher
      .on('add', (filePath) => {
        mainWindow.webContents.send('fs:event', {
          type: 'add',
          path: filePath,
          watcherId,
        });
      })
      .on('addDir', (dirPath) => {
        mainWindow.webContents.send('fs:event', {
          type: 'addDir',
          path: dirPath,
          watcherId,
        });
      })
      .on('change', (filePath) => {
        mainWindow.webContents.send('fs:event', {
          type: 'change',
          path: filePath,
          watcherId,
        });
      })
      .on('unlink', (filePath) => {
        mainWindow.webContents.send('fs:event', {
          type: 'unlink',
          path: filePath,
          watcherId,
        });
      })
      .on('unlinkDir', (dirPath) => {
        mainWindow.webContents.send('fs:event', {
          type: 'unlinkDir',
          path: dirPath,
          watcherId,
        });
      })
      .on('error', (error) => {
        mainWindow.webContents.send('fs:event', {
          type: 'error',
          error: error.message,
          watcherId,
        });
      })
      .on('ready', () => {
        mainWindow.webContents.send('fs:event', {
          type: 'ready',
          watcherId,
        });
      });

    watchers.set(watcherId, watcher);
    return watcherId;
  });

  /**
   * Stop watching a directory
   */
  ipcMain.handle('watcher:stop', async (event, watcherId) => {
    const watcher = watchers.get(watcherId);
    if (watcher) {
      await watcher.close();
      watchers.delete(watcherId);
      return { success: true };
    }
    return { success: false, error: 'Watcher not found' };
  });

  // ==========================================================================
  // FFmpeg Operations
  // ==========================================================================

  /**
   * Convert video file
   */
  ipcMain.handle('ffmpeg:convertVideo', (event, options) => {
    return new Promise((resolve, reject) => {
      const { input, output, width, audioCodec, audioChannels } = options;

      const command = fluentFfmpeg(input);

      if (width) {
        command.setVideoSize(`${width}x?`, true, true, '#fff');
      }
      if (audioCodec) {
        command.setAudioCodec(audioCodec);
      }
      if (audioChannels) {
        command.setAudioChannels(audioChannels);
      }

      command
        .on('start', (cmd) => {
          console.log('FFmpeg started:', cmd);
          mainWindow.webContents.send('ffmpeg:progress', {
            type: 'start',
            input,
            output,
          });
        })
        .on('progress', (progress) => {
          mainWindow.webContents.send('ffmpeg:progress', {
            type: 'progress',
            input,
            output,
            progress,
          });
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          mainWindow.webContents.send('ffmpeg:progress', {
            type: 'error',
            input,
            output,
            error: err.message,
          });
          reject(err);
        })
        .on('end', () => {
          console.log('FFmpeg finished');
          mainWindow.webContents.send('ffmpeg:progress', {
            type: 'end',
            input,
            output,
          });
          resolve({ output });
        })
        .save(output);
    });
  });

  /**
   * Convert audio to MP3 with normalization
   */
  ipcMain.handle('ffmpeg:convertToMP3', (event, inputPath, outputPath, options = {}) => {
    return new Promise((resolve, reject) => {
      const {
        bitrate = '128k',
        channels = 2,
        normalize = true,
      } = options;

      const command = fluentFfmpeg()
        .addInput(inputPath)
        .format('mp3')
        .audioBitrate(bitrate)
        .audioChannels(channels)
        .audioCodec('libmp3lame')
        .outputOptions('-y');

      if (normalize) {
        command.audioFilters('loudnorm=I=-16:TP=-1.5:LRA=11');
      }

      command
        .on('start', (cmd) => {
          console.log('MP3 conversion started:', cmd);
          mainWindow.webContents.send('ffmpeg:progress', {
            type: 'start',
            operation: 'convertToMP3',
            input: inputPath,
            output: outputPath,
          });
        })
        .on('error', (err) => {
          console.error('MP3 conversion error:', err);
          mainWindow.webContents.send('ffmpeg:progress', {
            type: 'error',
            operation: 'convertToMP3',
            error: err.message,
          });
          reject(err);
        })
        .on('end', () => {
          console.log('MP3 conversion finished');
          mainWindow.webContents.send('ffmpeg:progress', {
            type: 'end',
            operation: 'convertToMP3',
            output: outputPath,
          });
          resolve({ output: outputPath });
        })
        .save(outputPath);
    });
  });

  /**
   * Merge multiple audio files
   */
  ipcMain.handle('ffmpeg:mergeAudio', (event, inputFiles, outputPath, options = {}) => {
    return new Promise((resolve, reject) => {
      const {
        bitrate = '128k',
        channels = 1,
        silencePath = process.cwd() + '/public/silence.wav',
      } = options;

      let mergedAudio = fluentFfmpeg();
      mergedAudio.options.stdoutLines = 0;

      // Add silence as first input
      mergedAudio.addInput(silencePath);

      // Build complex filter
      let cf = '';
      inputFiles.forEach((inputFile, idx) => {
        mergedAudio.addInput(inputFile);
        cf += `[${(idx + 1).toString()}]loudnorm=I=-16:TP=-1.5:LRA=11[n];[n]silenceremove=start_periods=1:start_duration=0.1:start_threshold=-40dB[${
          idx ? 'b' : 'out'
        }];`;
        if (idx) cf += '[out][0][b]concat=v=0:n=3:a=1[out];';
        else cf += '[0][out]concat=v=0:a=1[out];';
      });
      cf = cf.substring(0, cf.lastIndexOf(';'));

      mergedAudio
        .format('mp3')
        .audioBitrate(bitrate)
        .audioChannels(channels)
        .audioCodec('libmp3lame')
        .audioFrequency(44100)
        .outputOptions(['-map [out]', '-y', '-v verbose'])
        .complexFilter(cf)
        .on('start', (cmd) => {
          console.log('Audio merge started:', cmd);
          mainWindow.webContents.send('ffmpeg:progress', {
            type: 'start',
            operation: 'mergeAudio',
            inputCount: inputFiles.length,
            output: outputPath,
          });
        })
        .on('error', (err) => {
          console.error('Audio merge error:', err);
          mainWindow.webContents.send('ffmpeg:progress', {
            type: 'error',
            operation: 'mergeAudio',
            error: err.message,
          });
          reject(err);
        })
        .on('end', (err, stdout) => {
          console.log('Audio merge finished');

          // Parse timecodes from stdout
          const relevantlines = stdout
            .split('\n')
            .filter(line => line.startsWith('[Parsed_concat') && line.includes('='))
            .map(line => {
              const value = parseFloat(line.substring(line.indexOf('=') + 1)) / 1000000 + 0.05;
              return Math.round(value * 1000) / 1000; // Round to 3 decimals
            });

          const timecodes = [];
          const len = relevantlines.length - 1;
          if (len >= 0) {
            for (let i = 0; i < len; i++) {
              if (relevantlines[i] !== relevantlines[i + 1]) {
                timecodes.push(relevantlines[i]);
              }
            }
            timecodes.push(relevantlines[len]);
          }

          mainWindow.webContents.send('ffmpeg:progress', {
            type: 'end',
            operation: 'mergeAudio',
            output: outputPath,
            timecodes,
          });

          resolve({
            output: outputPath,
            timecodes,
            command: mergedAudio,
          });
        })
        .save(outputPath);
    });
  });

  /**
   * Get media metadata using ffprobe
   */
  ipcMain.handle('ffmpeg:probe', (event, filePath) => {
    return new Promise((resolve, reject) => {
      fluentFfmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error('FFprobe error:', err);
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  });

  /**
   * Export video with multiple audio tracks and clips
   * This function takes an array of clip objects and concatenates them into a final video
   * Each clip can have:
   * - V1: Video input with start/stop times and playback speed
   * - A1: Primary audio with start/stop times and playback speed/volume
   * - A2: Secondary audio (optional) with start/stop times and playback speed/volume
   */
  ipcMain.handle('ffmpeg:exportVideo', (event, clips, outputPath, options = {}) => {
    return new Promise((resolve, reject) => {
      console.log(`Exporting video with ${clips.length} clips to ${outputPath}`);

      // Create array to hold intermediate clip files
      const clipFiles = [];
      const tempDir = path.join(app.getPath('temp'), 'prestige-export-' + Date.now());

      // Create temp directory
      if (!existsSync(tempDir)) {
        require('fs').mkdirSync(tempDir, { recursive: true });
      }

      // Process each clip into an intermediate file
      let processedClips = 0;

      const processClip = (clip, clipIndex) => {
        return new Promise((resolveClip, rejectClip) => {
          const clipOutput = path.join(tempDir, `clip_${clipIndex}.mp4`);

          const command = fluentFfmpeg();

          // Add video input with trim
          command.input(clip.V1);
          if (clip.V1Start !== undefined && clip.V1Stop !== undefined) {
            command.inputOptions([
              `-ss ${clip.V1Start}`,
              `-to ${clip.V1Stop}`
            ]);
          }

          // Add A1 audio input with trim
          command.input(clip.A1);
          if (clip.A1Start !== undefined && clip.A1Stop !== undefined) {
            command.inputOptions([
              `-ss ${clip.A1Start}`,
              `-to ${clip.A1Stop}`
            ]);
          }

          // Build filter complex for video speed, audio tempo, and mixing
          const filters = [];

          // Video speed filter (setpts)
          if (clip.V1Speed && clip.V1Speed !== 1) {
            filters.push(`[0:v]setpts=${1/clip.V1Speed}*PTS[v]`);
          } else {
            filters.push(`[0:v]copy[v]`);
          }

          // A1 audio tempo filter (handle speeds > 2 by stacking atempo filters)
          let a1Filter = '[1:a]';
          if (clip.A1Speed && clip.A1Speed !== 1) {
            let speed = clip.A1Speed;
            let tempoFilters = [];

            // Stack atempo filters for speeds > 2
            while (speed > 2) {
              tempoFilters.push('atempo=2.0');
              speed = speed / 2;
            }
            if (speed > 0.2) {
              tempoFilters.push(`atempo=${speed}`);
            }

            a1Filter += tempoFilters.join(',');
          }

          // Apply volume to A1
          if (clip.A1Vol !== undefined && clip.A1Vol !== 1) {
            a1Filter += `,volume=${clip.A1Vol}`;
          }
          a1Filter += '[a1]';
          filters.push(a1Filter);

          // Handle A2 (secondary audio) if present
          if (clip.isA2 && clip.A2) {
            // Add A2 input
            command.input(clip.A2);
            if (clip.A2Start !== undefined && clip.A2Stop !== undefined) {
              command.inputOptions([
                `-ss ${clip.A2Start}`,
                `-to ${clip.A2Stop}`
              ]);
            }

            // A2 audio tempo filter
            let a2Filter = '[2:a]';
            if (clip.A2Speed && clip.A2Speed !== 1) {
              let speed = clip.A2Speed;
              let tempoFilters = [];

              while (speed > 2) {
                tempoFilters.push('atempo=2.0');
                speed = speed / 2;
              }
              if (speed > 0.2) {
                tempoFilters.push(`atempo=${speed}`);
              }

              a2Filter += tempoFilters.join(',');
            }

            // Apply volume to A2
            if (clip.A2Vol !== undefined && clip.A2Vol !== 1) {
              a2Filter += `,volume=${clip.A2Vol}`;
            }
            a2Filter += '[a2]';
            filters.push(a2Filter);

            // Mix A1 and A2
            filters.push('[a1][a2]amix=inputs=2:duration=longest[a]');
          } else {
            // No A2, just use A1
            filters.push('[a1]copy[a]');
          }

          command.complexFilter(filters.join(';'));
          command.outputOptions([
            '-map [v]',
            '-map [a]',
            '-c:v libx264',
            '-preset fast',
            '-crf 23',
            '-c:a aac',
            '-b:a 192k'
          ]);

          command
            .on('start', (cmd) => {
              console.log(`Processing clip ${clipIndex + 1}/${clips.length}`);
              console.log('FFmpeg command:', cmd);
            })
            .on('progress', (progress) => {
              mainWindow.webContents.send('ffmpeg:progress', {
                phase: 'clip',
                clipIndex,
                totalClips: clips.length,
                percent: progress.percent || 0
              });
            })
            .on('end', () => {
              console.log(`Clip ${clipIndex + 1} processed`);
              clipFiles.push(clipOutput);
              processedClips++;
              resolveClip(clipOutput);
            })
            .on('error', (err) => {
              console.error(`Error processing clip ${clipIndex}:`, err);
              rejectClip(err);
            })
            .save(clipOutput);
        });
      };

      // Process all clips sequentially
      (async () => {
        try {
          for (let i = 0; i < clips.length; i++) {
            await processClip(clips[i], i);
          }

          // Now concatenate all clips
          console.log('Concatenating clips...');

          // Create concat file
          const concatFile = path.join(tempDir, 'concat.txt');
          const concatContent = clipFiles.map(f => `file '${f}'`).join('\n');
          require('fs').writeFileSync(concatFile, concatContent);

          const finalCommand = fluentFfmpeg();
          finalCommand
            .input(concatFile)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions(['-c copy'])
            .on('start', (cmd) => {
              console.log('Concatenating clips');
              console.log('FFmpeg command:', cmd);
            })
            .on('progress', (progress) => {
              mainWindow.webContents.send('ffmpeg:progress', {
                phase: 'concat',
                percent: progress.percent || 0
              });
            })
            .on('end', () => {
              console.log('Video export complete');

              // Clean up temp files
              try {
                clipFiles.forEach(f => {
                  if (existsSync(f)) require('fs').unlinkSync(f);
                });
                if (existsSync(concatFile)) require('fs').unlinkSync(concatFile);
                if (existsSync(tempDir)) require('fs').rmdirSync(tempDir);
              } catch (cleanupErr) {
                console.warn('Cleanup error:', cleanupErr);
              }

              resolve({
                output: outputPath,
                clips: clips.length
              });
            })
            .on('error', (err) => {
              console.error('Error concatenating clips:', err);
              reject(err);
            })
            .save(outputPath);
        } catch (err) {
          reject(err);
        }
      })();
    });
  });

  // ==========================================================================
  // XML/EAF Processing
  // ==========================================================================

  /**
   * Parse EAF file
   */
  ipcMain.handle('xml:parseEAF', async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(content);
      return result;
    } catch (error) {
      console.error('Error parsing EAF file:', error);
      throw error;
    }
  });

  /**
   * Parse XML file
   */
  ipcMain.handle('xml:parse', async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(content);
      return result;
    } catch (error) {
      console.error('Error parsing XML file:', error);
      throw error;
    }
  });
}

/**
 * Cleanup function to close all watchers
 */
function cleanup() {
  for (const [watcherId, watcher] of watchers) {
    watcher.close();
  }
  watchers.clear();
}

module.exports = {
  registerIPCHandlers,
  cleanup,
};
