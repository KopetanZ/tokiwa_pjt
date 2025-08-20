// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock Web Audio API for testing
global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn().mockReturnValue({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { setValueAtTime: jest.fn() },
    type: 'sine'
  }),
  createGain: jest.fn().mockReturnValue({
    connect: jest.fn(),
    gain: { setValueAtTime: jest.fn() }
  }),
  destination: {}
}))

// Mock sound system methods  
jest.mock('./src/lib/game-logic/sound-system', () => ({
  soundSystem: {
    playLevelUpSound: jest.fn(),
    playFacilityUpgradeSound: jest.fn(),
    playFacilityCompleteSound: jest.fn(),
    playExpeditionStartSound: jest.fn(),
    playPokemonCaptureSound: jest.fn(),
    playBGM: jest.fn(),
    playSFX: jest.fn(),
    stopBGM: jest.fn(),
    setVolume: jest.fn(),
    initialize: jest.fn().mockReturnValue(false)
  },
  playExpeditionStartSound: jest.fn(),
  playLevelUpSound: jest.fn(),
  playFacilityUpgradeSound: jest.fn(),
  playFacilityCompleteSound: jest.fn(),
  playPokemonCaptureSound: jest.fn(),
  playPokemonCatchSound: jest.fn(),
  playMoneySound: jest.fn()
}))

// Mock fetch for PokeAPI calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      id: 25,
      name: 'pikachu',
      sprites: { front_default: 'test.png' },
      types: [{ type: { name: 'electric' } }],
      stats: [
        { base_stat: 35, stat: { name: 'hp' } },
        { base_stat: 55, stat: { name: 'attack' } },
        { base_stat: 40, stat: { name: 'defense' } },
        { base_stat: 50, stat: { name: 'special-attack' } },
        { base_stat: 50, stat: { name: 'special-defense' } },
        { base_stat: 90, stat: { name: 'speed' } }
      ],
      abilities: [{ ability: { name: 'static' } }],
      height: 4,
      weight: 60,
      base_experience: 112,
      species: { url: 'test' }
    })
  })
)

// Console suppression for cleaner test output
const originalConsoleLog = console.log
const originalConsoleError = console.error

beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})