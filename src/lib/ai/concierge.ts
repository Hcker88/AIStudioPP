/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CONCIERGE_MESSAGES = {
  ORACLE_IDLE: "Confused by the 'Wealth Shadow'? It just shows your best-case future. Want me to simplify it?",
  STRATEGY_IDLE: "Stuck on the 'Payment Timeline'? It's just a map of your debt-free journey. Want a nudge?",
  GOALS_IDLE: "Your 'Safety Check' is looking good. Want to see how a new goal impacts your timeline?",
  HOUSEHOLD_IDLE: "Family view is powerful. Want me to show you how pooling bonuses can save ₹2L in interest?"
};

export const conciergeLogic = {
  getMessage: (page: string) => {
    switch (page) {
      case 'ORACLE': return CONCIERGE_MESSAGES.ORACLE_IDLE;
      case 'STRATEGY': return CONCIERGE_MESSAGES.STRATEGY_IDLE;
      case 'GOALS': return CONCIERGE_MESSAGES.GOALS_IDLE;
      case 'HOUSEHOLD': return CONCIERGE_MESSAGES.HOUSEHOLD_IDLE;
      default: return "Need a hand? I'm here to guide your strategy.";
    }
  }
};
