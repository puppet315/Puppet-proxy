#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$ROOT_DIR/vendor/scramjet"
PUBLIC_SCRAMJET_DIR="$ROOT_DIR/public/scramjet"

if [[ ! -d "$VENDOR_DIR/.git" ]]; then
  echo "[setup] Cloning MercuryWorkshop/scramjet into vendor/scramjet..."
  git clone --depth 1 https://github.com/MercuryWorkshop/scramjet.git "$VENDOR_DIR"
else
  echo "[setup] Updating existing vendor/scramjet checkout..."
  git -C "$VENDOR_DIR" pull --ff-only
fi

mkdir -p "$PUBLIC_SCRAMJET_DIR"

if [[ -f "$VENDOR_DIR/static/scramjet.client.js" ]]; then
  cp "$VENDOR_DIR/static/scramjet.client.js" "$PUBLIC_SCRAMJET_DIR/scramjet.client.js"
  echo "[setup] Installed static/scramjet.client.js -> public/scramjet/scramjet.client.js"
else
  echo "[setup] WARNING: static/scramjet.client.js not found in vendored repository."
  echo "[setup] You may need to build Scramjet first, then copy the client bundle manually."
fi
