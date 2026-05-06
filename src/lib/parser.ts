import { UserProfileSchema } from "./types";

export function parseMessage(message: string, profile: UserProfileSchema): UserProfileSchema {
  const text = message.toLowerCase();
  const updatedProfile: UserProfileSchema = JSON.parse(JSON.stringify(profile));
  
  let identifiedIntent = false;

  const parseAmount = (str: string): number | null => {
    const rangeMatch = str.match(/([\d,.]+)\s*(?:-|to|and)\s*([\d,.]+)\s*(k|lakh|l)?/i);
    if (rangeMatch) {
       const v1 = parseFloat(rangeMatch[1].replace(/,/g, ""));
       const v2 = parseFloat(rangeMatch[2].replace(/,/g, ""));
       let avg = (v1 + v2) / 2;
       const suffix = rangeMatch[3] ? rangeMatch[3].toLowerCase() : (str.includes('k') ? 'k' : str.includes('lakh') || str.includes('l') ? 'lakh' : '');
       if (suffix.startsWith("k")) avg *= 1000;
       if (suffix.startsWith("l")) avg *= 100000;
       return avg;
    }
    
    const singleMatch = str.match(/([\d,.]+)\s*(k|lakh|l)?/i);
    if (singleMatch) {
       let val = parseFloat(singleMatch[1].replace(/,/g, ""));
       const suffix = singleMatch[2] ? singleMatch[2].toLowerCase() : (str.includes('k') ? 'k' : str.includes('lakh') || str.includes('l') ? 'lakh' : '');
       if (suffix.startsWith("k")) val *= 1000;
       if (suffix.startsWith("l")) val *= 100000;
       return val;
    }
    return null;
  };

  const parseAllAmounts = (str: string): number[] => {
    const matches = str.match(/([\d,.]+)\s*(k|lakh|l)?/gi);
    if (!matches) return [];
    return matches.map(m => parseAmount(m)).filter(v => v !== null) as number[];
  };

  // ===== INCOME =====
  const incContextMatches = [...text.matchAll(/(?:earn|income|salary|make)[^\d]*([\d,.]+\s*(?:-|to|and)\s*[\d,.]+\s*(?:k|lakh|l)?|[\d,.]+\s*(?:k|lakh|l)?)/gi)];
  for (const match of incContextMatches) {
    const val = parseAmount(match[1]);
    if (val !== null) { 
      updatedProfile.income = val; 
      identifiedIntent = true; 
    }
  }

  // ===== EXPENSES =====
  const expContextMatches = [...text.matchAll(/(?:spend|expense|expenses|cost)[^\d]*([\d,.]+\s*(?:-|to|and)\s*[\d,.]+\s*(?:k|lakh|l)?|[\d,.]+\s*(?:k|lakh|l)?)/gi)];
  for (const match of expContextMatches) {
    const val = parseAmount(match[1]);
    if (val !== null) { 
      updatedProfile.expenses = Math.max(updatedProfile.expenses || 0, val); // could be multiple, maybe just take last or add
      identifiedIntent = true; 
    }
  }

  // ===== LOANS =====
  if (text.includes("loan") || text.includes("debt")) {
    const loanIndex = Math.max(text.indexOf("loan"), text.indexOf("debt"));
    const afterLoanStr = text.substring(loanIndex);
    // Find numbers closely following loan/debt
    const loanMatches = parseAllAmounts(afterLoanStr);
    if (loanMatches.length > 0) {
      // Clear existing if they list new ones explicitly? Best to append for now and let user reset, 
      // but typical bot behavior is to just add it
      loanMatches.forEach(amount => {
        // Only consider actual significant numbers (ignore "2" in "2 loans")
        if (amount > 100) {
          updatedProfile.loans.push(amount);
          identifiedIntent = true;
        }
      });
    }
  }

  // ===== INVESTMENTS / ASSETS =====
  if (text.includes("invest") || text.includes("bought") || text.includes("gold") || text.includes("stock") || text.includes("shares")) {
    // Specific check for Gold
    const goldMatch = text.match(/(?:gold)[^\d]*([\d,.]+\s*(?:k|lakh|l)?)/i);
    if (goldMatch && goldMatch[1]) {
      const val = parseAmount(goldMatch[1]);
      if (val !== null && val > 100) {
        updatedProfile.assets.gold = (updatedProfile.assets.gold || 0) + val;
        identifiedIntent = true;
      }
    }
    
    const stockMatch = text.match(/(?:stock|shares|equity)[^\d]*([\d,.]+\s*(?:k|lakh|l)?)/i);
    if (stockMatch && stockMatch[1]) {
      const val = parseAmount(stockMatch[1]);
      if (val !== null && val > 100) {
        updatedProfile.assets.stocks.push({
          name: "Equity Entry",
          quantity: 1,
          buyPrice: val,
          currentPrice: val
        });
        identifiedIntent = true;
      }
    }

    // specific pattern "bought 10 shares at 3000"
    const specificStockMatch = text.match(/([\d,.]+)\s+(?:shares|stocks).*?at\s+([\d,.]+)/i);
    if (specificStockMatch) {
      const qty = parseFloat(specificStockMatch[1].replace(/,/g, ""));
      const price = parseFloat(specificStockMatch[2].replace(/,/g, ""));
      if (qty > 0 && price > 0) {
        updatedProfile.assets.stocks.push({
          name: "Manual Entry",
          quantity: qty,
          buyPrice: price,
          currentPrice: price
        });
        identifiedIntent = true;
      }
    }
  }

  // Fallback intent check
  if (!identifiedIntent) {
    const rawNumbers = text.match(/[\d,.]+/g) || [];
    if (rawNumbers.length > 0) {
      throw new Error("I see numbers here, but I'm not sure what they represent. Could you clarify if they are for income, expenses, loans, or investments?");
    }
  }

  updatedProfile.lastUpdated = Date.now();
  return updatedProfile;
}
