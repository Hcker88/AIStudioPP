import { UserProfileSchema } from "./types";

export function parseMessage(message: string, profile: UserProfileSchema): { updatedProfile: UserProfileSchema, identifiedIntent: boolean } {
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
    const matches = str.match(/([\d,.]+\s*(?:-|to|and)\s*[\d,.]+\s*(?:k|lakh|l)?|[\d,.]+\s*(?:k|lakh|l)?)/gi);
    if (!matches) return [];
    return matches.map(m => parseAmount(m)).filter(v => v !== null) as number[];
  };

  // ===== INCOME =====
  const incContextMatches = [...text.matchAll(/(?:earn|income|salary|make)[^\d]*([\d,.]+\s*(?:-|to|and)\s*[\d,.]+\s*(?:k|lakh|l)?|[\d,.]+\s*(?:k|lakh|l)?)|([\d,.]+\s*(?:k|lakh|l)?)[^\d]*(?:earn|income|salary|make)/gi)];
  for (const match of incContextMatches) {
    const val = parseAmount(match[1] || match[2]);
    if (val !== null) { 
      updatedProfile.income = val; 
      identifiedIntent = true; 
    }
  }

  // ===== EXPENSES =====
  const expContextMatches = [...text.matchAll(/(?:spend|expense|expenses|cost)[^\d]*([\d,.]+\s*(?:-|to|and)\s*[\d,.]+\s*(?:k|lakh|l)?|[\d,.]+\s*(?:k|lakh|l)?)|([\d,.]+\s*(?:k|lakh|l)?)[^\d]*(?:spend|expense|expenses|cost)/gi)];
  for (const match of expContextMatches) {
    const val = parseAmount(match[1] || match[2]);
    if (val !== null) { 
      updatedProfile.expenses = Math.max(updatedProfile.expenses || 0, val);
      identifiedIntent = true; 
    }
  }

  // ===== LOANS =====
  if (text.includes("loan") || text.includes("debt") || text.includes("emi")) {
    const loanContextMatches = [...text.matchAll(/(?:loan|debt|emi)[^\d]*([\d,.]+\s*(?:k|lakh|l)?)|([\d,.]+\s*(?:k|lakh|l)?)[^\d]*(?:loan|debt|emi)/gi)];
    let processed = false;
    for (const match of loanContextMatches) {
      const val = parseAmount(match[1] || match[2]);
      if (val !== null && val > 100) {
        updatedProfile.loans.push(val);
        identifiedIntent = true;
        processed = true;
      }
    }
    
    // Check for "loan X emi Y" pattern cleanly if not caught above
    if (!processed && (text.includes("loan") || text.includes("debt"))) {
      const loanIndex = Math.max(text.indexOf("loan"), text.indexOf("debt"));
      const afterLoanStr = text.substring(loanIndex);
      const loanMatches = parseAllAmounts(afterLoanStr);
      if (loanMatches.length > 0) {
        loanMatches.forEach(amount => {
          if (amount > 100) {
            updatedProfile.loans.push(amount);
            identifiedIntent = true;
          }
        });
      }
    }
  }

  // ===== INVESTMENTS / ASSETS =====
  if (text.includes("invest") || text.includes("bought") || text.includes("gold") || text.includes("stock") || text.includes("shares") || text.includes("nifty") || text.includes("mutual fund") || text.includes("mf")) {
    // Look for gold
    const goldMatches = [...text.matchAll(/([\d,.]+\s*(?:k|lakh|l)?)[^\d]*(?:in)?\s*gold|gold[^\d]*([\d,.]+\s*(?:k|lakh|l)?)/gi)];
    for (const match of goldMatches) {
      const valStr = match[1] || match[2];
      const val = parseAmount(valStr);
      if (val !== null && val > 100) {
        updatedProfile.assets.gold = (updatedProfile.assets.gold || 0) + val;
        identifiedIntent = true;
      }
    }
    
    // Look for stocks / mf
    const stockMatches = [...text.matchAll(/([\d,.]+\s*(?:k|lakh|l)?)[^\d]*(?:in)?\s*(?:stock|shares|equity|nifty|mutual fund|mf)|(?:stock|shares|equity|nifty|mutual fund|mf)[^\d]*([\d,.]+\s*(?:k|lakh|l)?)/gi)];
    for (const match of stockMatches) {
      const valStr = match[1] || match[2];
      const val = parseAmount(valStr);
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
    // Only complain about numbers if they look like actual monetary amounts (e.g., > 100 or specific formats like 5k)
    const rawNumbers = text.match(/(?:(?:rs\.?|inr|₹|\$)\s*)?\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/gi) || [];
    const validAmountLike = rawNumbers.some(n => {
      const val = parseFloat(n.replace(/[^\d.]/g, ''));
      return !isNaN(val) && val > 99; // Ignore numbers under 100 which are often just conversational ("give me 3 tips", "in 5 days")
    });

    if (validAmountLike) {
      throw new Error("I see numbers here, but I'm not sure what they represent. Could you clarify if they are for income, expenses, loans, or investments?");
    }
  }

  if (identifiedIntent) {

    updatedProfile.lastUpdated = Date.now();
  }
  return { updatedProfile, identifiedIntent };
}
