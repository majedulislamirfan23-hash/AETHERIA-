/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  GameItem, 
  InventorySlot, 
  EquipmentLoadout, 
  EquipSlot, 
  ItemCategory 
} from '../types/game';
import { RARITY_COLORS } from '../data/items';
import { 
  X, 
  Shield, 
  Sword, 
  Sparkles, 
  Zap, 
  HardHat, 
  Footprints, 
  Heart, 
  CircleDot, 
  Compass, 
  Truck, 
  Weight, 
  Trash2, 
  Layers 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface InventoryModalProps {
  inventory: InventorySlot[];
  equipment: EquipmentLoadout;
  maxWeight: number;
  onEquipItem: (item: GameItem) => void;
  onUnequipSlot: (slot: EquipSlot) => void;
  onUseItem: (item: GameItem) => void;
  onDropItem: (item: GameItem, quantity: number) => void;
  onAssignHotbar: (item: GameItem, slotIndex: number) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  equipment,
  maxWeight,
  onEquipItem,
  onUnequipSlot,
  onUseItem,
  onDropItem,
  onAssignHotbar,
  onClose,
}) => {
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'all'>('all');

  // Compute total inventory weight
  const currentWeight = inventory.reduce((sum, slot) => sum + slot.item.weight * slot.quantity, 0);
  const weightPercent = Math.min(100, (currentWeight / maxWeight) * 100);

  const filteredInventory = inventory.filter((slot) => {
    if (activeCategory === 'all') return true;
    return slot.item.category === activeCategory;
  });

  // Calculate equipped bonus totals
  const totalStats = Object.values(equipment).reduce(
    (acc, item) => {
      if (!item || !item.stats) return acc;
      acc.attack += item.stats.attack || 0;
      acc.defense += item.stats.defense || 0;
      acc.magicPower += item.stats.magicPower || 0;
      acc.health += item.stats.healthBonus || 0;
      acc.stamina += item.stats.staminaBonus || 0;
      return acc;
    },
    { attack: 0, defense: 0, magicPower: 0, health: 0, stamina: 0 }
  );

  const getEquippedInSlot = (slot: EquipSlot): GameItem | null => {
    return equipment[slot];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">INVENTORY & EQUIPMENT</h2>
              <div className="text-xs text-slate-400 font-mono">
                Manage gear loadouts, quick-access consumables, and encumbrance
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-6 overflow-y-auto">
          {/* ================= LEFT: EQUIPMENT PAPERDOLL (4 Cols) ================= */}
          <div className="md:col-span-4 flex flex-col gap-4 bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Equipped Armaments
            </div>

            {/* Slots Visual Layout */}
            <div className="grid grid-cols-3 gap-2.5 my-auto">
              {/* Row 1: Head */}
              <div />
              <EquipmentSlotButton
                slot="head"
                item={equipment.head}
                icon={<HardHat className="w-5 h-5" />}
                label="Helm"
                onSelect={setSelectedItem}
                onUnequip={onUnequipSlot}
              />
              <div />

              {/* Row 2: MainHand, Chest, OffHand */}
              <EquipmentSlotButton
                slot="mainHand"
                item={equipment.mainHand}
                icon={<Sword className="w-5 h-5" />}
                label="Weapon"
                onSelect={setSelectedItem}
                onUnequip={onUnequipSlot}
              />
              <EquipmentSlotButton
                slot="chest"
                item={equipment.chest}
                icon={<Shield className="w-5 h-5" />}
                label="Chest"
                onSelect={setSelectedItem}
                onUnequip={onUnequipSlot}
              />
              <EquipmentSlotButton
                slot="offHand"
                item={equipment.offHand}
                icon={<Shield className="w-5 h-5" />}
                label="Shield"
                onSelect={setSelectedItem}
                onUnequip={onUnequipSlot}
              />

              {/* Row 3: Ring1, Legs, Ring2 */}
              <EquipmentSlotButton
                slot="ring1"
                item={equipment.ring1}
                icon={<CircleDot className="w-5 h-5" />}
                label="Ring"
                onSelect={setSelectedItem}
                onUnequip={onUnequipSlot}
              />
              <EquipmentSlotButton
                slot="legs"
                item={equipment.legs}
                icon={<Footprints className="w-5 h-5" />}
                label="Greaves"
                onSelect={setSelectedItem}
                onUnequip={onUnequipSlot}
              />
              <EquipmentSlotButton
                slot="ring2"
                item={equipment.ring2}
                icon={<CircleDot className="w-5 h-5" />}
                label="Ring"
                onSelect={setSelectedItem}
                onUnequip={onUnequipSlot}
              />

              {/* Row 4: Amulet, Vehicle */}
              <EquipmentSlotButton
                slot="amulet"
                item={equipment.amulet}
                icon={<Compass className="w-5 h-5" />}
                label="Amulet"
                onSelect={setSelectedItem}
                onUnequip={onUnequipSlot}
              />
              <div />
              <EquipmentSlotButton
                slot="vehicle"
                item={equipment.vehicle}
                icon={<Truck className="w-5 h-5" />}
                label="Mount"
                onSelect={setSelectedItem}
                onUnequip={onUnequipSlot}
              />
            </div>

            {/* Total Gear Attribute Bonuses */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs font-mono">
              <div className="text-[11px] text-slate-400 font-bold uppercase mb-1.5">Loadout Attributes:</div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="text-amber-400">+ {totalStats.attack} Attack</div>
                <div className="text-sky-400">+ {totalStats.defense} Defense</div>
                <div className="text-purple-400">+ {totalStats.magicPower} Arcane</div>
                <div className="text-rose-400">+ {totalStats.health} HP</div>
              </div>
            </div>
          </div>

          {/* ================= CENTER: BACKPACK GRID (5 Cols) ================= */}
          <div className="md:col-span-5 flex flex-col gap-3">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'weapon', label: 'Weapons' },
                  { id: 'armor', label: 'Armor' },
                  { id: 'potion', label: 'Potions' },
                  { id: 'food', label: 'Food' },
                  { id: 'equipment', label: 'Equip' },
                  { id: 'magic', label: 'Magic' },
                  { id: 'vehicle', label: 'Mounts' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveCategory(cat.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-sky-500 text-white font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Capacity / Weight Bar */}
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-3 py-2 rounded-lg text-xs font-mono">
              <Weight className="w-4 h-4 text-slate-400" />
              <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    weightPercent > 90
                      ? 'bg-rose-500'
                      : weightPercent > 70
                      ? 'bg-amber-500'
                      : 'bg-sky-500'
                  }`}
                  style={{ width: `${weightPercent}%` }}
                />
              </div>
              <span className="tabular-nums text-slate-300">
                {currentWeight.toFixed(1)} / {maxWeight.toFixed(1)} kg
              </span>
            </div>

            {/* Inventory Slot Grid */}
            <div className="flex-1 grid grid-cols-4 sm:grid-cols-5 gap-2 overflow-y-auto max-h-[380px] p-1">
              {filteredInventory.map((slot, index) => {
                const rStyle = RARITY_COLORS[slot.item.rarity] || RARITY_COLORS.common;
                const isSelected = selectedItem?.id === slot.item.id;
                return (
                  <button
                    key={`${slot.item.id}_${index}`}
                    onClick={() => {
                      soundEngine.playUiClick();
                      setSelectedItem(slot.item);
                    }}
                    className={`relative aspect-square rounded-xl p-1.5 flex flex-col items-center justify-center border transition-all cursor-pointer ${rStyle.bg} ${
                      isSelected
                        ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-lg'
                        : `${rStyle.border} hover:border-slate-400`
                    }`}
                  >
                    <div className={`text-xs font-bold text-center line-clamp-2 ${rStyle.text}`}>
                      {slot.item.name}
                    </div>
                    {slot.quantity > 1 && (
                      <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[10px] font-mono font-bold text-amber-300">
                        x{slot.quantity}
                      </span>
                    )}
                    {slot.item.upgradeLevel && slot.item.upgradeLevel > 0 && (
                      <span className="absolute top-1 left-1 px-1 rounded bg-purple-900/80 text-[9px] font-mono font-bold text-purple-200">
                        +{slot.item.upgradeLevel}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Empty visual slots */}
              {Array.from({ length: Math.max(0, 20 - filteredInventory.length) }).map((_, i) => (
                <div
                  key={`empty_${i}`}
                  className="aspect-square rounded-xl border border-slate-800/40 bg-slate-950/30"
                />
              ))}
            </div>
          </div>

          {/* ================= RIGHT: ITEM INSPECT PANE (3 Cols) ================= */}
          <div className="md:col-span-3 flex flex-col bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            {selectedItem ? (
              <div className="flex flex-col h-full justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        RARITY_COLORS[selectedItem.rarity]?.bg || ''
                      } ${RARITY_COLORS[selectedItem.rarity]?.border || ''} ${
                        RARITY_COLORS[selectedItem.rarity]?.text || ''
                      }`}
                    >
                      {selectedItem.rarity}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Req Lvl {selectedItem.levelReq}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{selectedItem.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "{selectedItem.description}"
                  </p>

                  {/* Stats Breakdown */}
                  {selectedItem.stats && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs font-mono space-y-1">
                      {selectedItem.stats.attack && (
                        <div className="text-amber-400">Attack: +{selectedItem.stats.attack}</div>
                      )}
                      {selectedItem.stats.defense && (
                        <div className="text-sky-400">Defense: +{selectedItem.stats.defense}</div>
                      )}
                      {selectedItem.stats.magicPower && (
                        <div className="text-purple-400">Magic Power: +{selectedItem.stats.magicPower}</div>
                      )}
                      {selectedItem.stats.healthBonus && (
                        <div className="text-rose-400">Max HP: +{selectedItem.stats.healthBonus}</div>
                      )}
                      {selectedItem.stats.speed && (
                        <div className="text-emerald-400">Speed Multiplier: {selectedItem.stats.speed}x</div>
                      )}
                    </div>
                  )}

                  {/* Consumable Effects */}
                  {selectedItem.effects && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs font-mono space-y-1 text-emerald-300">
                      {selectedItem.effects.restoreHp && <div>Restores {selectedItem.effects.restoreHp} Health</div>}
                      {selectedItem.effects.restoreMp && <div>Restores {selectedItem.effects.restoreMp} Mana</div>}
                      {selectedItem.effects.restoreStamina && <div>Restores {selectedItem.effects.restoreStamina} Stamina</div>}
                      {selectedItem.effects.restoreHunger && <div>Restores {selectedItem.effects.restoreHunger} Hunger</div>}
                      {selectedItem.effects.restoreThirst && <div>Restores {selectedItem.effects.restoreThirst} Thirst</div>}
                      {selectedItem.effects.cureDebuffs && <div>Neutralizes Active Poisons</div>}
                    </div>
                  )}

                  {/* Durability and Weight */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                    <span>Durability: {selectedItem.durability}/{selectedItem.maxDurability}</span>
                    <span>Weight: {selectedItem.weight}kg</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                  {selectedItem.equipSlot && (
                    <button
                      onClick={() => {
                        soundEngine.playUiClick();
                        onEquipItem(selectedItem);
                      }}
                      className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Equip Item
                    </button>
                  )}

                  {selectedItem.effects && (
                    <button
                      onClick={() => {
                        onUseItem(selectedItem);
                      }}
                      className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Consume / Drink
                    </button>
                  )}

                  {/* Assign to Hotbar (1-6) */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Hotbar:</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            soundEngine.playUiClick();
                            onAssignHotbar(selectedItem, idx);
                          }}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-400 text-[10px] font-mono font-bold cursor-pointer transition-colors"
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playUiClick();
                      onDropItem(selectedItem, 1);
                      setSelectedItem(null);
                    }}
                    className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Drop Item</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <Shield className="w-10 h-10 mb-2 stroke-1" />
                <div className="text-xs font-medium">Select an item to view stats, equip, or assign to hotbar.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface EquipmentSlotButtonProps {
  slot: EquipSlot;
  item: GameItem | null;
  icon: React.ReactNode;
  label: string;
  onSelect: (item: GameItem) => void;
  onUnequip: (slot: EquipSlot) => void;
}

const EquipmentSlotButton: React.FC<EquipmentSlotButtonProps> = ({
  slot,
  item,
  icon,
  label,
  onSelect,
  onUnequip,
}) => {
  return (
    <button
      onClick={() => {
        soundEngine.playUiClick();
        if (item) {
          onSelect(item);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (item) {
          soundEngine.playUiClick();
          onUnequip(slot);
        }
      }}
      title={item ? `${item.name} (Right-click to unequip)` : `Empty ${label}`}
      className={`relative aspect-square rounded-xl p-1 flex flex-col items-center justify-center border transition-all cursor-pointer ${
        item
          ? `${RARITY_COLORS[item.rarity]?.bg || 'bg-slate-900'} ${RARITY_COLORS[item.rarity]?.border || 'border-slate-700'} text-white`
          : 'bg-slate-950/60 border-slate-800 text-slate-600 hover:border-slate-700'
      }`}
    >
      {item ? (
        <div className="text-[10px] font-bold text-center line-clamp-2 px-1">
          {item.name}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          {icon}
          <span className="text-[9px] uppercase font-mono tracking-tight">{label}</span>
        </div>
      )}
    </button>
  );
};
