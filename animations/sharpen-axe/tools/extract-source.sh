#!/usr/bin/env bash
# Cut the original video into 24 fps frames for the split layout's bottom panel, then
# remove the Instagram watermark and logo outro (needs python3 with opencv + numpy).
#   tools/extract-source.sh <original-video.mp4>
# Crop keeps the speaker's turban, face and the tarot card he holds; the source's
# first frame is black, so frame 1 stands in for it.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p source-frames-raw
ffmpeg -v error -y -i "$1" -vf "fps=24,crop=576:480:0:205,scale=864:720:flags=lanczos" -q:v 3 -start_number 0 source-frames-raw/v_%05d.jpg
cp source-frames-raw/v_00001.jpg source-frames-raw/v_00000.jpg
"${PYTHON:-python3}" tools/clean_source.py source-frames-raw source-frames
