/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AI Privacy Proxy
 * Masks PII (names, account numbers) before sending data to the Gemini API.
 */
export class AIPrivacyProxy {
  private static MASK_MAP = new Map<string, string>();
  private static REVERSE_MAP = new Map<string, string>();
  private static COUNTER = 0;

  /**
   * Masks PII in a string or object.
   */
  static mask(data: any): any {
    if (typeof data === 'string') {
      return this.maskString(data);
    } else if (Array.isArray(data)) {
      return data.map(item => this.mask(item));
    } else if (typeof data === 'object' && data !== null) {
      const maskedObj: any = {};
      for (const [key, value] of Object.entries(data)) {
        maskedObj[key] = this.mask(value);
      }
      return maskedObj;
    }
    return data;
  }

  /**
   * Unmasks tokens in a string.
   */
  static unmask(data: string): string {
    let unmasked = data;
    this.REVERSE_MAP.forEach((original, token) => {
      unmasked = unmasked.replace(new RegExp(token, 'g'), original);
    });
    return unmasked;
  }

  private static maskString(text: string): string {
    // Regex for potential PII (e.g., account numbers, full names)
    // This is a simplified example. In production, use more robust patterns.
    const accountRegex = /\b\d{10,16}\b/g; // 10-16 digit numbers (likely accounts)
    const nameRegex = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/g; // Capitalized full names

    let masked = text;

    // Mask Accounts
    masked = masked.replace(accountRegex, (match) => {
      return this.getToken(match, 'ACCOUNT');
    });

    // Mask Names
    masked = masked.replace(nameRegex, (match) => {
      return this.getToken(match, 'USER');
    });

    return masked;
  }

  private static getToken(original: string, type: string): string {
    if (this.MASK_MAP.has(original)) {
      return this.MASK_MAP.get(original)!;
    }

    const token = `${type}_${this.COUNTER++}`;
    this.MASK_MAP.set(original, token);
    this.REVERSE_MAP.set(token, original);
    return token;
  }
}
