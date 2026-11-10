/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShopDefinition, 
  GameItem, 
  Wallet, 
  InventorySlot, 
  CurrencyType 
} from '../types/game';
import { ITEMS_DATABASE, RARITY_COLORS } from '../data/items';
import { 
  X, 
  Store, 
  Coins, 
  Gem, 
  Crown, 
  Sparkle, 
  ShoppingBag, 
  ArrowRightLeft, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { soundEngine } from '../systems/audio';

interface ShopModalProps {
  shop: ShopDefinition;
  wallet: Wallet;
  inventory: InventorySlot[];
  onBuyItem: (item: GameItem, quantity: number, totalCost: number, currency: CurrencyType) => boolean;
  onSellItem: (item: GameItem, quantity: number, payout: number, currency: CurrencyType) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  shop,
  wallet,
  inventory,
  onBuyItem,
  onSellItem,
  onClose,
}) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [selectedShopItem, setSelectedShopItem] = useState<{ item: GameItem; stock: number } | null>(null);
  const [selectedPlayerItem, setSelectedPlayerItem] = useState<{ item: GameItem; quantity: number } | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const getCurrencyIcon = (cur: CurrencyType) => {
    switch (cur) {
      case 'gold':
        return <Coins className="w-3.5 h-3.5 text-amber-400" />;
      case 'diamonds':
        return <Gem className="w-3.5 h-3.5 text-sky-400" />;
      case 'silver':
        return <span className="font-mono text-slate-300 font-bold text-xs">S</span>;
      case 'rareTokens':
        return <Crown className="w-3.5 h-3.5 text-rose-400" />;
      case 'gems':
        return <Sparkle className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  // Convert shop item list to real items
  const shopInventory = shop.items
    .map((entry) => {
      const item = ITEMS_DATABASE[entry.itemId];
      if (!item) return null;
      return { item, stock: entry.stock };
    })
    .filter(Boolean) as { item: GameItem; stock: number }[];

  const handleBuy = () => {
    if (!selectedShopItem) return;
    const unitPrice = selectedShopItem.item.basePrice;
    const totalCost = unitPrice * buyQuantity;

    if (wallet[shop.currencyAccepted] < totalCost) {
      setFeedbackMsg({ text: `Insufficient ${shop.currencyAccepted}!`, error: true });
      return;
    }

    const success = onBuyItem(selectedShopItem.item, buyQuantity, totalCost, shop.currencyAccepted);
    if (success) {
      soundEngine.playCoinJingle();
      setFeedbackMsg({ text: `Purchased ${buyQuantity}x ${selectedShopItem.item.name}!` });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleSell = () => {
    if (!selectedPlayerItem) return;
    const unitPrice = Math.max(1, Math.round(selectedPlayerItem.item.basePrice * shop.buybackMultiplier));
    const totalPayout = unitPrice * sellQuantity;

    onSellItem(selectedPlayerItem.item, sellQuantity, totalPayout, shop.currencyAccepted);
    soundEngine.playCoinJingle();
    setFeedbackMsg({ text: `Sold ${sellQuantity}x ${selectedPlayerItem.item.name} for ${totalPayout} ${shop.currencyAccepted}!` });
    setSelectedPlayerItem(null);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-4xl h-[88vh] max-h-[800px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header with Shop Details and Current Funds */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">{shop.name}</h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {shop.district}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Proprietor: <span className="text-sky-300 font-medium">{shop.keeperName}</span> • {shop.description}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Accepted Currency Balance Pill */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl font-mono text-xs">
              <span className="text-slate-400">Wallet:</span>
              <div className="flex items-center gap-1.5 font-bold text-white">
                {getCurrencyIcon(shop.currencyAccepted)}
                <span className="tabular-nums">
                  {wallet[shop.currencyAccepted].toLocaleString()} {shop.currencyAccepted}
                </span>
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
        </div>

        {/* Buy / Sell Tabs */}
        <div className="flex items-center gap-3 px-6 pt-3 border-b border-slate-800 bg-slate-950">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setTab('buy');
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              tab === 'buy'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Vendor Stock ({shopInventory.length})</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setTab('sell');
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              tab === 'sell'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Sell Items ({inventory.length})</span>
          </button>

          {feedbackMsg && (
            <div
              className={`ml-auto flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg ${
                feedbackMsg.error
                  ? 'bg-rose-950/70 border border-rose-500/60 text-rose-300'
                  : 'bg-emerald-950/70 border border-emerald-500/60 text-emerald-300'
              }`}
            >
              {feedbackMsg.error ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-6 overflow-hidden">
          {/* ================= LEFT: ITEMS LIST (7 Cols) ================= */}
          <div className="md:col-span-7 flex flex-col gap-2 overflow-y-auto pr-1">
            {tab === 'buy' ? (
              shopInventory.map(({ item, stock }) => {
                const isSelected = selectedShopItem?.item.id === item.id;
                const rStyle = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
                const canAfford = wallet[shop.currencyAccepted] >= item.basePrice;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      soundEngine.playUiClick();
                      setSelectedShopItem({ item, stock });
                      setBuyQuantity(1);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-sky-400 shadow-md ring-1 ring-sky-400/50'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${rStyle.text}`}>{item.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {item.rarity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{item.description}</div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-mono text-slate-500">Stock: {stock}</span>
                      <div className={`flex items-center gap-1 font-mono font-bold text-xs ${canAfford ? 'text-amber-300' : 'text-rose-400'}`}>
                        {getCurrencyIcon(shop.currencyAccepted)}
                        <span>{item.basePrice}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              inventory.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
                  Your backpack is empty. Nothing to sell.
                </div>
              ) : (
                inventory.map((slot) => {
                  const isSelected = selectedPlayerItem?.item.id === slot.item.id;
                  const rStyle = RARITY_COLORS[slot.item.rarity] || RARITY_COLORS.common;
                  const sellValue = Math.max(1, Math.round(slot.item.basePrice * shop.buybackMultiplier));

                  return (
                    <button
                      key={slot.item.id}
                      onClick={() => {
                        soundEngine.playUiClick();
                        setSelectedPlayerItem({ item: slot.item, quantity: slot.quantity });
                        setSellQuantity(1);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-sky-400 shadow-md ring-1 ring-sky-400/50'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${rStyle.text}`}>{slot.item.name}</span>
                          <span className="text-[10px] font-mono text-amber-300 font-bold">x{slot.quantity}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Durability: {slot.item.durability}/{slot.item.maxDurability}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-mono font-bold text-xs text-emerald-400 shrink-0">
                        <span>+{sellValue}</span>
                        {getCurrencyIcon(shop.currencyAccepted)}
                      </div>
                    </button>
                  );
                })
              )
            )}
          </div>

          {/* ================= RIGHT: TRANSACTION PANEL (5 Cols) ================= */}
          <div className="md:col-span-5 flex flex-col justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            {tab === 'buy' ? (
              selectedShopItem ? (
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Purchase Order
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Max Stock: {selectedShopItem.stock}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{selectedShopItem.item.name}</h3>
                    <p className="text-xs text-slate-400 italic">
                      "{selectedShopItem.item.description}"
                    </p>

                    {/* Quantity Selector */}
                    {selectedShopItem.item.stackable && (
                      <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-xs font-mono text-slate-400">Quantity:</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-sm w-6 text-center">{buyQuantity}</span>
                          <button
                            onClick={() => setBuyQuantity(Math.min(selectedShopItem.stock, buyQuantity + 1))}
                            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Total Calculation */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 font-mono text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Unit Price:</span>
                        <span>{selectedShopItem.item.basePrice} {shop.currencyAccepted}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Quantity:</span>
                        <span>x{buyQuantity}</span>
                      </div>
                      <div className="flex justify-between font-bold text-white pt-1.5 border-t border-slate-800 text-sm">
                        <span>Total Due:</span>
                        <span className="text-amber-300">
                          {(selectedShopItem.item.basePrice * buyQuantity).toLocaleString()} {shop.currencyAccepted}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleBuy}
                    disabled={wallet[shop.currencyAccepted] < selectedShopItem.item.basePrice * buyQuantity}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-sky-500/20 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Confirm Purchase
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center">
                  Select an item from the vendor stock to inspect and purchase.
                </div>
              )
            ) : (
              selectedPlayerItem ? (
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Sell Order
                    </span>
                    <h3 className="text-base font-bold text-white">{selectedPlayerItem.item.name}</h3>
                    <p className="text-xs text-slate-400 italic">
                      "{selectedPlayerItem.item.description}"
                    </p>

                    {selectedPlayerItem.quantity > 1 && (
                      <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-xs font-mono text-slate-400">Quantity to sell:</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-sm w-6 text-center">{sellQuantity}</span>
                          <button
                            onClick={() => setSellQuantity(Math.min(selectedPlayerItem.quantity, sellQuantity + 1))}
                            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 font-mono text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Vendor Buyback Offer:</span>
                        <span>
                          {Math.max(1, Math.round(selectedPlayerItem.item.basePrice * shop.buybackMultiplier))} {shop.currencyAccepted}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-white pt-1.5 border-t border-slate-800 text-sm">
                        <span>You Receive:</span>
                        <span className="text-emerald-400">
                          +{(Math.max(1, Math.round(selectedPlayerItem.item.basePrice * shop.buybackMultiplier)) * sellQuantity).toLocaleString()} {shop.currencyAccepted}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSell}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    Confirm Sell
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center">
                  Select an item from your backpack to liquidate for currency.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
