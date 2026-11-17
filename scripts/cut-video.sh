#!/usr/bin/env bash
# First cut: title cards + the one-take demo recording + the voice track, 180 s at 1080p.
# Cards stand in for shots not filmed yet (camera, snooze take, Kiro screens).
# Cards are SVG rendered by rsvg-convert because this ffmpeg build has no drawtext.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
raw="$root/video/raw"
work="$root/video/work"
mkdir -p "$work"

# Seconds into take1.mov where Demo mode was clicked, from the CLI's DEMO_START stamp.
demo_at="${DEMO_AT:-36.27}"
crop="crop=2261:1272:310:336,scale=1920:1080,fps=30,format=yuv420p"
enc=(-c:v libx264 -preset veryfast -crf 20 -an)

esc() { printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

# card <name> <seconds> <headline> [subline] [mono-line] [icon]
card() {
  local name="$1" dur="$2" head sub mono icon=""
  head="$(esc "$3")"; sub="$(esc "${4:-}")"; mono="$(esc "${5:-}")"
  if [[ -n "${6:-}" ]]; then
    # Inline data URI: rsvg-convert refuses file:// images outside the SVG's folder.
    icon="<image href=\"data:image/png;base64,$(base64 -i "$root/public/icons/icon-128.png" | tr -d '\n')\" x=\"850\" y=\"180\" width=\"220\" height=\"220\"/>"
  fi
  cat > "$work/$name.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
  <rect width="1920" height="1080" fill="#1a1a1a"/>
  $icon
  <text x="960" y="470" text-anchor="middle" font-family="Georgia" font-size="76" fill="#e8e2d8">$head</text>
  <text x="960" y="570" text-anchor="middle" font-family="Georgia" font-size="42" fill="#8a8a8a">$sub</text>
  <text x="960" y="680" text-anchor="middle" font-family="Courier New" font-size="38" fill="#b02a2a">$mono</text>
</svg>
SVG
  rsvg-convert "$work/$name.svg" -o "$work/$name.png"
  local out
  out=$(awk -v d="$dur" 'BEGIN{print d-0.5}')
  ffmpeg -y -loglevel error -loop 1 -framerate 30 -t "$dur" -i "$work/$name.png" \
    -vf "fade=t=in:d=0.5,fade=t=out:st=$out:d=0.5,format=yuv420p" "${enc[@]}" "$work/$name.mp4"
}

card c01 10 "Two hours." "You haven't looked away once."
card c02 20 "Tired. Dry. A little blurry." "That's digital eye strain. Ghazely makes the page feel it."

# 0:30 to 1:55 is one unbroken take: the click, every stage, the lock, the clear page.
ffmpeg -y -loglevel error -ss "$demo_at" -i "$raw/take1.mov" -t 85 -vf "$crop" "${enc[@]}" "$work/demo.mp4"

card c03 20 "A work tool, not a prison." "3 snoozes a day. Each one brings it back sooner." "Skips calls, payments, banking"
card k1 6.6 "One steering file." "Every stage, color and line of copy." ".kiro/steering/scare-script.md"
card k2 6.6 "Four specs." "Requirements, design, tasks." ".kiro/specs/"
card k3 6.6 "The code can't drift." "Edit a stage time and this test fails." "tests/scare-script.test.ts"
card k4 6.6 "Every save is checked." "Lint, typecheck, tests in Kiro IDE." ".kiro/hooks/"
card k5 6.6 "Kiro CLI drives Chrome." "Through the Chrome DevTools MCP." "kiro-cli + chrome-devtools-mcp"
card end 12 "Ghazely" "Rest your eyes... or be watched." "" icon

: > "$work/list.txt"
for s in c01 c02 demo c03 k1 k2 k3 k4 k5 end; do echo "file '$work/$s.mp4'" >> "$work/list.txt"; done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$work/list.txt" -c copy "$work/picture.mp4"

ffmpeg -y -loglevel error -i "$work/picture.mp4" -i "$root/video/voice-track.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t 180 "$root/video/ghazely-demo-v1.mp4"
