#!/usr/bin/env bash
# Places each voice clip at its script time and writes one 180 s track.
# Bash, not zsh: zsh reads "$i:a" as a path modifier and breaks the filter graph.
set -euo pipefail
cd "$(dirname "$0")/../video/voice"

placements=(
  v01:0 v02:10 v03:30 v04:40 v05:52 v06:67 v07:82 v08:93 v09:110 v10:115
  k1:135 k2:142.5 k3:149 k4:155.5 k5:160.5 v11:168
)

inputs=()
filter=""
labels=""
i=0
for p in "${placements[@]}"; do
  id="${p%%:*}"
  ms=$(awk -v t="${p##*:}" 'BEGIN { printf "%d", t * 1000 }')
  inputs+=(-i "${id}.mp3")
  filter+="[${i}:a]aresample=44100,adelay=${ms}|${ms}[a${i}];"
  labels+="[a${i}]"
  i=$((i + 1))
done
filter+="${labels}amix=inputs=${i}:normalize=0:duration=longest,apad=whole_dur=180[out]"

ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$filter" \
  -map "[out]" -t 180 -ac 2 -c:a pcm_s16le ../voice-track.wav
