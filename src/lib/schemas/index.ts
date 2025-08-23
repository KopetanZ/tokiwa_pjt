/**
 * データスキーマ定義
 * ゲーム内で使用される全データ構造の標準化されたスキーマ
 */

// JSON Schema定義（バリデーション用）
export const GAME_DATA_SCHEMA = {
  type: 'object',
  required: ['version', 'userId', 'player', 'trainers', 'pokemon'],
  properties: {
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    userId: { type: 'string', minLength: 1 },
    lastSaved: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    
    player: {
      type: 'object',
      required: ['name', 'schoolName', 'money', 'level'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 50 },
        schoolName: { type: 'string', minLength: 1, maxLength: 100 },
        money: { type: 'number', minimum: 0 },
        reputation: { type: 'number', minimum: 0 },
        level: { type: 'number', minimum: 1, maximum: 100 },
        experience: { type: 'number', minimum: 0 },
        nextLevelExp: { type: 'number', minimum: 0 }
      }
    },
    
    trainers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'job', 'level', 'status'],
        properties: {
          id: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1, maxLength: 50 },
          job: { 
            type: 'string', 
            enum: ['ranger', 'breeder', 'researcher', 'battler', 'medic'] 
          },
          level: { type: 'number', minimum: 1, maximum: 100 },
          experience: { type: 'number', minimum: 0 },
          nextLevelExp: { type: 'number', minimum: 0 },
          status: { 
            type: 'string', 
            enum: ['available', 'on_expedition', 'training', 'resting'] 
          },
          skills: {
            type: 'object',
            required: ['capture', 'exploration', 'battle', 'research', 'healing'],
            properties: {
              capture: { type: 'number', minimum: 0, maximum: 10 },
              exploration: { type: 'number', minimum: 0, maximum: 10 },
              battle: { type: 'number', minimum: 0, maximum: 10 },
              research: { type: 'number', minimum: 0, maximum: 10 },
              healing: { type: 'number', minimum: 0, maximum: 10 }
            }
          },
          personality: {
            type: 'object',
            required: ['courage', 'caution', 'curiosity', 'teamwork', 'independence', 'compliance'],
            properties: {
              courage: { type: 'number', minimum: -10, maximum: 10 },
              caution: { type: 'number', minimum: -10, maximum: 10 },
              curiosity: { type: 'number', minimum: -10, maximum: 10 },
              teamwork: { type: 'number', minimum: -10, maximum: 10 },
              independence: { type: 'number', minimum: -10, maximum: 10 },
              compliance: { type: 'number', minimum: -10, maximum: 10 }
            }
          },
          salary: { type: 'number', minimum: 0 },
          totalEarned: { type: 'number', minimum: 0 },
          totalExpeditions: { type: 'number', minimum: 0 },
          successfulExpeditions: { type: 'number', minimum: 0 },
          pokemonCaught: { type: 'number', minimum: 0 },
          trustLevel: { type: 'number', minimum: 0, maximum: 100 },
          favoriteLocations: {
            type: 'array',
            items: { type: 'number', minimum: 1 }
          },
          hiredDate: { type: 'string', format: 'date-time' },
          lastActive: { type: 'string', format: 'date-time' }
        }
      }
    },
    
    pokemon: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'speciesId', 'name', 'level', 'status'],
        properties: {
          id: { type: 'string', minLength: 1 },
          speciesId: { type: 'number', minimum: 1 },
          name: { type: 'string', minLength: 1, maxLength: 50 },
          nameJa: { type: 'string', minLength: 1, maxLength: 50 },
          level: { type: 'number', minimum: 1, maximum: 100 },
          experience: { type: 'number', minimum: 0 },
          nextLevelExp: { type: 'number', minimum: 0 },
          hp: { type: 'number', minimum: 1 },
          maxHp: { type: 'number', minimum: 1 },
          attack: { type: 'number', minimum: 1 },
          defense: { type: 'number', minimum: 1 },
          specialAttack: { type: 'number', minimum: 1 },
          specialDefense: { type: 'number', minimum: 1 },
          speed: { type: 'number', minimum: 1 },
          status: { 
            type: 'string', 
            enum: ['healthy', 'injured', 'sick', 'training'] 
          },
          moves: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 4
          },
          ivs: {
            type: 'object',
            required: ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'],
            properties: {
              hp: { type: 'number', minimum: 0, maximum: 31 },
              attack: { type: 'number', minimum: 0, maximum: 31 },
              defense: { type: 'number', minimum: 0, maximum: 31 },
              specialAttack: { type: 'number', minimum: 0, maximum: 31 },
              specialDefense: { type: 'number', minimum: 0, maximum: 31 },
              speed: { type: 'number', minimum: 0, maximum: 31 }
            }
          },
          nature: { type: 'string', minLength: 1 },
          caughtDate: { type: 'string', format: 'date-time' },
          caughtLocation: { type: 'number', minimum: 1 },
          caughtBy: { type: 'string', minLength: 1 },
          originalTrainer: { type: 'string', minLength: 1 }
        }
      }
    },
    
    expeditions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'trainerId', 'locationId', 'status'],
        properties: {
          id: { type: 'string', minLength: 1 },
          trainerId: { type: 'string', minLength: 1 },
          locationId: { type: 'number', minimum: 1 },
          mode: { 
            type: 'string', 
            enum: ['exploration', 'balanced', 'safe', 'aggressive'] 
          },
          targetDuration: { type: 'number', minimum: 1 },
          strategy: {
            type: 'array',
            items: { type: 'string' }
          },
          status: { 
            type: 'string', 
            enum: ['preparing', 'active', 'completed', 'failed', 'recalled'] 
          },
          startTime: { type: 'string', format: 'date-time' },
          estimatedEndTime: { type: 'string', format: 'date-time' },
          actualEndTime: { type: 'string', format: 'date-time' },
          currentProgress: { type: 'number', minimum: 0, maximum: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    },
    
    facilities: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'type', 'name', 'level'],
        properties: {
          id: { type: 'string', minLength: 1 },
          type: { 
            type: 'string', 
            enum: ['healing_center', 'training_ground', 'research_lab', 'storage', 'dormitory'] 
          },
          name: { type: 'string', minLength: 1 },
          level: { type: 'number', minimum: 1, maximum: 10 },
          condition: { type: 'number', minimum: 0, maximum: 1 },
          maintenanceCost: { type: 'number', minimum: 0 },
          builtDate: { type: 'string', format: 'date-time' },
          lastUpgrade: { type: 'string', format: 'date-time' }
        }
      }
    },
    
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'type', 'category', 'amount', 'description', 'timestamp'],
        properties: {
          id: { type: 'string', minLength: 1 },
          type: { type: 'string', enum: ['income', 'expense'] },
          category: { 
            type: 'string', 
            enum: ['expedition_reward', 'salary', 'facility_cost', 'trainer_hire', 'item_purchase', 'other'] 
          },
          amount: { type: 'number' },
          description: { type: 'string', minLength: 1 },
          relatedId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    },
    
    settings: {
      type: 'object',
      required: ['theme', 'autoSave'],
      properties: {
        theme: { type: 'string', enum: ['light', 'dark', 'retro'] },
        soundEnabled: { type: 'boolean' },
        musicEnabled: { type: 'boolean' },
        notificationsEnabled: { type: 'boolean' },
        autoSave: { type: 'boolean' },
        autoSaveInterval: { type: 'number', minimum: 1 },
        difficulty: { type: 'string', enum: ['easy', 'normal', 'hard'] },
        autoIntervention: { type: 'boolean' },
        autoHeal: { type: 'boolean' },
        autoTraining: { type: 'boolean' }
      }
    },
    
    statistics: {
      type: 'object',
      required: ['totalPlayTime', 'totalExpeditions', 'lastCalculated'],
      properties: {
        totalPlayTime: { type: 'number', minimum: 0 },
        totalExpeditions: { type: 'number', minimum: 0 },
        totalPokemonCaught: { type: 'number', minimum: 0 },
        totalMoneyEarned: { type: 'number', minimum: 0 },
        expeditionSuccessRate: { type: 'number', minimum: 0, maximum: 1 },
        captureSuccessRate: { type: 'number', minimum: 0, maximum: 1 },
        longestExpedition: { type: 'number', minimum: 0 },
        mostValuableCapture: { type: 'string' },
        bestDay: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            earnings: { type: 'number', minimum: 0 }
          }
        },
        bestPerformingTrainer: { type: 'string' },
        lastCalculated: { type: 'string', format: 'date-time' }
      }
    }
  }
}

// 統合セーブデータスキーマ
export const UNIFIED_SAVE_DATA_SCHEMA = {
  type: 'object',
  required: ['version', 'userId', 'gameData', 'dataIntegrity'],
  properties: {
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    userId: { type: 'string', minLength: 1 },
    createdAt: { type: 'string', format: 'date-time' },
    lastSaved: { type: 'string', format: 'date-time' },
    lastValidated: { type: 'string', format: 'date-time' },
    
    gameData: GAME_DATA_SCHEMA,
    
    staticDataVersion: { type: 'string' },
    staticDataChecksum: { type: 'string' },
    
    dataIntegrity: {
      type: 'object',
      required: ['isValid', 'lastCheck'],
      properties: {
        isValid: { type: 'boolean' },
        lastCheck: { type: 'string', format: 'date-time' },
        validationErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string', enum: ['warning', 'error', 'critical'] },
              message: { type: 'string' },
              location: { type: 'string' },
              autoFixable: { type: 'boolean' },
              suggestedFix: { type: 'string' }
            }
          }
        },
        autoRepairAttempts: { type: 'number', minimum: 0 }
      }
    },
    
    syncStatus: {
      type: 'object',
      required: ['cloudSyncEnabled', 'pendingChanges'],
      properties: {
        cloudSyncEnabled: { type: 'boolean' },
        lastCloudSync: { type: 'string', format: 'date-time' },
        pendingChanges: { type: 'number', minimum: 0 },
        conflictResolution: { 
          type: 'string', 
          enum: ['local_wins', 'cloud_wins', 'manual'] 
        }
      }
    },
    
    performance: {
      type: 'object',
      properties: {
        saveSize: { type: 'number', minimum: 0 },
        compressionRatio: { type: 'number', minimum: 0 },
        lastSaveTime: { type: 'number', minimum: 0 },
        averageSaveTime: { type: 'number', minimum: 0 }
      }
    }
  }
}

// 静的データスキーマ
export const STATIC_DATA_SCHEMA = {
  jobs: {
    type: 'object',
    patternProperties: {
      '^(ranger|breeder|researcher|battler|medic)$': {
        type: 'object',
        required: ['id', 'name', 'nameJa', 'baseSalary'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string', minLength: 1 },
          nameJa: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          baseSalary: { type: 'number', minimum: 0 },
          startingLevel: { type: 'number', minimum: 1 },
          levelMultiplier: { type: 'number', minimum: 0.1 },
          skillAffinities: {
            type: 'object',
            required: ['capture', 'exploration', 'battle', 'research', 'healing'],
            properties: {
              capture: { type: 'number', minimum: -2, maximum: 3 },
              exploration: { type: 'number', minimum: -2, maximum: 3 },
              battle: { type: 'number', minimum: -2, maximum: 3 },
              research: { type: 'number', minimum: -2, maximum: 3 },
              healing: { type: 'number', minimum: -2, maximum: 3 }
            }
          },
          hireCost: { type: 'number', minimum: 0 },
          minimumReputation: { type: 'number', minimum: 0 }
        }
      }
    }
  },
  
  locations: {
    type: 'object',
    patternProperties: {
      '^\\d+$': {
        type: 'object',
        required: ['id', 'name', 'nameJa', 'difficulty', 'environment'],
        properties: {
          id: { type: 'number', minimum: 1 },
          name: { type: 'string', minLength: 1 },
          nameJa: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          region: { type: 'string' },
          difficulty: { type: 'string', enum: ['easy', 'normal', 'hard', 'extreme'] },
          environment: { 
            type: 'string', 
            enum: ['forest', 'mountain', 'cave', 'water', 'urban', 'desert', 'grassland'] 
          },
          baseDuration: { type: 'number', minimum: 1 },
          dangerLevel: { type: 'number', minimum: 1, maximum: 10 },
          explorationReward: { type: 'number', minimum: 0 },
          pokemonEncounters: {
            type: 'array',
            items: {
              type: 'object',
              required: ['speciesId', 'rarity', 'encounterRate', 'levelRange'],
              properties: {
                speciesId: { type: 'number', minimum: 1 },
                rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'legendary'] },
                encounterRate: { type: 'number', minimum: 0, maximum: 1 },
                levelRange: {
                  type: 'array',
                  items: { type: 'number', minimum: 1 },
                  minItems: 2,
                  maxItems: 2
                }
              }
            }
          }
        }
      }
    }
  },
  
  pokemon: {
    type: 'object',
    patternProperties: {
      '^\\d+$': {
        type: 'object',
        required: ['id', 'name', 'nameJa', 'type1', 'baseStats'],
        properties: {
          id: { type: 'number', minimum: 1 },
          name: { type: 'string', minLength: 1 },
          nameJa: { type: 'string', minLength: 1 },
          type1: { type: 'string' },
          type2: { type: 'string' },
          category: { type: 'string' },
          baseStats: {
            type: 'object',
            required: ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'total'],
            properties: {
              hp: { type: 'number', minimum: 1 },
              attack: { type: 'number', minimum: 1 },
              defense: { type: 'number', minimum: 1 },
              specialAttack: { type: 'number', minimum: 1 },
              specialDefense: { type: 'number', minimum: 1 },
              speed: { type: 'number', minimum: 1 },
              total: { type: 'number', minimum: 1 }
            }
          },
          experienceGroup: { 
            type: 'string', 
            enum: ['slow', 'medium_slow', 'medium_fast', 'fast'] 
          },
          baseExperience: { type: 'number', minimum: 1 },
          catchRate: { type: 'number', minimum: 1, maximum: 255 },
          height: { type: 'number', minimum: 0 },
          weight: { type: 'number', minimum: 0 },
          rarity: { 
            type: 'string', 
            enum: ['common', 'uncommon', 'rare', 'legendary', 'mythical'] 
          },
          marketValue: { type: 'number', minimum: 0 },
          researchValue: { type: 'number', minimum: 0 }
        }
      }
    }
  }
}

// スキーマバリデーション関数
export const validateGameData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  try {
    // 基本的なバリデーション
    if (!data || typeof data !== 'object') {
      errors.push('データが無効です')
      return { isValid: false, errors }
    }
    
    // 必須フィールドチェック
    const requiredFields = ['version', 'userId', 'player', 'trainers', 'pokemon']
    for (const field of requiredFields) {
      if (!(field in data)) {
        errors.push(`必須フィールド '${field}' が不足しています`)
      }
    }
    
    // バージョンチェック
    if (data.version && !/^\d+\.\d+\.\d+$/.test(data.version)) {
      errors.push('バージョン形式が無効です')
    }
    
    // プレイヤーデータチェック
    if (data.player) {
      if (!data.player.name || typeof data.player.name !== 'string') {
        errors.push('プレイヤー名が無効です')
      }
      if (typeof data.player.money !== 'number' || data.player.money < 0) {
        errors.push('所持金が無効です')
      }
    }
    
    // 配列データチェック
    const arrayFields = ['trainers', 'pokemon', 'expeditions', 'facilities', 'transactions']
    for (const field of arrayFields) {
      if (data[field] && !Array.isArray(data[field])) {
        errors.push(`${field} は配列である必要があります`)
      }
    }
    
  } catch (error) {
    errors.push(`バリデーションエラー: ${error}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// データ正規化関数
export const normalizeGameData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return null
  }
  
  // デフォルト値設定
  const normalized = {
    version: data.version || '1.0.0',
    userId: data.userId || 'guest',
    lastSaved: data.lastSaved || new Date().toISOString(),
    createdAt: data.createdAt || new Date().toISOString(),
    
    player: {
      name: data.player?.name || 'プレイヤー',
      schoolName: data.player?.schoolName || 'トキワシティ訓練所',
      money: Math.max(0, data.player?.money || 50000),
      reputation: Math.max(0, data.player?.reputation || 0),
      level: Math.max(1, data.player?.level || 1),
      experience: Math.max(0, data.player?.experience || 0),
      nextLevelExp: Math.max(0, data.player?.nextLevelExp || 1000)
    },
    
    trainers: Array.isArray(data.trainers) ? data.trainers : [],
    pokemon: Array.isArray(data.pokemon) ? data.pokemon : [],
    expeditions: Array.isArray(data.expeditions) ? data.expeditions : [],
    facilities: Array.isArray(data.facilities) ? data.facilities : [],
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    
    settings: {
      theme: data.settings?.theme || 'retro',
      soundEnabled: data.settings?.soundEnabled !== false,
      musicEnabled: data.settings?.musicEnabled !== false,
      notificationsEnabled: data.settings?.notificationsEnabled !== false,
      autoSave: data.settings?.autoSave !== false,
      autoSaveInterval: Math.max(1, data.settings?.autoSaveInterval || 5),
      difficulty: data.settings?.difficulty || 'normal',
      autoIntervention: data.settings?.autoIntervention === true,
      autoHeal: data.settings?.autoHeal !== false,
      autoTraining: data.settings?.autoTraining === true
    },
    
    statistics: {
      totalPlayTime: Math.max(0, data.statistics?.totalPlayTime || 0),
      totalExpeditions: Math.max(0, data.statistics?.totalExpeditions || 0),
      totalPokemonCaught: Math.max(0, data.statistics?.totalPokemonCaught || 0),
      totalMoneyEarned: Math.max(0, data.statistics?.totalMoneyEarned || 0),
      expeditionSuccessRate: Math.max(0, Math.min(1, data.statistics?.expeditionSuccessRate || 0)),
      captureSuccessRate: Math.max(0, Math.min(1, data.statistics?.captureSuccessRate || 0)),
      longestExpedition: Math.max(0, data.statistics?.longestExpedition || 0),
      mostValuableCapture: data.statistics?.mostValuableCapture || '',
      bestDay: {
        date: data.statistics?.bestDay?.date || '',
        earnings: Math.max(0, data.statistics?.bestDay?.earnings || 0)
      },
      bestPerformingTrainer: data.statistics?.bestPerformingTrainer || '',
      lastCalculated: data.statistics?.lastCalculated || new Date().toISOString()
    }
  }
  
  return normalized
}

// データマイグレーション定義
export const DATA_MIGRATIONS = {
  '1.0.0': {
    description: 'Initial version',
    migrate: (data: any) => data
  },
  '1.0.1': {
    description: 'Add facility system',
    migrate: (data: any) => {
      if (!data.facilities) {
        data.facilities = []
      }
      return data
    }
  },
  '1.1.0': {
    description: 'Enhanced trainer system',
    migrate: (data: any) => {
      if (data.trainers) {
        data.trainers.forEach((trainer: any) => {
          if (!trainer.trustLevel) {
            trainer.trustLevel = 50
          }
          if (!trainer.favoriteLocations) {
            trainer.favoriteLocations = []
          }
        })
      }
      return data
    }
  }
}

// 現在のスキーマバージョン
export const CURRENT_SCHEMA_VERSION = '1.1.0'

// スキーママイグレーション実行
export const migrateData = (data: any, targetVersion: string = CURRENT_SCHEMA_VERSION): any => {
  const currentVersion = data.version || '1.0.0'
  
  if (currentVersion === targetVersion) {
    return data
  }
  
  let migratedData = { ...data }
  const versions = Object.keys(DATA_MIGRATIONS).sort()
  
  for (const version of versions) {
    if (version > currentVersion && version <= targetVersion) {
      const migration = DATA_MIGRATIONS[version as keyof typeof DATA_MIGRATIONS]
      migratedData = migration.migrate(migratedData)
      migratedData.version = version
      console.log(`📈 データマイグレーション: ${version} - ${migration.description}`)
    }
  }
  
  return migratedData
}