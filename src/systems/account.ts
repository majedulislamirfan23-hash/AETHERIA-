/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserAccount, GameWorld, WorldSettings, PlayerStats, Wallet, InventorySlot, EquipmentLoadout } from '../types/game';
import { ITEMS_DATABASE } from '../data/items';
import { INITIAL_QUESTS } from '../data/quests';

const ACCOUNTS_STORAGE_KEY = 'aetheria_user_accounts_v2';
const ACTIVE_SESSION_KEY = 'aetheria_active_user_session_v2';
const GUEST_WORLDS_KEY = 'aetheria_guest_worlds_v2';

export const DEFAULT_STARTING_STATS: PlayerStats = {
  level: 1,
  xp: 0,
  xpToNext: 200,
  statPoints: 5,
  attributes: {
    strength: 10,
    agility: 10,
    intelligence: 10,
    vitality: 10,
  },
  health: 150,
  maxHealth: 150,
  mana: 80,
  maxMana: 80,
  stamina: 100,
  maxStamina: 100,
  hunger: 100,
  thirst: 100,
  baseDefense: 15,
  baseAttack: 22,
  reputation: {
    citadel_order: 15,
    free_merchants: 20,
    frontier_pioneers: 10,
    shadow_syndicate: 0,
    scholars_enclave: 5,
  },
};

export const DEFAULT_STARTING_WALLET: Wallet = {
  gold: 650,
  diamonds: 25,
  silver: 420,
  rareTokens: 12,
  gems: 35,
};

export const createDefaultWorld = (name = 'Aetheria Prime', settings?: Partial<WorldSettings>): GameWorld => {
  const worldSettings: WorldSettings = {
    difficulty: 'standard',
    biomeSeed: 'solar-aetheria-99',
    dayNightSpeed: 'standard',
    economyScale: 'balanced',
    hostileSpawns: true,
    ...settings,
  };

  return {
    id: `world_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    createdAt: Date.now(),
    lastPlayed: Date.now(),
    playtimeSeconds: 0,
    settings: worldSettings,
    playerStats: { ...DEFAULT_STARTING_STATS },
    wallet: { ...DEFAULT_STARTING_WALLET },
    inventory: [
      { item: ITEMS_DATABASE['p_health_minor'], quantity: 5 },
      { item: ITEMS_DATABASE['p_stamina_tonic'], quantity: 3 },
      { item: ITEMS_DATABASE['f_hearth_bread'], quantity: 4 },
      { item: ITEMS_DATABASE['f_spring_water'], quantity: 4 },
      { item: ITEMS_DATABASE['w_shadow_daggers'], quantity: 1 },
      { item: ITEMS_DATABASE['eq_mining_pick'], quantity: 1 },
      { item: ITEMS_DATABASE['m_ruby_gem'], quantity: 2 },
    ],
    equipment: {
      mainHand: ITEMS_DATABASE['w_iron_sword'] || null,
      offHand: null,
      head: ITEMS_DATABASE['a_iron_helm'] || null,
      chest: ITEMS_DATABASE['a_iron_chest'] || null,
      hands: null,
      legs: ITEMS_DATABASE['a_iron_greaves'] || null,
      ring1: null,
      ring2: null,
      amulet: null,
      vehicle: null,
    },
    quests: [...INITIAL_QUESTS],
    playerPos: { x: 0, y: 0.5, z: 5 },
  };
};

export class AccountManager {
  private accounts: UserAccount[] = [];
  private activeUser: UserAccount | null = null;
  private guestWorlds: GameWorld[] = [];

  constructor() {
    this.loadAccounts();
    this.loadSession();
    this.loadGuestWorlds();
  }

  private loadAccounts() {
    try {
      const data = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (data) {
        this.accounts = JSON.parse(data);
      }
    } catch {
      this.accounts = [];
    }
  }

  private saveAccounts() {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(this.accounts));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  private loadSession() {
    try {
      const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (activeId) {
        const found = this.accounts.find((a) => a.id === activeId);
        if (found) {
          this.activeUser = found;
        }
      }
    } catch {
      this.activeUser = null;
    }
  }

  private loadGuestWorlds() {
    try {
      const data = localStorage.getItem(GUEST_WORLDS_KEY);
      if (data) {
        this.guestWorlds = JSON.parse(data);
      } else {
        // Initialize with default world
        const def = createDefaultWorld('Aetheria Prime');
        this.guestWorlds = [def];
        this.saveGuestWorlds();
      }
    } catch {
      this.guestWorlds = [createDefaultWorld('Aetheria Prime')];
    }
  }

  private saveGuestWorlds() {
    try {
      localStorage.setItem(GUEST_WORLDS_KEY, JSON.stringify(this.guestWorlds));
    } catch (e) {
      console.warn('Failed saving guest worlds:', e);
    }
  }

  public getActiveUser(): UserAccount | null {
    return this.activeUser;
  }

  public signUp(username: string, email: string, password: string, avatarColor = '#38bdf8'): { success: boolean; error?: string } {
    if (!username.trim() || !email.trim() || !password.trim()) {
      return { success: false, error: 'All fields are required.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    if (this.accounts.some((a) => a.email === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Simple robust hash simulation
    const passwordHash = btoa(`salt_${password}_omega`);
    const newAccount: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: username.trim(),
      email: cleanEmail,
      passwordHash,
      avatarColor,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      cloudSyncKey: `cloud_key_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      worlds: this.guestWorlds.length > 0 ? [...this.guestWorlds] : [createDefaultWorld(`${username.trim()}'s Realm`)],
    };

    this.accounts.push(newAccount);
    this.saveAccounts();
    this.login(cleanEmail, password);
    return { success: true };
  }

  public login(email: string, password: string): { success: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = btoa(`salt_${password}_omega`);
    const user = this.accounts.find((a) => a.email === cleanEmail && a.passwordHash === passwordHash);

    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    user.lastLogin = Date.now();
    this.activeUser = user;
    this.saveAccounts();
    localStorage.setItem(ACTIVE_SESSION_KEY, user.id);
    return { success: true };
  }

  public logout() {
    this.activeUser = null;
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }

  public getWorlds(): GameWorld[] {
    if (this.activeUser) {
      return this.activeUser.worlds;
    }
    return this.guestWorlds;
  }

  public addWorld(world: GameWorld): GameWorld {
    if (this.activeUser) {
      this.activeUser.worlds.unshift(world);
      this.saveAccounts();
    } else {
      this.guestWorlds.unshift(world);
      this.saveGuestWorlds();
    }
    return world;
  }

  public updateWorld(updatedWorld: GameWorld) {
    if (this.activeUser) {
      this.activeUser.worlds = this.activeUser.worlds.map((w) =>
        w.id === updatedWorld.id ? { ...updatedWorld, lastPlayed: Date.now() } : w
      );
      this.saveAccounts();
    } else {
      this.guestWorlds = this.guestWorlds.map((w) =>
        w.id === updatedWorld.id ? { ...updatedWorld, lastPlayed: Date.now() } : w
      );
      this.saveGuestWorlds();
    }
  }

  public deleteWorld(worldId: string): boolean {
    if (this.activeUser) {
      if (this.activeUser.worlds.length <= 1) return false;
      this.activeUser.worlds = this.activeUser.worlds.filter((w) => w.id !== worldId);
      this.saveAccounts();
      return true;
    } else {
      if (this.guestWorlds.length <= 1) return false;
      this.guestWorlds = this.guestWorlds.filter((w) => w.id !== worldId);
      this.saveGuestWorlds();
      return true;
    }
  }

  public triggerCloudSync(): { success: boolean; timestamp: number; syncToken: string } {
    const timestamp = Date.now();
    if (this.activeUser) {
      this.activeUser.cloudSyncKey = `sync_${timestamp}_${this.activeUser.id}`;
      this.saveAccounts();
      return { success: true, timestamp, syncToken: this.activeUser.cloudSyncKey };
    }
    return { success: true, timestamp, syncToken: `guest_sync_${timestamp}` };
  }
}

export const accountManager = new AccountManager();
