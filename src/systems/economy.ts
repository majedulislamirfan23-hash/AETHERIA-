/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrencyType, Wallet, Transaction, GameItem } from '../types/game';

export class EconomyManager {
  private wallet: Wallet;
  private transactions: Transaction[] = [];
  private onWalletChangeCallbacks: Array<(wallet: Wallet) => void> = [];

  constructor(initialWallet?: Partial<Wallet>) {
    this.wallet = {
      gold: 650,
      diamonds: 25,
      silver: 420,
      rareTokens: 12,
      gems: 35,
      ...initialWallet,
    };
  }

  public getWallet(): Wallet {
    return { ...this.wallet };
  }

  public getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  public onWalletChange(callback: (wallet: Wallet) => void) {
    this.onWalletChangeCallbacks.push(callback);
    return () => {
      this.onWalletChangeCallbacks = this.onWalletChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.onWalletChangeCallbacks.forEach(cb => cb({ ...this.wallet }));
  }

  public hasSufficient(currency: CurrencyType, amount: number): boolean {
    if (amount <= 0) return true;
    return this.wallet[currency] >= amount;
  }

  public spend(
    currency: CurrencyType,
    amount: number,
    category: Transaction['category'],
    description: string
  ): boolean {
    if (amount <= 0) return true;
    if (!this.hasSufficient(currency, amount)) {
      return false;
    }

    this.wallet[currency] = Math.max(0, this.wallet[currency] - amount);

    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      currency,
      amount,
      type: 'spend',
      balanceAfter: this.wallet[currency],
      category,
      description,
    };

    this.transactions.unshift(tx);
    if (this.transactions.length > 50) this.transactions.pop(); // keep last 50 transactions
    this.notify();
    return true;
  }

  public earn(
    currency: CurrencyType,
    amount: number,
    category: Transaction['category'],
    description: string
  ) {
    if (amount <= 0) return;

    this.wallet[currency] += amount;

    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      currency,
      amount,
      type: 'earn',
      balanceAfter: this.wallet[currency],
      category,
      description,
    };

    this.transactions.unshift(tx);
    if (this.transactions.length > 50) this.transactions.pop();
    this.notify();
  }

  /**
   * Calculates the current buying price of an item given shop price multiplier and regional demand
   */
  public calculateBuyPrice(item: GameItem, priceMultiplier: number = 1.0, demandFactor: number = 1.0): number {
    return Math.max(1, Math.round(item.basePrice * priceMultiplier * demandFactor));
  }

  /**
   * Calculates the sell price when selling to a vendor (includes durability degradation factor)
   */
  public calculateSellPrice(item: GameItem, buybackMultiplier: number = 0.5): number {
    const durabilityRatio = item.maxDurability > 0 ? (item.durability / item.maxDurability) : 1;
    const baseValue = item.basePrice * buybackMultiplier;
    return Math.max(1, Math.round(baseValue * (0.5 + 0.5 * durabilityRatio)));
  }

  public loadState(wallet: Wallet, transactions?: Transaction[]) {
    this.wallet = { ...wallet };
    if (transactions) {
      this.transactions = [...transactions];
    }
    this.notify();
  }
}
