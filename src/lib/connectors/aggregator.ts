/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExternalAsset {
  institution: string;
  name: string;
  type: 'EQUITY' | 'DEBT' | 'CASH';
  balance: number;
}

export interface AggregatorAdapter {
  fetchData(): Promise<ExternalAsset[]>;
}

/**
 * ICICI Adapter
 */
class ICICIAdapter implements AggregatorAdapter {
  async fetchData(): Promise<ExternalAsset[]> {
    return [
      { institution: 'ICICI', name: 'Savings Account', type: 'CASH', balance: 125000 },
      { institution: 'ICICI', name: 'Personal Loan', type: 'DEBT', balance: 450000 }
    ];
  }
}

/**
 * HDFC Adapter
 */
class HDFCAdapter implements AggregatorAdapter {
  async fetchData(): Promise<ExternalAsset[]> {
    return [
      { institution: 'HDFC', name: 'Savings Account', type: 'CASH', balance: 85000 },
      { institution: 'HDFC', name: 'Home Loan', type: 'DEBT', balance: 4200000 }
    ];
  }
}

/**
 * Zerodha Adapter
 */
class ZerodhaAdapter implements AggregatorAdapter {
  async fetchData(): Promise<ExternalAsset[]> {
    return [
      { institution: 'ZERODHA', name: 'Nifty 50 Index Fund', type: 'EQUITY', balance: 850000 },
      { institution: 'ZERODHA', name: 'Liquid Fund', type: 'CASH', balance: 50000 }
    ];
  }
}

/**
 * Open Finance Aggregator
 * Standardized interface for fetching data from multiple institutions.
 */
export class OpenFinanceAggregator {
  private adapters: AggregatorAdapter[] = [
    new ICICIAdapter(),
    new HDFCAdapter(),
    new ZerodhaAdapter()
  ];

  async syncAll(): Promise<ExternalAsset[]> {
    const results = await Promise.all(this.adapters.map(a => a.fetchData()));
    return results.flat();
  }
}
