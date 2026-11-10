/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'title' | 'playing' | 'paused';

export type CurrencyType = 'gold' | 'diamonds' | 'silver' | 'rareTokens' | 'gems';

export interface Wallet {
  gold: number;
  diamonds: number;
  silver: number;
  rareTokens: number;
  gems: number;
}

export interface Transaction {
  id: string;
  timestamp: number;
  currency: CurrencyType;
  amount: number;
  type: 'earn' | 'spend';
  balanceAfter: number;
  category: 'quest' | 'shop' | 'crafting' | 'trade' | 'bounty' | 'exploration' | 'daily';
  description: string;
}

export type ItemRarity = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'ancient'
  | 'divine';

export type ItemCategory = 
  | 'weapon'
  | 'armor'
  | 'equipment'
  | 'potion'
  | 'food'
  | 'rare'
  | 'magic'
  | 'vehicle';

export type EquipSlot = 
  | 'mainHand'
  | 'offHand'
  | 'head'
  | 'chest'
  | 'hands'
  | 'legs'
  | 'ring1'
  | 'ring2'
  | 'amulet'
  | 'vehicle';

export interface ItemStats {
  attack?: number;
  defense?: number;
  magicPower?: number;
  magicResist?: number;
  speed?: number;
  healthBonus?: number;
  manaBonus?: number;
  staminaBonus?: number;
  critChance?: number;
}

export interface ItemEffects {
  restoreHp?: number;
  restoreMp?: number;
  restoreStamina?: number;
  restoreHunger?: number;
  restoreThirst?: number;
  cureDebuffs?: boolean;
  buffDurationSec?: number;
  buffType?: string;
}

export interface GameItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  equipSlot?: EquipSlot;
  levelReq: number;
  stackable: boolean;
  maxStack?: number;
  weight: number;
  durability: number;
  maxDurability: number;
  basePrice: number;
  currency: CurrencyType;
  stats?: ItemStats;
  effects?: ItemEffects;
  upgradeLevel?: number;
  sockets?: { gemId: string | null }[];
  icon: string;
  lore?: string;
  setPiece?: string;
}

export interface InventorySlot {
  item: GameItem;
  quantity: number;
}

export interface EquipmentLoadout {
  mainHand: GameItem | null;
  offHand: GameItem | null;
  head: GameItem | null;
  chest: GameItem | null;
  hands: GameItem | null;
  legs: GameItem | null;
  ring1: GameItem | null;
  ring2: GameItem | null;
  amulet: GameItem | null;
  vehicle: GameItem | null;
}

export interface PlayerAttributes {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  statPoints: number;
  attributes: PlayerAttributes;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  hunger: number; // 0 - 100
  thirst: number; // 0 - 100
  baseDefense: number;
  baseAttack: number;
  reputation: Record<string, number>; // FactionId -> reputation score (-100 to +100)
}

export type NpcProfession = 
  | 'Farmer'
  | 'Miner'
  | 'Blacksmith'
  | 'Doctor'
  | 'Guard'
  | 'Merchant'
  | 'Scholar'
  | 'Citizen'
  | 'Child'
  | 'Leader'
  | 'Explorer'
  | 'Engineer';

export type FactionId = 
  | 'citadel_order'
  | 'free_merchants'
  | 'frontier_pioneers'
  | 'shadow_syndicate'
  | 'scholars_enclave';

export interface NpcFamily {
  spouseName?: string;
  childrenNames?: string[];
  parentsNames?: string[];
  homeDistrict: string;
}

export interface NpcSchedule {
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
}

export interface LivingNpc {
  id: string;
  name: string;
  gender: 'male' | 'female';
  profession: NpcProfession;
  faction: FactionId;
  district: string;
  personality: string;
  dialogueGreeting: string;
  currentTask: string;
  family: NpcFamily;
  schedule: NpcSchedule;
  trustWithPlayer: number; // -100 to 100
  shopId?: string; // If this NPC runs a shop
  walletGold: number;
  x: number;
  z: number;
  patrolRadius: number;
}

export type GraphicsPreset = 'batterySaver' | 'low' | 'balanced' | 'high' | 'ultra';

export interface PerformanceSettings {
  preset: GraphicsPreset;
  fpsCap: number; // 30, 45, 60, 0 (unlocked)
  resolutionScale: number; // 0.75, 1.0, 1.25, 1.5
  shadowQuality: 'off' | 'simple' | 'pcf' | 'pcfSoft';
  viewDistance: number; // in meters: 80, 140, 220, 340, 500
  npcDensity: number; // 0.4, 0.7, 1.0, 1.5
  instancedFoliage: boolean;
  effectsQuality: 'low' | 'medium' | 'high' | 'ultra';
  dynamicWeather: boolean;
  soundVolume: number;
  soundMuted: boolean;
  touchControlsVisible: boolean;
  showTelemetry: boolean;
}

export interface TelemetryData {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  activeNpcs: number;
  culledNpcs: number;
  activeChunks: number;
  memoryMb: number;
  playerPos: { x: number; y: number; z: number };
}

export interface ShopDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  keeperName: string;
  district: string;
  description: string;
  currencyAccepted: CurrencyType;
  items: { itemId: string; stock: number; priceMultiplier?: number }[];
  buybackMultiplier: number;
}

export type WorldDifficulty = 'peaceful' | 'standard' | 'hardcore';

export interface WorldSettings {
  difficulty: WorldDifficulty;
  biomeSeed: string;
  dayNightSpeed: 'slow' | 'standard' | 'fast';
  economyScale: 'abundant' | 'balanced' | 'scarce';
  hostileSpawns: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'main' | 'faction' | 'bounty';
  giverNpcName: string;
  objectiveText: string;
  targetCount: number;
  currentCount: number;
  status: 'available' | 'active' | 'completed';
  rewards: {
    xp: number;
    gold: number;
    rareTokens?: number;
    diamonds?: number;
    itemRewardId?: string;
  };
}

export interface GameWorld {
  id: string;
  name: string;
  createdAt: number;
  lastPlayed: number;
  playtimeSeconds: number;
  settings: WorldSettings;
  playerStats: PlayerStats;
  wallet: Wallet;
  inventory: InventorySlot[];
  equipment: EquipmentLoadout;
  quests: Quest[];
  playerPos?: { x: number; y: number; z: number };
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // SHA-256 simulation
  avatarColor: string;
  createdAt: number;
  lastLogin: number;
  cloudSyncKey: string;
  worlds: GameWorld[];
}

export interface CombatState {
  comboStep: number; // 0, 1, 2 (3-hit combo)
  isBlocking: boolean;
  isDodging: boolean;
  dodgeCooldown: number;
  skills: {
    whirlwind: { cooldown: number; maxCooldown: number; manaCost: number };
    nova: { cooldown: number; maxCooldown: number; manaCost: number };
    heal: { cooldown: number; maxCooldown: number; manaCost: number };
  };
}

