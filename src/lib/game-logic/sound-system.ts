// 過剰実装により削除
// 基本的な音量調整はMusicProviderで十分

export const soundSystem = {
  initialize: () => Promise.resolve(),
  playSound: () => {},
  setVolume: () => {},
  playEvent: (event?: any) => {},
  playBGM: (track: string) => {},
  stopBGM: () => {},
  fadeBGM: (duration: number) => {},
  getConfig: () => ({ volume: 0.7 }),
  getStatus: () => ({ isPlaying: false, currentTrack: null }),
  updateConfig: (config: any) => {},
  stopAll: () => {},
  playRandomAmbient: () => {},
  config: { volume: 0.7 }
}

// 互換性のためのダミー関数
export const playExpeditionStartSound = () => {}
export const playMoneySound = () => {}
export const playPokemonCatchSound = () => {}
export const playLevelUpSound = () => {}