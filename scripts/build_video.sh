#!/usr/bin/env bash
# 合成成片：帧序列 + 配乐 → H.264/AAC MP4
# 用法：bash build_video.sh <帧目录> <score.wav> <输出.mp4> [--small]
#   --small：两遍编码压到约 14MB（网页内下载、部分平台上传限制）
set -e
FR="$1"; WAV="$2"; OUT="$3"; SMALL="$4"
ffmpeg -v error -y -i "$WAV" -af "loudnorm=I=-16:TP=-1.2:LRA=11" -ar 44100 score_n.wav
if [ "$SMALL" = "--small" ]; then
  ffmpeg -v error -y -framerate 30 -i "$FR/%05d.jpg" -c:v libx264 -preset slow -b:v 1500k -pass 1 -an -f mp4 /dev/null
  ffmpeg -v error -y -framerate 30 -i "$FR/%05d.jpg" -i score_n.wav -c:v libx264 -preset slow -b:v 1500k -pass 2 \
    -pix_fmt yuv420p -c:a aac -b:a 128k -shortest -movflags +faststart "$OUT"
  rm -f ffmpeg2pass-0.log*
else
  ffmpeg -v error -y -framerate 30 -i "$FR/%05d.jpg" -i score_n.wav -c:v libx264 -crf 21 -preset slow \
    -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
fi
echo "-> $OUT"
