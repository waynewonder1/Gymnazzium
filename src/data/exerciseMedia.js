// Real photos (and a few short clips) of each move, filmed at the gym. Files live in public/exercises/:
// <id>-1.webp, <id>-2.webp … (640×800, no location data) and <id>.mp4 (short, silent loop).
// `photos` are captions in order: usually the start and the finish of one rep.
export const exerciseMedia = {
  chestFly: { photos: ['Arms open', 'Squeeze together'], video: true },
  shoulderPress: { photos: ['Handles at shoulder height', 'Press overhead'], video: true },
  inclineBench: { photos: ['Lock out over your upper chest'] },
  benchPress: { photos: ['Grip just wider than shoulders'] },
  machinePullover: { photos: ['Start: arms overhead', 'Finish: hands by your hips'], video: true },
  latPulldown: { photos: ['Start: arms long', 'Finish: bar to upper chest'] },
  machineRow: { photos: ['Start: reach forward', 'Finish: pull to your ribs'] },
  bentRow: { photos: ['Start: arms long', 'Finish: squeeze your back'] },
  tricepsPushdown: { photos: ['Start: elbows at your sides', 'Finish: arms straight'], video: true },
  rearDeltFly: { photos: ['Machine version: arms out wide'] },
  hangingLegRaise: { photos: ['Easier: knees up', 'Harder: legs all the way up'], video: true },
  deadHang: { photos: ['Straight arms, grip hard'] },
};

export const photoSrc = (id, i) => `/exercises/${id}-${i + 1}.webp`;
export const videoSrc = (id) => `/exercises/${id}.mp4`;
