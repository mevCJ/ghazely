#!/usr/bin/env bash
# Final cut: cold open + demo take + settings + Kiro shots + MCP + end card, ElevenLabs voice on top.
# Inputs: video/raw/cold-open.mp4, video/recording/*.mp4, video/voice/eleven/*.mp3
# Output: video/ghazely-demo-final.mp4 (1920x1080, 30 fps)
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
rec="$root/video/recording"; vo="$root/video/voice/eleven"; work="$root/video/work/final"
mkdir -p "$work"

# Every segment: 1920x1080, 30 fps, dark letterbox, same audio format.
fit="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0a0a0c,fps=30,format=yuv420p,setsar=1"
enc=(-c:v libx264 -preset medium -crf 18 -c:a aac -ar 48000 -ac 2 -b:a 192k)

# seg <name> <input> <start> <dur> <keep-audio 0|1> [speed]
seg() {
  local name="$1" in="$2" ss="$3" t="$4" keep="$5" sp="${6:-1}"
  if [[ "$keep" == 1 ]]; then
    ffmpeg -y -loglevel error -ss "$ss" -t "$t" -i "$in" -vf "setpts=PTS/$sp,$fit" -af "atempo=$sp,aresample=48000" "${enc[@]}" "$work/$name.mp4"
  else
    ffmpeg -y -loglevel error -ss "$ss" -t "$t" -i "$in" -f lavfi -t "$t" -i anullsrc=r=48000:cl=stereo \
      -map 0:v -map 1:a -vf "$fit" "${enc[@]}" -shortest "$work/$name.mp4"
  fi
}

seg 01-cold    "$root/video/raw/cold-open.mp4" 0 30   1
# Demo take at real speed. The quiet stretch (take 13-38 s, page unchanged) is cut; it resumes as the first veins show.
seg 02a-demo   "$rec/demo.mp4"                 0 13 1
seg 02b-demo   "$rec/demo.mp4"                 38 61.7 1
seg 03-options "$rec/settings.mp4"             0 8    0
seg 04-steer   "$rec/kiro.mp4"                 0 7    0
seg 05-specs   "$rec/kiro.mp4"                 13 6.5 0
seg 06-hook    "$rec/kiro.mp4"                 23 6   0
seg 07-test    "$rec/kiro.mp4"                 37 6.5 0
seg 08-mcp     "$rec/mcp.mp4"                  0 8    0

# End card.
icon="$(base64 -i "$root/public/icons/icon-128.png" | tr -d '\n')"
cat > "$work/end.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
  <rect width="1920" height="1080" fill="#0a0a0c"/>
  <image href="data:image/png;base64,$icon" x="880" y="250" width="160" height="160"/>
  <text x="960" y="530" text-anchor="middle" font-family="Georgia" font-size="96" fill="#e8e2d8">Ghazely</text>
  <text x="960" y="610" text-anchor="middle" font-family="Georgia" font-size="40" fill="#8a8a8a">Rest your eyes... or be watched.</text>
  <text x="960" y="720" text-anchor="middle" font-family="Courier New" font-size="34" fill="#b02a2a">github.com/mevCJ/ghazely</text>
</svg>
SVG
rsvg-convert "$work/end.svg" -o "$work/end.png"
ffmpeg -y -loglevel error -loop 1 -framerate 30 -t 6.3 -i "$work/end.png" -f lavfi -t 6.3 -i anullsrc=r=48000:cl=stereo \
  -vf "fade=t=in:d=0.6,fade=t=out:st=5.5:d=0.8,format=yuv420p" "${enc[@]}" -shortest "$work/09-end.mp4"

ls "$work"/0*.mp4 | sed "s/^/file '/; s/$/'/" > "$work/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$work/list.txt" -c copy "$work/picture.mp4"

# Voice placement (seconds on the final timeline, optional :tempo). Kiro hook/test lines are swapped to match the take.
place=(
  "0000-cold-open-1:0.3" "0010-cold-open-2:10" "0020-cold-open-3:20"
  "0030-demo-start:30.5" "0040-strain:38.6" "0052-dry:43.3" "0107-haze:58.8" "0122-tunnel:63.8"
  "0130-lock:68.0" "0155-snooze:79.5" "0150-rest:101.3"
  "0205-options:105.2"
  "0215-kiro-steering:113.0" "0222-kiro-specs:120.0" "0236-kiro-hooks:126.5" "0229-kiro-test:132.6"
  "0243-kiro-mcp:139.0" "0248-close:147.2"
)
inputs=(-i "$work/picture.mp4"); filt=""; mix=""
i=1
for p in "${place[@]}"; do
  IFS=: read -r f at tempo <<<"$p"; tempo="${tempo:-1}"; ms=$(awk -v s="$at" 'BEGIN{printf "%d", s*1000}')
  inputs+=(-i "$vo/$f.mp3")
  filt+="[$i:a]atempo=$tempo,aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[v$i];"
  mix+="[v$i]"; i=$((i+1))
done
n=$((i-1))
# Recorded page sound (heartbeat, whispers) sits under the voice.
filt+="[0:a]volume=0.55[bed];${mix}amix=inputs=$n:normalize=0,volume=1.0[voice];[bed][voice]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[a]"
ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$filt" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k \
  -movflags +faststart "$root/video/ghazely-demo-final.mp4"
echo "wrote video/ghazely-demo-final.mp4"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$root/video/ghazely-demo-final.mp4"
