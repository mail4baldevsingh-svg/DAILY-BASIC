#!/usr/bin/env bash
# Encode rendered frames + the original voice-over into an Instagram-ready MP4.
# The voice-over is shorter than the animation, so it is padded with silence.
#   tools/encode.sh <framesDir> <sourceVideoOrAudio> <out.mp4>
set -euo pipefail
FRAMES="$1"; AUDIO_SRC="$2"; OUT="$3"
ffmpeg -v error -y \
  -framerate 24 -i "$FRAMES/f_%05d.jpg" \
  -i "$AUDIO_SRC" \
  -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -preset slow -crf 21 -maxrate 10M -bufsize 20M -pix_fmt yuv420p -profile:v high -movflags +faststart \
  -af apad -c:a aac -b:a 192k -ar 44100 \
  -t "$(python3 -c "import glob,sys; print(len(glob.glob(sys.argv[1] + '/f_*.jpg')) / 24)" "$FRAMES")" "$OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$OUT"
