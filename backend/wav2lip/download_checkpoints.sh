#!/bin/bash
# Downloads the two model checkpoints Wav2Lip needs. Run from this directory.
# If your connection drops mid-download, just re-run this script -- curl -C - resumes.
set -e
cd "$(dirname "$0")"
mkdir -p checkpoints

echo "Downloading wav2lip_gan.pth (~436MB)..."
curl -L --retry 5 -C - -o checkpoints/wav2lip_gan.pth \
  "https://huggingface.co/camenduru/Wav2Lip/resolve/main/checkpoints/wav2lip_gan.pth"

echo "Downloading mobilenet.pth (RetinaFace face-detector backbone, ~2MB)..."
curl -L --retry 5 -C - -o checkpoints/mobilenet.pth \
  "https://github.com/justinjohn0306/Wav2Lip/releases/download/models/mobilenet.pth"

echo "Done. Checkpoint sizes:"
ls -la checkpoints/
