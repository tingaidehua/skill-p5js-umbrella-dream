#!/usr/bin/env bash
# 参考视频取证：规格、联系表、开场细看、相邻帧局部对比、背景取色、音频频谱
# 用法：bash analyze_reference.sh <参考视频> [输出目录=ref]
set -e
V="$1"; O="${2:-ref}"; mkdir -p "$O"
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate,codec_type -of compact "$V" | tee "$O/info.txt"
ffmpeg -v error -y -i "$V" -vf "fps=1,scale=240:-1,tile=7x2" -frames:v 1 "$O/contact_1fps.png"
ffmpeg -v error -y -ss 0.4 -i "$V" -vf "fps=4,scale=200:-1,tile=6x1" -frames:v 1 "$O/opening_4fps.png"
# 相邻帧局部对比：用来判断粒子到底往哪个方向运动（尾巴在哪一侧）
MID=$(python3 -c "import subprocess;d=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','$V']));print(d*0.45)")
ffmpeg -v error -y -ss "$MID" -i "$V" -frames:v 3 -vf "crop=iw/2:ih/3:iw/2.4:0,scale=480:-1" "$O/pair_%d.png"
ffmpeg -v error -y -i "$O/pair_1.png" -i "$O/pair_3.png" -filter_complex hstack "$O/motion_pair.png"
ffmpeg -v error -y -i "$V" -vn -ac 1 -ar 22050 "$O/audio.wav" && \
ffmpeg -v error -y -i "$O/audio.wav" -lavfi "showspectrumpic=s=1400x500:legend=1:scale=log:fscale=log:stop=8000" "$O/spectrum.png" || true
ffmpeg -v error -y -ss "$MID" -i "$V" -frames:v 1 "$O/mid.png"
python3 - "$O/mid.png" <<'PY'
import sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB'); w,h=im.size
for f in [0.02,0.3,0.5,0.7,0.9,0.99]:
    print('背景取色 y=%.2f'%f, im.getpixel((8,int(f*h)-1)))
PY
echo "看图顺序：contact_1fps → opening_4fps → motion_pair（判断运动方向）→ spectrum（判断音乐结构）"
