/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LifeEventTemplate {
  id: string;
  name: string;
  description: string;
  type: 'EXPENSE' | 'INFLOW';
  amount: number;
  durationMonths: number;
  category: 'EDUCATION' | 'HEALTH' | 'REAL_ESTATE' | 'CELEBRATION';
}

export const LIFE_EVENT_TEMPLATES: LifeEventTemplate[] = [
  {
    id: 'coaching-crunch',
    name: 'The Coaching Crunch',
    description: '2-year spike in education expenses for JEE/NEET/SAT prep.',
    type: 'EXPENSE',
    amount: 500000,
    durationMonths: 24,
    category: 'EDUCATION'
  },
  {
    id: 'medical-buffer',
    name: 'The Medical Buffer',
    description: 'Sudden outflow for non-insured parental health issues.',
    type: 'EXPENSE',
    amount: 500000,
    durationMonths: 1,
    category: 'HEALTH'
  },
  {
    id: 'real-estate-pivot',
    name: 'The Real Estate Pivot',
    description: 'Selling a plot or old flat to "Nuke" the primary Home Loan.',
    type: 'INFLOW',
    amount: 2500000,
    durationMonths: 1,
    category: 'REAL_ESTATE'
  },
  {
    id: 'anniversary-celebration',
    name: 'The Milestone Celebration',
    description: '25th anniversary or major family event.',
    type: 'EXPENSE',
    amount: 300000,
    durationMonths: 1,
    category: 'CELEBRATION'
  }
];

/**
 * Life Event Simulator
 * Calculates the impact of dropping events onto the financial timeline.
 */
export const lifeEventSimulator = {
  calculateImpact: (
    currentDebtFreeMonths: number,
    events: { templateId: string; startMonth: number }[],
    monthlyDisposable: number
  ) => {
    let shiftedMonths = currentDebtFreeMonths;
    let totalNetImpact = 0;

    for (const event of events) {
      const template = LIFE_EVENT_TEMPLATES.find(t => t.id === event.templateId);
      if (!template) continue;

      const impact = template.type === 'EXPENSE' ? -template.amount : template.amount;
      totalNetImpact += impact;
    }

    // Rough estimation: How many months of disposable income does the net impact represent?
    const monthShift = Math.round(-totalNetImpact / monthlyDisposable);
    shiftedMonths += monthShift;

    return {
      originalMonths: currentDebtFreeMonths,
      newMonths: Math.max(0, shiftedMonths),
      shift: monthShift,
      totalNetImpact
    };
  }
};
