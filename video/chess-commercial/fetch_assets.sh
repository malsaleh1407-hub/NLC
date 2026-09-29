#!/usr/bin/env bash
# Download everything chess_commercial.py needs into ./assets:
# the CHESS product photos and master logo from nlc.com.sa, and Outfit (OFL) from Google Fonts.
set -euo pipefail
mkdir -p assets && cd assets
for f in chess-square-1 chess-master-1 chess-master-2 chess-block-1 chess-block-2 \
         chess-line-1 chess-line-2 chess-hexa-1 chess-way-1 chess-way-2 chess-quite-1; do
  curl -sSfL -o "$f.png" "https://nlc.com.sa/images/products/chess/$f.png"
done
curl -sSfL -o Outfit.ttf "https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf"
curl -sSfL -o logo-white.svg "https://nlc.com.sa/images/logo/logo-white.svg"
rsvg-convert -h 600 logo-white.svg -o logo.png
ls -la
