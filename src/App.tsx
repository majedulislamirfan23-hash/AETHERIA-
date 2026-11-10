/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, 
  GraphicsPreset, 
  PerformanceSettings, 
  Wallet, 
  InventorySlot, 
  EquipmentLoadout, 
  PlayerStats, 
  PlayerAttributes, 
  EquipSlot, 
  GameItem, 
  CurrencyType, 
  LivingNpc, 
  ShopDefinition, 
  TelemetryData, 
  GameWorld, 
  UserAccount, 
  Quest, 
  WorldSettings 
} from './types/game';
import { ITEMS_DATABASE, INITIAL_SHOPS } from './data/items';
import { INITIAL_CITIZENS } from './data/civilization';
import { INITIAL_QUESTS } from './data/quests';
import { GameScene } from './engine/GameScene';
import { EconomyManager } from './systems/economy';
import { soundEngine } from './systems/audio';
import { accountManager, createDefaultWorld } from './systems/account';

import { WorldSelectModal } from './components/WorldSelectModal';
import { AuthModal } from './components/AuthModal';
import { GameHud } from './components/GameHud';
import { InventoryModal } from './components/InventoryModal';
import { ShopModal } from './components/ShopModal';
import { CivilizationModal } from './components/CivilizationModal';
import { CraftingModal } from './components/CraftingModal';
import { CharacterModal } from './components/CharacterModal';
import { SettingsModal } from './components/SettingsModal';
import { DialogueModal } from './components/DialogueModal';
import { QuestsModal } from './components/QuestsModal';
import { TelemetryOverlay } from './components/TelemetryOverlay';

const DEFAULT_SETTINGS: PerformanceSettings = {
  preset: 'balanced',
  fpsCap: 60,
  resolutionScale: 1.0,
  shadowQuality: 'pcf',
  viewDistance: 220,
  npcDensity: 1.0,
  instancedFoliage: true,
  effectsQuality: 'medium',
  dynamicWeather: true,
  soundVolume: 0.7,
  soundMuted: false,
  touchControlsVisible: false,
  showTelemetry: true,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const gameSceneRef = useRef<GameScene | null>(null);
  const economyRef = useRef<EconomyManager>(new EconomyManager());

  // Account & World Management
  const [activeUser, setActiveUser] = useState<UserAccount | null>(accountManager.getActiveUser());
  const [worlds, setWorlds] = useState<GameWorld[]>(accountManager.getWorlds());
  const [currentWorld, setCurrentWorld] = useState<GameWorld | null>(null);

  // Game UI State
  const [gameState, setGameState] = useState<'world_select' | 'playing'>('world_select');
  const [activeModal, setActiveModal] = useState<
    'none' | 'auth' | 'inventory' | 'character' | 'shop' | 'civilization' | 'crafting' | 'settings' | 'dialogue' | 'quests'
  >('none');
  const [activeShop, setActiveShop] = useState<ShopDefinition | null>(null);

  // Settings & Telemetry
  const [settings, setSettings] = useState<PerformanceSettings>(DEFAULT_SETTINGS);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 32,
    triangles: 18500,
    activeNpcs: 10,
    culledNpcs: 0,
    activeChunks: 9,
    memoryMb: 85,
    playerPos: { x: 0, y: 1, z: 5 },
  });

  // Player & World Systems State
  const [wallet, setWallet] = useState<Wallet>(economyRef.current.getWallet());
  const [playerStats, setPlayerStats] = useState<PlayerStats>(
    worlds[0]?.playerStats || createDefaultWorld().playerStats
  );
  const [equipment, setEquipment] = useState<EquipmentLoadout>(
    worlds[0]?.equipment || createDefaultWorld().equipment
  );
  const [inventory, setInventory] = useState<InventorySlot[]>(
    worlds[0]?.inventory || createDefaultWorld().inventory
  );
  const [quests, setQuests] = useState<Quest[]>(
    worlds[0]?.quests || createDefaultWorld().quests
  );

  const [hotbarSlots, setHotbarSlots] = useState<(InventorySlot | null)[]>([
    { item: ITEMS_DATABASE['p_health_minor'], quantity: 5 },
    { item: ITEMS_DATABASE['p_stamina_tonic'], quantity: 3 },
    { item: ITEMS_DATABASE['f_hearth_bread'], quantity: 4 },
    { item: ITEMS_DATABASE['f_spring_water'], quantity: 4 },
    null,
    null,
  ]);

  const [citizens, setCitizens] = useState<LivingNpc[]>(INITIAL_CITIZENS);
  const [nearestNpc, setNearestNpc] = useState<LivingNpc | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [comboStep, setComboStep] = useState(0);
  const [isBlocking, setIsBlocking] = useState(false);

  // Auto-enable touch controls on mobile devices
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setSettings((prev) => ({ ...prev, touchControlsVisible: true }));
    }
  }, []);

  // Sync wallet listener
  useEffect(() => {
    const unsub = economyRef.current.onWalletChange((w) => setWallet(w));
    return unsub;
  }, []);

  // 1. Initialize 3D Engine once inside canvas container
  useEffect(() => {
    if (!canvasMountRef.current) return;
    if (!gameSceneRef.current) {
      const scene = new GameScene(canvasMountRef.current, settings);
      gameSceneRef.current = scene;

      scene.onTelemetryUpdate = (data) => setTelemetry(data);
      scene.onInteractableNpcChange = (npc) => setNearestNpc(npc);

      // Attack hit callback: updates combo quest progress
      scene.onPlayerAttackHit = (targetName, damage, isComboFinisher) => {
        setComboStep(scene.comboStep);

        // Progress combat trial quest
        setQuests((prev) =>
          prev.map((q) => {
            if (q.id === 'q_combat_trial' && q.status !== 'completed') {
              const nextCount = Math.min(q.targetCount, q.currentCount + (isComboFinisher ? 2 : 1));
              return { ...q, currentCount: nextCount };
            }
            return q;
          })
        );
      };
    }

    return () => {
      if (gameSceneRef.current) {
        gameSceneRef.current.dispose();
        gameSceneRef.current = null;
      }
    };
  }, []);

  // 2. Auto-save current world progress every 20 seconds
  useEffect(() => {
    if (gameState !== 'playing' || !currentWorld) return;

    const autoSave = setInterval(() => {
      saveActiveWorld();
    }, 20000);

    return () => clearInterval(autoSave);
  }, [gameState, currentWorld, wallet, playerStats, equipment, inventory, quests]);

  const saveActiveWorld = () => {
    if (!currentWorld) return;
    const updated: GameWorld = {
      ...currentWorld,
      lastPlayed: Date.now(),
      wallet: economyRef.current.getWallet(),
      playerStats,
      equipment,
      inventory,
      quests,
      playerPos: gameSceneRef.current
        ? {
            x: gameSceneRef.current.playerPosition.x,
            y: gameSceneRef.current.playerPosition.y,
            z: gameSceneRef.current.playerPosition.z,
          }
        : currentWorld.playerPos,
    };
    accountManager.updateWorld(updated);
    setWorlds(accountManager.getWorlds());
  };

  // 3. Survival drain loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setPlayerStats((prev) => {
        const difficulty = currentWorld?.settings.difficulty || 'standard';
        if (difficulty === 'peaceful') return prev;

        const hungerDrain = difficulty === 'hardcore' ? 0.6 : 0.3;
        const thirstDrain = difficulty === 'hardcore' ? 0.8 : 0.45;

        const newHunger = Math.max(0, prev.hunger - hungerDrain);
        const newThirst = Math.max(0, prev.thirst - thirstDrain);

        let hpDelta = 0;
        if (newHunger <= 0 || newThirst <= 0) {
          hpDelta = difficulty === 'hardcore' ? -2.5 : -1.2;
        } else if (newHunger > 65 && newThirst > 65 && prev.health < prev.maxHealth) {
          hpDelta = 0.8;
        }

        const newHp = Math.min(prev.maxHealth, Math.max(1, prev.health + hpDelta));
        return {
          ...prev,
          hunger: newHunger,
          thirst: newThirst,
          health: newHp,
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [gameState, currentWorld]);

  // Handle World Entry
  const handleEnterWorld = (world: GameWorld) => {
    setCurrentWorld(world);
    economyRef.current.loadState(world.wallet);
    setWallet(world.wallet);
    setPlayerStats(world.playerStats);
    setEquipment(world.equipment);
    setInventory(world.inventory);
    setQuests(world.quests || INITIAL_QUESTS);

    if (gameSceneRef.current && world.playerPos) {
      gameSceneRef.current.playerPosition.set(
        world.playerPos.x,
        world.playerPos.y,
        world.playerPos.z
      );
    }

    setGameState('playing');
    setActiveModal('none');
  };

  // Handle Create World
  const handleCreateWorld = (name: string, worldSettings: WorldSettings) => {
    const newWorld = createDefaultWorld(name, worldSettings);
    accountManager.addWorld(newWorld);
    setWorlds(accountManager.getWorlds());
    handleEnterWorld(newWorld);
  };

  const handleDeleteWorld = (worldId: string) => {
    accountManager.deleteWorld(worldId);
    setWorlds(accountManager.getWorlds());
  };

  // Keyboard shortcut routing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.code === 'KeyE') {
        if (activeModal === 'none' && nearestNpc) {
          soundEngine.playUiClick();
          setActiveModal('dialogue');
        } else if (activeModal === 'dialogue') {
          setActiveModal('none');
        }
      } else if (e.code === 'Tab') {
        e.preventDefault();
        soundEngine.playUiClick();
        setActiveModal((prev) => (prev === 'inventory' ? 'none' : 'inventory'));
      } else if (e.code === 'KeyC') {
        soundEngine.playUiClick();
        setActiveModal((prev) => (prev === 'character' ? 'none' : 'character'));
      } else if (e.code === 'KeyM') {
        soundEngine.playUiClick();
        setActiveModal((prev) => (prev === 'quests' ? 'none' : 'quests'));
      } else if (e.code === 'Escape') {
        soundEngine.playUiClick();
        setActiveModal((prev) => (prev === 'settings' ? 'none' : 'settings'));
      } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code) && !e.ctrlKey) {
        const slotIdx = parseInt(e.code.replace('Digit', '')) - 1;
        handleUseHotbarSlot(slotIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeModal, nearestNpc]);

  // Handle Item Consumption
  const handleUseItem = useCallback((item: GameItem) => {
    if (!item.effects) return;

    soundEngine.playPotionDrink();

    setPlayerStats((prev) => ({
      ...prev,
      health: Math.min(prev.maxHealth, prev.health + (item.effects?.restoreHp || 0)),
      mana: Math.min(prev.maxMana, prev.mana + (item.effects?.restoreMp || 0)),
      stamina: Math.min(prev.maxStamina, prev.stamina + (item.effects?.restoreStamina || 0)),
      hunger: Math.min(100, prev.hunger + (item.effects?.restoreHunger || 0)),
      thirst: Math.min(100, prev.thirst + (item.effects?.restoreThirst || 0)),
    }));

    setInventory((prev) => {
      const idx = prev.findIndex((s) => s.item.id === item.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      if (copy[idx].quantity > 1) {
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity - 1 };
      } else {
        copy.splice(idx, 1);
      }
      return copy;
    });

    setHotbarSlots((prev) =>
      prev.map((slot) => {
        if (slot && slot.item.id === item.id) {
          return slot.quantity > 1 ? { ...slot, quantity: slot.quantity - 1 } : null;
        }
        return slot;
      })
    );
  }, []);

  const handleUseHotbarSlot = (index: number) => {
    const slot = hotbarSlots[index];
    if (slot && slot.item.effects) {
      handleUseItem(slot.item);
    }
  };

  // Equip / Unequip handlers
  const handleEquipItem = (item: GameItem) => {
    if (!item.equipSlot) return;
    const targetSlot = item.equipSlot;
    const previouslyEquipped = equipment[targetSlot];

    setInventory((prev) => {
      const idx = prev.findIndex((s) => s.item.id === item.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      if (copy[idx].quantity > 1) {
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity - 1 };
      } else {
        copy.splice(idx, 1);
      }
      if (previouslyEquipped) {
        copy.push({ item: previouslyEquipped, quantity: 1 });
      }
      return copy;
    });

    setEquipment((prev) => ({
      ...prev,
      [targetSlot]: item,
    }));
    soundEngine.playLevelUp();
  };

  const handleUnequipSlot = (slot: EquipSlot) => {
    const current = equipment[slot];
    if (!current) return;

    setEquipment((prev) => ({
      ...prev,
      [slot]: null,
    }));

    setInventory((prev) => [...prev, { item: current, quantity: 1 }]);
    soundEngine.playUiClick();
  };

  const handleDropItem = (item: GameItem, quantity: number) => {
    setInventory((prev) => {
      const idx = prev.findIndex((s) => s.item.id === item.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      if (copy[idx].quantity > quantity) {
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity - quantity };
      } else {
        copy.splice(idx, 1);
      }
      return copy;
    });
  };

  const handleAssignHotbar = (item: GameItem, slotIndex: number) => {
    setHotbarSlots((prev) => {
      const copy = [...prev];
      copy[slotIndex] = { item, quantity: 1 };
      return copy;
    });
  };

  // Economy: Shop Buy
  const handleBuyShopItem = (item: GameItem, qty: number, totalCost: number, currency: CurrencyType) => {
    const spent = economyRef.current.spend(currency, totalCost, 'shop', `Purchased ${qty}x ${item.name}`);
    if (!spent) return false;

    setInventory((prev) => {
      const idx = prev.findIndex((s) => s.item.id === item.id);
      if (idx !== -1 && item.stackable) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }
      return [...prev, { item: { ...item }, quantity: qty }];
    });
    return true;
  };

  // Economy: Shop Sell
  const handleSellShopItem = (item: GameItem, qty: number, payout: number, currency: CurrencyType) => {
    economyRef.current.earn(currency, payout, 'shop', `Sold ${qty}x ${item.name}`);

    setInventory((prev) => {
      const idx = prev.findIndex((s) => s.item.id === item.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      if (copy[idx].quantity > qty) {
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity - qty };
      } else {
        copy.splice(idx, 1);
      }
      return copy;
    });

    // Update merchant baron quest progress
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'q_merchant_baron') {
          return { ...q, currentCount: economyRef.current.getWallet().gold };
        }
        return q;
      })
    );
  };

  // Forge Upgrade
  const handleUpgradeItem = (item: GameItem, goldCost: number, gemsCost: number) => {
    if (!economyRef.current.hasSufficient('gold', goldCost) || !economyRef.current.hasSufficient('gems', gemsCost)) {
      return false;
    }

    economyRef.current.spend('gold', goldCost, 'crafting', `Forged enhancement for ${item.name}`);
    if (gemsCost > 0) {
      economyRef.current.spend('gems', gemsCost, 'crafting', `Socketed arcane gems on ${item.name}`);
    }

    const nextLvl = (item.upgradeLevel || 0) + 1;

    setInventory((prev) =>
      prev.map((slot) => {
        if (slot.item.id === item.id) {
          const upgradedItem: GameItem = {
            ...slot.item,
            upgradeLevel: nextLvl,
            stats: {
              ...slot.item.stats,
              attack: slot.item.stats?.attack ? Math.round(slot.item.stats.attack * 1.15 + 4) : undefined,
              defense: slot.item.stats?.defense ? Math.round(slot.item.stats.defense * 1.15 + 3) : undefined,
              magicPower: slot.item.stats?.magicPower ? Math.round(slot.item.stats.magicPower * 1.15 + 5) : undefined,
            },
          };
          return { ...slot, item: upgradedItem };
        }
        return slot;
      })
    );

    // Progress Arcane Study Quest
    setQuests((prev) =>
      prev.map((q) => (q.id === 'q_arcane_study' ? { ...q, currentCount: 1 } : q))
    );

    return true;
  };

  // Allocate Character Stat
  const handleAllocateStat = (attribute: keyof PlayerAttributes) => {
    if (playerStats.statPoints <= 0) return;
    setPlayerStats((prev) => ({
      ...prev,
      statPoints: prev.statPoints - 1,
      attributes: {
        ...prev.attributes,
        [attribute]: prev.attributes[attribute] + 1,
      },
      maxHealth: attribute === 'vitality' ? prev.maxHealth + 15 : prev.maxHealth,
      health: attribute === 'vitality' ? prev.health + 15 : prev.health,
      maxMana: attribute === 'intelligence' ? prev.maxMana + 12 : prev.maxMana,
      mana: attribute === 'intelligence' ? prev.mana + 12 : prev.mana,
      maxStamina: attribute === 'agility' ? prev.maxStamina + 10 : prev.maxStamina,
    }));
  };

  // Special Skills Callbacks
  const handleSkillWhirlwind = () => {
    if (playerStats.mana < 25) return;
    setPlayerStats((prev) => ({ ...prev, mana: prev.mana - 25 }));
    if (gameSceneRef.current) gameSceneRef.current.triggerSkillWhirlwind();
  };

  const handleSkillNova = () => {
    if (playerStats.mana < 35) return;
    setPlayerStats((prev) => ({ ...prev, mana: prev.mana - 35 }));
    if (gameSceneRef.current) gameSceneRef.current.triggerSkillNova();
  };

  const handleSkillHeal = () => {
    if (playerStats.mana < 30) return;
    setPlayerStats((prev) => ({
      ...prev,
      mana: prev.mana - 30,
      health: Math.min(prev.maxHealth, prev.health + 65),
      stamina: Math.min(prev.maxStamina, prev.stamina + 40),
    }));
    if (gameSceneRef.current) gameSceneRef.current.triggerSkillHeal();
  };

  // Quests Reward Claiming
  const handleClaimQuestReward = (questId: string) => {
    const q = quests.find((item) => item.id === questId);
    if (!q || q.status === 'completed') return;

    // Grant XP
    setPlayerStats((prev) => {
      const totalXp = prev.xp + q.rewards.xp;
      let newLevel = prev.level;
      let nextXp = prev.xpToNext;
      let newStatPoints = prev.statPoints;

      if (totalXp >= nextXp) {
        newLevel += 1;
        nextXp = Math.round(nextXp * 1.6);
        newStatPoints += 5;
        soundEngine.playLevelUp();
      }

      return {
        ...prev,
        level: newLevel,
        xp: totalXp,
        xpToNext: nextXp,
        statPoints: newStatPoints,
      };
    });

    // Grant Gold & Tokens
    economyRef.current.earn('gold', q.rewards.gold, 'quest', `Completed: ${q.title}`);
    if (q.rewards.rareTokens) {
      economyRef.current.earn('rareTokens', q.rewards.rareTokens, 'quest', `Completed: ${q.title}`);
    }
    if (q.rewards.diamonds) {
      economyRef.current.earn('diamonds', q.rewards.diamonds, 'quest', `Completed: ${q.title}`);
    }

    // Grant item if specified
    if (q.rewards.itemRewardId && ITEMS_DATABASE[q.rewards.itemRewardId]) {
      const rewardItem = ITEMS_DATABASE[q.rewards.itemRewardId];
      setInventory((prev) => [...prev, { item: rewardItem, quantity: 1 }]);
    }

    // Mark quest completed
    setQuests((prev) =>
      prev.map((item) => (item.id === questId ? { ...item, status: 'completed' } : item))
    );
  };

  const handleOpenShopById = (shopId: string) => {
    const found = INITIAL_SHOPS.find((s) => s.id === shopId);
    if (found) {
      setActiveShop(found);
      setActiveModal('shop');
    }
  };

  const handleIncreaseTrust = (npcId: string, delta: number) => {
    setCitizens((prev) =>
      prev.map((c) => (c.id === npcId ? { ...c, trustWithPlayer: c.trustWithPlayer + delta } : c))
    );

    // Complete NPC conversation quests
    if (npcId === 'npc_torvald') {
      setQuests((prev) =>
        prev.map((q) => (q.id === 'q_vanguard' ? { ...q, currentCount: 1 } : q))
      );
    } else if (npcId === 'npc_branigan') {
      setQuests((prev) =>
        prev.map((q) => (q.id === 'q_frontier' ? { ...q, currentCount: 1 } : q))
      );
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Three.js Isolated Canvas Mount */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* World Selection & Creation Screen */}
      {gameState === 'world_select' && (
        <WorldSelectModal
          worlds={worlds}
          activeUser={activeUser}
          onEnterWorld={handleEnterWorld}
          onCreateWorld={handleCreateWorld}
          onDeleteWorld={handleDeleteWorld}
          onOpenAuth={() => setActiveModal('auth')}
        />
      )}

      {/* In-Game Active HUD */}
      {gameState === 'playing' && (
        <>
          <GameHud
            playerStats={playerStats}
            wallet={wallet}
            nearestNpc={nearestNpc}
            hotbarSlots={hotbarSlots}
            comboStep={comboStep}
            isBlocking={isBlocking}
            activeQuestsCount={quests.filter((q) => q.status === 'active' || q.status === 'available').length}
            onUseHotbarSlot={handleUseHotbarSlot}
            onOpenInventory={() => setActiveModal('inventory')}
            onOpenCharacter={() => setActiveModal('character')}
            onOpenCrafting={() => setActiveModal('crafting')}
            onOpenCivilization={() => setActiveModal('civilization')}
            onOpenQuests={() => setActiveModal('quests')}
            onOpenSettings={() => setActiveModal('settings')}
            onOpenWorldMenu={() => {
              saveActiveWorld();
              setGameState('world_select');
            }}
            onInteract={() => {
              if (nearestNpc) {
                soundEngine.playUiClick();
                setActiveModal('dialogue');
              }
            }}
            onAttack={() => {
              if (gameSceneRef.current) gameSceneRef.current.triggerAttack();
            }}
            onBlockToggle={(blocking) => {
              setIsBlocking(blocking);
              if (gameSceneRef.current) gameSceneRef.current.triggerBlock(blocking);
            }}
            onDodge={() => {
              if (gameSceneRef.current) gameSceneRef.current.triggerDodge();
            }}
            onJump={() => {
              if (gameSceneRef.current) gameSceneRef.current.triggerJump();
            }}
            onSprintToggle={(sprint) => {
              if (gameSceneRef.current) gameSceneRef.current.isSprinting = sprint;
            }}
            onSkillWhirlwind={handleSkillWhirlwind}
            onSkillNova={handleSkillNova}
            onSkillHeal={handleSkillHeal}
            onJoystickMove={(x, y) => {
              if (gameSceneRef.current) {
                gameSceneRef.current.virtualJoystick.x = x;
                gameSceneRef.current.virtualJoystick.y = y;
              }
            }}
            isMuted={isMuted}
            onToggleMute={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              soundEngine.setMuted(nextMuted);
            }}
            showMobileControls={settings.touchControlsVisible}
          />

          {settings.showTelemetry && <TelemetryOverlay telemetry={telemetry} />}
        </>
      )}

      {/* ALL MODALS */}
      {activeModal === 'auth' && (
        <AuthModal
          activeUser={activeUser}
          onUserChange={(user) => {
            setActiveUser(user);
            setWorlds(accountManager.getWorlds());
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'quests' && (
        <QuestsModal
          quests={quests}
          onClaimReward={handleClaimQuestReward}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'inventory' && (
        <InventoryModal
          inventory={inventory}
          equipment={equipment}
          maxWeight={50 + playerStats.attributes.strength * 2.5}
          onEquipItem={handleEquipItem}
          onUnequipSlot={handleUnequipSlot}
          onUseItem={handleUseItem}
          onDropItem={handleDropItem}
          onAssignHotbar={handleAssignHotbar}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'shop' && activeShop && (
        <ShopModal
          shop={activeShop}
          wallet={wallet}
          inventory={inventory}
          onBuyItem={handleBuyShopItem}
          onSellItem={handleSellShopItem}
          onClose={() => {
            setActiveModal('none');
            setActiveShop(null);
          }}
        />
      )}

      {activeModal === 'civilization' && (
        <CivilizationModal
          citizens={citizens}
          reputation={playerStats.reputation}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'crafting' && (
        <CraftingModal
          inventory={inventory}
          wallet={wallet}
          onUpgradeItem={handleUpgradeItem}
          onSocketGem={() => true}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'character' && (
        <CharacterModal
          playerStats={playerStats}
          onAllocateStat={handleAllocateStat}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'dialogue' && nearestNpc && (
        <DialogueModal
          npc={nearestNpc}
          onOpenShop={handleOpenShopById}
          onIncreaseTrust={handleIncreaseTrust}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            if (gameSceneRef.current) {
              gameSceneRef.current.updateSettings(newSettings);
            }
          }}
          onManualSave={saveActiveWorld}
          onExportSave={() => {
            const blob = new Blob([JSON.stringify(currentWorld, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Aetheria_World_${currentWorld?.name || 'World'}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          onImportSave={(jsonStr) => {
            try {
              const importedWorld = JSON.parse(jsonStr);
              if (importedWorld.id && importedWorld.name) {
                accountManager.addWorld(importedWorld);
                setWorlds(accountManager.getWorlds());
                handleEnterWorld(importedWorld);
              }
            } catch {
              alert('Invalid world file.');
            }
          }}
          onClose={() => setActiveModal('none')}
        />
      )}
    </div>
  );
}
