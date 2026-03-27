/**
 * Indian Numbering System Formatter
 * Formats numbers into Lakhs and Crores (e.g., ₹1,00,000)
 */
export function formatINR(amount: number, includeSymbol: boolean = true, isPrivacyMode: boolean = false): string {
  if (isPrivacyMode) {
    const symbol = includeSymbol ? '₹' : '';
    return `${symbol}XX,XX,XXX`;
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  
  let result = formatter.format(amount);
  
  // Ensure the symbol is ₹ if Intl.NumberFormat uses something else in this environment
  if (includeSymbol && !result.includes('₹')) {
    result = '₹' + result.replace(/[^0-9,.]/g, '');
  }
  
  return result;
}

export function toLakhs(amount: number): string {
  return (amount / 100000).toFixed(2) + ' Lakhs';
}

export function toCrores(amount: number): string {
  return (amount / 10000000).toFixed(2) + ' Crores';
}
