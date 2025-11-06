#!/bin/bash

# Generate test media files for Prestige test suite
# This script creates small video and audio files using FFmpeg

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_DIR="$SCRIPT_DIR/../src/test/fixtures/media"

echo "Creating fixtures directory: $FIXTURES_DIR"
mkdir -p "$FIXTURES_DIR"
mkdir -p "$FIXTURES_DIR/annotations"

echo ""
echo "🎬 Generating test media files with FFmpeg..."
echo ""

# Check if ffmpeg is available
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg not found in PATH"
    echo "Please install ffmpeg or ensure it's available in your PATH"
    exit 1
fi

# 1. Short test video (5 seconds, 640x480, 30fps)
echo "📹 Creating test-video-5s.mp4 (5 seconds)..."
ffmpeg -f lavfi -i testsrc=duration=5:size=640x480:rate=30 \
  -f lavfi -i sine=frequency=440:duration=5 \
  -pix_fmt yuv420p -c:v libx264 -preset ultrafast -crf 23 \
  -c:a aac -b:a 128k \
  "$FIXTURES_DIR/test-video-5s.mp4" -y 2>/dev/null

echo "✅ test-video-5s.mp4 created"

# 2. Long test video (30 seconds, 1280x720, 30fps)
echo "📹 Creating test-video-30s.mp4 (30 seconds)..."
ffmpeg -f lavfi -i testsrc=duration=30:size=1280x720:rate=30 \
  -f lavfi -i sine=frequency=440:duration=30 \
  -pix_fmt yuv420p -c:v libx264 -preset ultrafast -crf 23 \
  -c:a aac -b:a 128k \
  "$FIXTURES_DIR/test-video-30s.mp4" -y 2>/dev/null

echo "✅ test-video-30s.mp4 created"

# 3. Short test audio (5 seconds WAV)
echo "🎵 Creating test-audio-5s.wav (5 seconds)..."
ffmpeg -f lavfi -i sine=frequency=440:duration=5 \
  -c:a pcm_s16le \
  "$FIXTURES_DIR/test-audio-5s.wav" -y 2>/dev/null

echo "✅ test-audio-5s.wav created"

# 4. Long test audio (30 seconds WAV)
echo "🎵 Creating test-audio-30s.wav (30 seconds)..."
ffmpeg -f lavfi -i sine=frequency=440:duration=30 \
  -c:a pcm_s16le \
  "$FIXTURES_DIR/test-audio-30s.wav" -y 2>/dev/null

echo "✅ test-audio-30s.wav created"

# 5. Careful annotation audio (10 seconds MP3, different frequency)
echo "🗣️  Creating Careful_Merged.mp3 (annotation track)..."
ffmpeg -f lavfi -i sine=frequency=500:duration=10 \
  -c:a libmp3lame -b:a 128k \
  "$FIXTURES_DIR/annotations/Careful_Merged.mp3" -y 2>/dev/null

echo "✅ Careful_Merged.mp3 created"

# 6. Translation annotation audio (10 seconds MP3, different frequency)
echo "🗣️  Creating Translation_Merged.mp3 (annotation track)..."
ffmpeg -f lavfi -i sine=frequency=800:duration=10 \
  -c:a libmp3lame -b:a 128k \
  "$FIXTURES_DIR/annotations/Translation_Merged.mp3" -y 2>/dev/null

echo "✅ Translation_Merged.mp3 created"

# 7. Create a realistic project structure for E2E tests
echo ""
echo "📁 Creating sample project structure..."
SAMPLE_PROJECT="$FIXTURES_DIR/sample-project"
mkdir -p "$SAMPLE_PROJECT"
mkdir -p "$SAMPLE_PROJECT/Pourquoi_Source_01_StandardAudio.wav_Annotations"

# Copy video to sample project
cp "$FIXTURES_DIR/test-video-30s.mp4" "$SAMPLE_PROJECT/Pourquoi_Source_01.mp4"
cp "$FIXTURES_DIR/test-audio-30s.wav" "$SAMPLE_PROJECT/Pourquoi_Source_01_StandardAudio.wav"
cp "$FIXTURES_DIR/annotations/Careful_Merged.mp3" "$SAMPLE_PROJECT/Pourquoi_Source_01_StandardAudio.wav_Annotations/Careful_Merged.mp3"
cp "$FIXTURES_DIR/annotations/Translation_Merged.mp3" "$SAMPLE_PROJECT/Pourquoi_Source_01_StandardAudio.wav_Annotations/Translation_Merged.mp3"

# Create sample annot.json
cat > "$SAMPLE_PROJECT/annot.json" << 'EOF'
{
  "annotations": [],
  "annotationSet": [],
  "annotationTable": [
    {
      "id": 0,
      "startTime": 0,
      "txtTransc": "Test annotation"
    }
  ],
  "audCarefulMain": true,
  "audTranslMain": true,
  "categories": [],
  "fileInfoMain": false,
  "sayMoreMetaMain": false,
  "timeline": [],
  "currentTimeline": -1,
  "prevTimeline": -1,
  "txtTranscMain": true,
  "txtTranscSubtitle": false,
  "txtTranslMain": true,
  "txtTranslSubtitle": false,
  "timelineChanged": true,
  "timelinesInstantiated": false
}
EOF

echo "✅ Sample project created at $SAMPLE_PROJECT"

echo ""
echo "✅ All test media files generated successfully!"
echo ""
echo "📊 File sizes:"
du -sh "$FIXTURES_DIR/test-video-5s.mp4"
du -sh "$FIXTURES_DIR/test-video-30s.mp4"
du -sh "$FIXTURES_DIR/test-audio-5s.wav"
du -sh "$FIXTURES_DIR/test-audio-30s.wav"
du -sh "$FIXTURES_DIR/annotations/Careful_Merged.mp3"
du -sh "$FIXTURES_DIR/annotations/Translation_Merged.mp3"
echo ""
echo "Total size:"
du -sh "$FIXTURES_DIR"
echo ""
echo "✨ Test fixtures ready for use!"
