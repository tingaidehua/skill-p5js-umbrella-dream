---
name: skill-p5js-umbrella-dream
description: 把一段参考视频（或一个画面构想）读懂、转成艺术意图、再写成 p5.js 生成艺术，并渲染成带原创配乐的竖版 MP4（小红书 / 抖音 3:4）。适用于“复现/重构一个数字艺术短视频”“线框物体 + 粒子 + 风 + 光斑”类的 p5.js 作品、以及需要网页互动版和视频成片同时交付的任务。
---

# p5.js 生成艺术：从参考视频到成片

本 skill 记录了《接住星星的伞》从一段 13 秒参考视频到 69 秒成片的完整做法，
可直接复用模板，也可只借用其中的流程与技巧。完整的对话式迭代过程见 `references/trajectory.md`。

## 包内文件

| 路径 | 用途 |
|---|---|
| `template/index.html` | 完整作品（单文件）：p5.js 画面 + Web Audio 乐谱 + 字幕/旁白/声音/复制轨迹/下载视频按钮 |
| `template/score.mp3` | 预渲染配乐，网页用 `<audio>` 播放（避免 iPhone 静音键吞掉 Web Audio） |
| `scripts/analyze_reference.sh` | 参考视频取证：规格、联系表、开场细看、相邻帧运动对比、背景取色、音频频谱 |
| `scripts/render_frames.js` | 无头 Chromium 固定步长逐帧截图 + OfflineAudioContext 导出配乐 WAV |
| `scripts/build_video.sh` | 帧 + 配乐 → MP4（`--small` 两遍编码压到约 14MB） |
| `scripts/p5-test-shim.js` | 无网络时的 p5 测试替身（只用于截图检查，不用于正式渲染） |
| `references/trajectory.md` | 创作轨迹：每轮用户反馈、判断、改动、验证；含参数表与已知问题 |

## 工作流

### 1. 取证：先看懂，再动手
```bash
bash scripts/analyze_reference.sh reference.mp4 ref
```
按顺序看：`contact_1fps.png`（整体时间结构）→ `opening_4fps.png`（开场动作）→
`motion_pair.png`（**相邻帧对比，判断粒子是往上还是往下走、尾巴在哪一侧**）→ `spectrum.png`（音乐结构：前奏/落拍/乐器层次）。
背景取色结果直接写进渐变。

> 教训：第一次只看静帧，把“星星从伞上被风吹走”误读成了“星星从天上落下”。运动方向一定要用相邻帧确认。

### 2. 意图：用一句话说出作者的心思
例：“伞本来挡雨，被风吹翻后成了一只碗——坏掉的地方正好能盛住光。”
这句话决定后面所有选择：三幕结构、什么时候出现星星、光往哪里聚、音乐在哪一刻落拍。

### 3. 程序结构（见模板）
- **时间线函数** `state(t)`：撑开 `o`、翻转 `v`、镜头推进、倾斜/自转/俯仰，全部是 t 的函数，便于快进和逐帧渲染。
- **手写 3D 投影**：局部坐标 → 自转 Y → 俯仰 X → 倾斜 Z → 透视。伞骨用“起止角度 + 分段积分”生成，合拢/撑开/翻转之间插值；`clamp` 保证翻转后永不放平。
- **人格化**：`effort(t)` 周期性“想合拢”，伞骨依次相位延迟（像手指攥紧），沿伞骨传波 + 高频颤抖。
- **粒子生命周期**：落入或在伞线上生成 → 沿伞骨滑向伞心停留 → 被风场吹走，保留历史点画弯曲尾巴。
- **风场** `field(x,y,t)`：缓慢摆动的风向 + 顺风推进的阵风带 + curl noise 涡旋；粒子用阻力追随当地风速。伞、挂件、粒子共用一个风场。
- **挂件**：verlet 绳链（固定首节点、6 次约束迭代），风力 > 重力时被托起乱舞。
- **发光**：`globalCompositeOperation='lighter'`；线条“淡宽 + 亮细”两遍；光斑用预渲染横向精灵。
- **字幕**：画在 canvas 上（成片里自带），`?nocap` 参数关闭。

### 4. 声音：原创，按参考的“结构与情绪”而不是旋律
- 用 `Score` 类写乐谱（和弦、八音盒、主旋律、低音弦、心跳底鼓、前奏、落拍冲击），同一份代码既能实时播放也能离线渲染。
- 落拍时刻 `DROP` 与画面翻转对齐；`kickPulse()` 让光斑随节拍呼吸；`effort` 周期 = 两小节。
- 网页播放预渲染的 `score.mp3`（`<audio>`），画面时间由 `player.currentTime` 驱动，字幕与音乐严格同步；文件加载失败才回退页面内离线合成。
- 只借鉴参考音乐的风格与结构，**不要扒原曲旋律**。

### 5. 渲染成片
```bash
npm i playwright && npx playwright install chromium
node scripts/render_frames.js template/index.html frames --nocap      # 无字幕版
node scripts/render_frames.js template/index.html framesC             # 字幕版
bash scripts/build_video.sh frames score.wav 成片.mp4
bash scripts/build_video.sh frames score.wav 成片_小.mp4 --small       # ≤15MB
```
规格：1080×1440（3:4），30fps，H.264 + AAC，`-movflags +faststart`，响度 `loudnorm I=-16`。

### 6. 验证（每轮都做）
- 画面：按 8 秒间隔抽帧拼联系表检查；关键时刻（开场、落拍、高潮、结尾）单帧放大。
- 声音：`volumedetect`（均值约 −16～−18 dB）、频谱（主旋律是否清楚、低频是否过重）。
- 网页：点击后 `player.paused === false` 且 `T ≈ player.currentTime`。

### 7. 交付
网页（可分享链接）+ 无字幕成片 + 字幕版 + 配乐 mp3 + 轨迹 + 本 skill 包。
网页右下角：字幕 / 旁白（设备 TTS）/ 声音 / 复制轨迹 / 下载视频。

## 常用调参（详见 trajectory.md 参数表）
- 伞骨更竖直：增大 `ia` 基值（接近 π 为正上）。
- 吹走的星太密：调小 `lRate`；太快：调小 `liftOff` 初速或 `field` 的 `base`。
- 风更乱：增大 `swirl`；风更直更猛：增大 `base`、减小 `swirl`。
- 空中星更多：增大 `air` 数量。
- 更悲伤：小调、降速、抽掉鼓、主旋律下行、加长混响；更明亮：大调、加拍手与踩镲、琶音滤波打开。

## 接力约定（给其他智能体）
1. 先读 `references/trajectory.md` 的“当前状态”和“已知问题与下一步”。
2. 每次改动后，在轨迹末尾追加一个 Step：用户原话 → 思考 → 动作 → 观察 → 结果，并更新参数表。
3. 保持 `__seek / __beginRender / __frame / __renderAudio` 四个钩子可用，渲染流水线才能复用。
