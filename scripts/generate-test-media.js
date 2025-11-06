#!/usr/bin/env node

/**
 * Generate test media files for Prestige test suite
 * Uses fluent-ffmpeg with ffmpeg-static-electron binaries
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

// Use ffmpeg binaries from ffmpeg-static-electron
const ffmpegPath = require('ffmpeg-static-electron').path;
const ffprobePath = require('ffprobe-static-electron').path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const fixturesDir = path.join(__dirname, '../src/test/fixtures/media');
const annotationsDir = path.join(fixturesDir, 'annotations');
const sampleProjectDir = path.join(fixturesDir, 'sample-project');

console.log('Creating fixtures directory:', fixturesDir);
fs.ensureDirSync(fixturesDir);
fs.ensureDirSync(annotationsDir);

console.log('');
console.log('🎬 Generating test media files with FFmpeg...');
console.log('');

// Helper to run ffmpeg command with promise
function runFFmpeg(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`${description}...`);
    command
      .on('end', () => {
        console.log(`✅ ${description} - done`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`❌ ${description} - failed:`, err.message);
        reject(err);
      })
      .run();
  });
}

async function generateMedia() {
  try {
    // 1. Short test video (5 seconds, 640x480, 30fps)
    await runFFmpeg(
      ffmpeg()
        .input('testsrc=duration=5:size=640x480:rate=30')
        .inputFormat('lavfi')
        .input('sine=frequency=440:duration=5')
        .inputFormat('lavfi')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-pix_fmt yuv420p', '-preset ultrafast', '-crf 23', '-b:a 128k'])
        .output(path.join(fixturesDir, 'test-video-5s.mp4')),
      '📹 Creating test-video-5s.mp4 (5 seconds)'
    );

    // 2. Long test video (30 seconds, 1280x720, 30fps)
    await runFFmpeg(
      ffmpeg()
        .input('testsrc=duration=30:size=1280x720:rate=30')
        .inputFormat('lavfi')
        .input('sine=frequency=440:duration=30')
        .inputFormat('lavfi')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-pix_fmt yuv420p', '-preset ultrafast', '-crf 23', '-b:a 128k'])
        .output(path.join(fixturesDir, 'test-video-30s.mp4')),
      '📹 Creating test-video-30s.mp4 (30 seconds)'
    );

    // 3. Short test audio (5 seconds WAV)
    await runFFmpeg(
      ffmpeg()
        .input('sine=frequency=440:duration=5')
        .inputFormat('lavfi')
        .audioCodec('pcm_s16le')
        .output(path.join(fixturesDir, 'test-audio-5s.wav')),
      '🎵 Creating test-audio-5s.wav (5 seconds)'
    );

    // 4. Long test audio (30 seconds WAV)
    await runFFmpeg(
      ffmpeg()
        .input('sine=frequency=440:duration=30')
        .inputFormat('lavfi')
        .audioCodec('pcm_s16le')
        .output(path.join(fixturesDir, 'test-audio-30s.wav')),
      '🎵 Creating test-audio-30s.wav (30 seconds)'
    );

    // 5. Careful annotation audio (10 seconds MP3)
    await runFFmpeg(
      ffmpeg()
        .input('sine=frequency=500:duration=10')
        .inputFormat('lavfi')
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .output(path.join(annotationsDir, 'Careful_Merged.mp3')),
      '🗣️  Creating Careful_Merged.mp3 (annotation track)'
    );

    // 6. Translation annotation audio (10 seconds MP3)
    await runFFmpeg(
      ffmpeg()
        .input('sine=frequency=800:duration=10')
        .inputFormat('lavfi')
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .output(path.join(annotationsDir, 'Translation_Merged.mp3')),
      '🗣️  Creating Translation_Merged.mp3 (annotation track)'
    );

    // 7. Create sample project structure
    console.log('');
    console.log('📁 Creating sample project structure...');
    fs.ensureDirSync(sampleProjectDir);
    const projectAnnotDir = path.join(sampleProjectDir, 'Pourquoi_Source_01_StandardAudio.wav_Annotations');
    fs.ensureDirSync(projectAnnotDir);

    // Copy files
    fs.copyFileSync(
      path.join(fixturesDir, 'test-video-30s.mp4'),
      path.join(sampleProjectDir, 'Pourquoi_Source_01.mp4')
    );
    fs.copyFileSync(
      path.join(fixturesDir, 'test-audio-30s.wav'),
      path.join(sampleProjectDir, 'Pourquoi_Source_01_StandardAudio.wav')
    );
    fs.copyFileSync(
      path.join(annotationsDir, 'Careful_Merged.mp3'),
      path.join(projectAnnotDir, 'Careful_Merged.mp3')
    );
    fs.copyFileSync(
      path.join(annotationsDir, 'Translation_Merged.mp3'),
      path.join(projectAnnotDir, 'Translation_Merged.mp3')
    );

    // Create annot.json
    const annotJson = {
      annotations: [],
      annotationSet: [],
      annotationTable: [
        {
          id: 0,
          startTime: 0,
          txtTransc: 'Test annotation'
        }
      ],
      audCarefulMain: true,
      audTranslMain: true,
      categories: [],
      fileInfoMain: false,
      sayMoreMetaMain: false,
      timeline: [],
      currentTimeline: -1,
      prevTimeline: -1,
      txtTranscMain: true,
      txtTranscSubtitle: false,
      txtTranslMain: true,
      txtTranslSubtitle: false,
      timelineChanged: true,
      timelinesInstantiated: false
    };

    fs.writeFileSync(
      path.join(sampleProjectDir, 'annot.json'),
      JSON.stringify(annotJson, null, 2)
    );

    console.log('✅ Sample project created');

    // Show file sizes
    console.log('');
    console.log('✅ All test media files generated successfully!');
    console.log('');
    console.log('📊 Files created:');
    const files = [
      'test-video-5s.mp4',
      'test-video-30s.mp4',
      'test-audio-5s.wav',
      'test-audio-30s.wav',
      'annotations/Careful_Merged.mp3',
      'annotations/Translation_Merged.mp3'
    ];

    let totalSize = 0;
    files.forEach(file => {
      const filePath = path.join(fixturesDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  ${file}: ${sizeMB} MB`);
        totalSize += stats.size;
      }
    });

    console.log('');
    console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('✨ Test fixtures ready for use!');
  } catch (error) {
    console.error('');
    console.error('❌ Failed to generate test media:', error.message);
    process.exit(1);
  }
}

generateMedia();
