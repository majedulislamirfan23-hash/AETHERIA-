/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quest } from '../types/game';

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q_vanguard',
    title: 'The Awakened Vanguard',
    description: 'Report to Torvald Ironhand in the Citadel Plaza. Acquire your starter steel blade and inspect the forge operations.',
    category: 'main',
    giverNpcName: 'Torvald Ironhand',
    objectiveText: 'Converse with Torvald at the Citadel Anvil',
    targetCount: 1,
    currentCount: 0,
    status: 'active',
    rewards: {
      xp: 150,
      gold: 200,
      diamonds: 5,
    },
  },
  {
    id: 'q_frontier',
    title: 'Breadbasket of Aetheria',
    description: 'Travel beyond the gates to the Silverpine Farmstead. Speak with Elder Branigan and evaluate grain supply levels.',
    category: 'faction',
    giverNpcName: 'Elder Branigan',
    objectiveText: 'Visit Silverpine Farmstead and consult with Elder Branigan',
    targetCount: 1,
    currentCount: 0,
    status: 'available',
    rewards: {
      xp: 220,
      gold: 300,
      itemRewardId: 'f_dragon_stew',
    },
  },
  {
    id: 'q_combat_trial',
    title: 'Trial of the Blade Combo',
    description: 'Practice combat prowess against target obstacles in the outskirts. Execute 3-hit weapon combos and test defensive blocking.',
    category: 'bounty',
    giverNpcName: 'Lady Andrea',
    objectiveText: 'Execute weapon strikes and combos',
    targetCount: 6,
    currentCount: 0,
    status: 'available',
    rewards: {
      xp: 350,
      gold: 450,
      rareTokens: 4,
    },
  },
  {
    id: 'q_arcane_study',
    title: 'Arcane Core Synthesis',
    description: 'Archmage Kaelen at the High Spire is researching elemental socketing. Deliver socket gems or temper your armament in the Citadel Forge.',
    category: 'main',
    giverNpcName: 'Archmage Kaelen',
    objectiveText: 'Temper an item at the Forge or socket a gem',
    targetCount: 1,
    currentCount: 0,
    status: 'available',
    rewards: {
      xp: 400,
      gold: 500,
      rareTokens: 6,
      itemRewardId: 'm_ruby_gem',
    },
  },
  {
    id: 'q_merchant_baron',
    title: 'Master of Commerce',
    description: 'Trade with various local shopkeepers across the districts and accumulate over 1,000 Gold.',
    category: 'faction',
    giverNpcName: 'Rowan Silverleaf',
    objectiveText: 'Amass wealth through trade and market deliveries',
    targetCount: 1000,
    currentCount: 650,
    status: 'available',
    rewards: {
      xp: 500,
      gold: 800,
      diamonds: 15,
      rareTokens: 10,
    },
  },
];
