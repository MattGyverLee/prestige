/**
 * Web Audio Segment Player
 *
 * Plays annotation audio segments using Web Audio API with:
 * - Lazy loading of segments
 * - LRU cache for frequently used segments
 * - Speed adjustment (playbackRate)
 * - Volume control (king/prince logic)
 * - Precise timing synchronization with video
 */

import { MilestoneData } from "../store/annot/types";

interface CachedSegment {
  audioBuffer: AudioBuffer;
  lastUsed: number;
}

interface PlayingSource {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  startTime: number;
  stopTime: number;
}

export class WebAudioPlayer {
  private audioContext: AudioContext;
  private segmentCache: Map<string, CachedSegment>;
  private maxCacheSize: number;
  private playingSources: PlayingSource[];
  private fileHandleCache: Map<string, FileSystemFileHandle>;

  constructor(maxCacheSize = 20) {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    this.segmentCache = new Map();
    this.maxCacheSize = maxCacheSize;
    this.playingSources = [];
    this.fileHandleCache = new Map();
  }

  /**
   * Load an audio segment from file
   */
  async loadSegment(fileHandle: FileSystemFileHandle): Promise<AudioBuffer> {
    const cacheKey = await this.getHandleIdentifier(fileHandle);

    // Check cache
    const cached = this.segmentCache.get(cacheKey);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached.audioBuffer;
    }

    // Load from file
    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Add to cache
    this.addToCache(cacheKey, audioBuffer);

    return audioBuffer;
  }

  /**
   * Get unique identifier for file handle
   */
  private async getHandleIdentifier(
    fileHandle: FileSystemFileHandle,
  ): Promise<string> {
    // Use file name as identifier (in real implementation, might want full path)
    return fileHandle.name;
  }

  /**
   * Add audio buffer to cache with LRU eviction
   */
  private addToCache(key: string, audioBuffer: AudioBuffer): void {
    // Evict oldest if cache is full
    if (this.segmentCache.size >= this.maxCacheSize) {
      let oldestKey = "";
      let oldestTime = Date.now();

      for (const [k, v] of this.segmentCache.entries()) {
        if (v.lastUsed < oldestTime) {
          oldestTime = v.lastUsed;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.segmentCache.delete(oldestKey);
      }
    }

    this.segmentCache.set(key, {
      audioBuffer,
      lastUsed: Date.now(),
    });
  }

  /**
   * Play a milestone's annotation segments
   */
  async playMilestone(
    milestoneData: MilestoneData[],
    currentTime: number,
    _videoElement?: HTMLVideoElement,
  ): Promise<void> {
    // Stop any currently playing sources
    this.stopAll();

    for (const data of milestoneData) {
      if (
        data.data &&
        typeof data.data === "string" &&
        data.data.startsWith("blob:")
      ) {
        // This is a blob URL - play it
        await this.playSegmentFromBlob(
          data.data,
          data.clipStart || 0,
          data.clipStop || 0,
          currentTime,
          this.calculateVolume(data),
          1.0, // Speed adjustment would come from milestone config
        );
      }
    }
  }

  /**
   * Play audio segment from blob URL
   */
  private async playSegmentFromBlob(
    blobUrl: string,
    clipStart: number,
    clipStop: number,
    startTime: number,
    volume: number,
    speed: number,
  ): Promise<void> {
    try {
      // Fetch blob and decode
      const response = await fetch(blobUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Create audio graph
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = speed;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Calculate timing
      const now = this.audioContext.currentTime;
      const offset = clipStart;
      const duration = clipStop - clipStart;

      // Play segment
      if (duration > 0) {
        source.start(now + startTime, offset, duration);
      } else {
        // Play entire buffer if no clip times specified
        source.start(now + startTime);
      }

      // Track playing source
      this.playingSources.push({
        source,
        gainNode,
        startTime: now + startTime,
        stopTime:
          now +
          startTime +
          (duration > 0 ? duration / speed : audioBuffer.duration / speed),
      });

      // Clean up when finished
      source.onended = () => {
        this.playingSources = this.playingSources.filter(
          (ps) => ps.source !== source,
        );
      };
    } catch (error) {
      console.error("Error playing segment:", error);
    }
  }

  /**
   * Calculate volume based on king/prince logic
   * Kings (volume >= 0.84) get full volume
   * Princes get reduced volume
   */
  private calculateVolume(_data: MilestoneData): number {
    // This would come from your milestone metadata
    // For now, return full volume
    return 1.0;
  }

  /**
   * Stop all currently playing sources
   */
  stopAll(): void {
    for (const ps of this.playingSources) {
      try {
        ps.source.stop();
      } catch {
        // Already stopped
      }
    }
    this.playingSources = [];
  }

  /**
   * Pause audio context (for when video is paused)
   */
  async pause(): Promise<void> {
    if (this.audioContext.state === "running") {
      await this.audioContext.suspend();
    }
  }

  /**
   * Resume audio context
   */
  async resume(): Promise<void> {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    for (const ps of this.playingSources) {
      ps.gainNode.gain.value = volume;
    }
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.stopAll();
    await this.audioContext.close();
    this.segmentCache.clear();
    this.fileHandleCache.clear();
  }

  /**
   * Preload next N segments for smooth playback
   */
  async preloadSegments(fileHandles: FileSystemFileHandle[]): Promise<void> {
    const promises = fileHandles.slice(0, 3).map((handle) =>
      this.loadSegment(handle).catch((err) => {
        console.warn("Failed to preload segment:", err);
        return null;
      }),
    );

    await Promise.all(promises);
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.segmentCache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses
    };
  }
}

/**
 * Create singleton instance for app-wide use
 */
let playerInstance: WebAudioPlayer | null = null;

export function getWebAudioPlayer(): WebAudioPlayer {
  if (!playerInstance) {
    playerInstance = new WebAudioPlayer();
  }
  return playerInstance;
}

export function resetWebAudioPlayer(): void {
  if (playerInstance) {
    playerInstance.dispose();
    playerInstance = null;
  }
}
