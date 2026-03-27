/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const referralSystem = {
  generateShareText: (monthsSaved: number, loanType: string) => {
    return `I just shaved ${monthsSaved} months off my ${loanType} using AI. Check your date at DebtStrategist.AI.`;
  },

  getReferralLink: (userId: string) => {
    return `https://debtstrategist.ai/join?ref=${userId}`;
  },

  checkPremiumUnlock: (referralCount: number) => {
    return referralCount >= 3; // Unlock premium after 3 referrals
  }
};
