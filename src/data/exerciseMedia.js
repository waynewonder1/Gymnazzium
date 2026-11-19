// Real photos (and a few short clips) of each move, filmed at the gym. Files live in public/exercises/:
// <id>-1.webp, <id>-2.webp … (640×800, no location data) and <id>.mp4 (short, silent loop).
// `photos` are captions in order: usually the start and the finish of one rep.
export const exerciseMedia = {
  // Home moves (from the TikTok home push day)
  pushup: { photos: ['Start: arms straight, body in a line', 'Finish: chest to the floor'], video: true },
  diamondPushup: { photos: ['Start: hands together under your chest', 'Finish: chest down to your hands'], video: true },
  pikePushup: { photos: ['Start: hips high, arms straight', 'Finish: head down between your hands'], video: true },
  chestFly: { photos: ['Arms open', 'Squeeze together'], video: true },
  shoulderPress: { photos: ['Handles at shoulder height', 'Press overhead'], video: true },
  inclineBench: { photos: ['Lock out over your upper chest'], video: true },
  benchPress: { photos: ['Grip just wider than shoulders'], video: true },
  machinePullover: { photos: ['Start: arms overhead', 'Finish: hands by your hips'], video: true },
  latPulldown: { photos: ['Start: arms long', 'Finish: bar to upper chest'] },
  machineRow: { photos: ['Start: reach forward', 'Finish: pull to your ribs'] },
  bentRow: { photos: ['Start: arms long', 'Finish: squeeze your back'] },
  tricepsPushdown: { photos: ['Start: elbows at your sides', 'Finish: arms straight'], video: true },
  rearDeltFly: { photos: ['Machine version: arms out wide'] },
  // Landscape clips (wide: true → shown in a 5:3 frame instead of the tall 4:5 one)
  lateralRaise: { photos: ['Start: arms by your sides', 'Finish: arms out to shoulder height'], video: true, wide: true },
  skullCrusher: { photos: ['Start: bar straight above your chest', 'Finish: bar lowered to your forehead'], video: true, wide: true },
  machineCurl: { photos: ['Curl up and squeeze, one arm at a time or both'], video: true, wide: true },
  spiderCurl: { photos: ['Start: arms hanging straight down', 'Finish: curl up and squeeze'], video: true, wide: true },
  preacherCurl: { photos: ['Start: arm long on the pad', 'Finish: curl up and squeeze'], video: true },
  hangingLegRaise: { photos: ['Easier: knees up', 'Harder: legs all the way up'], video: true },
  deadHang: { photos: ['Straight arms, grip hard'] },
};

export const photoSrc = (id, i) => `/exercises/${id}-${i + 1}.webp`;
export const videoSrc = (id) => `/exercises/${id}.mp4`;
