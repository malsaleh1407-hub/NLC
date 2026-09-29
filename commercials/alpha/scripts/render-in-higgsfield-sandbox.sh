#!/usr/bin/env bash
# Renders the ALPHA commercial end to end inside the Higgsfield cloud sandbox
# (it can reach both the Higgsfield CDN, where the Gemini stills live, and
# nlc.com.sa, where the logo, Bizmo and product photos live).
#
#   BRANCH=claude/trusting-thompson-ncmzni UPLOAD_URL='<signed PUT url>' \
#     bash render-in-higgsfield-sandbox.sh
#
# UPLOAD_URL comes from Higgsfield media_upload; without it the MP4 stays in
# the sandbox. Run with background:true (a full render takes a few minutes).
set -euo pipefail

BRANCH="${BRANCH:-claude/trusting-thompson-ncmzni}"
WORK="${WORK:-/home/user/alpha-render}"
SITE="https://nlc.com.sa"

rm -rf "$WORK" && mkdir -p "$WORK" && cd "$WORK"
git clone -q --depth 1 -b "$BRANCH" https://github.com/malsaleh1407-hub/NLC.git repo
cd repo/commercials/alpha

npm ci --no-audit --no-fund

# Licensed brand face + master logo, straight from the live site (never committed).
mkdir -p public/brand
for face in Bizmo-Regular Bizmo-Bold Bizmo-Black; do
  curl -sSf -o "public/fonts/$face.woff2" "$SITE/fonts/$face.woff2"
done
curl -sSf -o public/brand/logo-white.svg "$SITE/images/logo/logo-white.svg"

npx remotion render src/index.ts AlphaCommercial out/alpha-commercial.mp4 \
  --props=props/alpha.json --codec=h264 --crf=16 --log=info

ls -la out/alpha-commercial.mp4
if [ -n "${UPLOAD_URL:-}" ]; then
  curl -f -X PUT --upload-file out/alpha-commercial.mp4 "$UPLOAD_URL"
  echo "UPLOADED"
fi
