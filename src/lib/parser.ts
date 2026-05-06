import { UserProfileSchema } from "./types";

export function parseMessage(message: string, profile: UserProfileSchema): UserProfileSchema {
  const text = message.toLowerCase();

  // Create a deep copy of the profile to avoid mutating the original directly
  const updatedProfile: UserProfileSchema = JSON.parse(JSON.stringify(profile));
  
  // Track history
  // If the snapshot differs, we'll want to add it eventually, but let's just make sure
  // it gets added at the pipeline level rather than inside the parser itself.

  const extractNumbers = (str: string) => {
    let matches = str.match(/[\d,.]+/g);
    if (!matches) return [];
    return matches.map((num) => parseFloat(num.replace(/,/g, "")));
  };

  const normalizeAmount = (text: string, value: number) => {
    if (text.includes("lakh")) return value * 100000;
    if (text.includes("k")) return value * 1000;
    return value;
  };

  // Detect ambiguity: If there are too many numbers without clear keywords, ask for clarification.
  // But we handle this via standard parsing flow first.

  let identifiedIntent = false;

  // ===== INCOME =====
  if (text.includes("earn") || text.includes("salary") || text.includes("make") || text.includes("income")) {
    let nums = extractNumbers(text);
    if (nums.length === 1) {
      updatedProfile.income = normalizeAmount(text, nums[0]);
      identifiedIntent = true;
    } else if (nums.length === 2 && !text.includes("expense") && !text.includes("spend")) {
      // range → take average if not combined with expenses
      updatedProfile.income = normalizeAmount(text, (nums[0] + nums[1]) / 2);
      identifiedIntent = true;
    } else if (nums.length >= 2) {
      // It might be a combined statement like "income 60k, expenses 30k"
      // handled separately below
    }
  }

  // ===== EXPENSES =====
  if (text.includes("spend") || text.includes("expense")) {
    let nums = extractNumbers(text);
    // Be careful with multiple intents logic: "my income is 60k and expenses are 30k"
    // Just find the numbers near the keyword. A simpler regex-based locality search:
    let expMatch = text.match(/(?:spend|expense).*?([\d,.]+)(k|lakh)?/i);
    if (expMatch && expMatch[1]) {
      let val = parseFloat(expMatch[1].replace(/,/g, ""));
      let suffix = expMatch[2] ? expMatch[2].toLowerCase() : "";
      if (suffix === "k" || text.includes("k")) val *= 1000;
      if (suffix === "lakh" || text.includes("lakh")) val *= 100000;
      updatedProfile.expenses = val;
      identifiedIntent = true;
    } else if (nums.length > 0 && !identifiedIntent) {
      updatedProfile.expenses = normalizeAmount(text, nums[0]);
      identifiedIntent = true;
    }
  }
  
  // Explicit Multi-intent combined handling if the above failed
  if (text.includes("income") && text.includes("expense")) {
    let incMatch = text.match(/income.*?([\d,.]+)(k|lakh)?/i);
    if (incMatch && incMatch[1]) {
      let val = parseFloat(incMatch[1].replace(/,/g, ""));
      if (incMatch[2] === "k" || text.includes("k")) val *= 1000;
      if (incMatch[2] === "lakh" || text.includes("lakh")) val *= 100000;
      updatedProfile.income = val;
    }
  }

  // ===== LOANS =====
  if (text.includes("loan") || text.includes("debt")) {
    let nums = extractNumbers(text.substring(text.indexOf("loan") > -1 ? text.indexOf("loan") : text.indexOf("debt")));
    nums.forEach(n => {
      updatedProfile.loans.push(normalizeAmount(text, n));
    });
    identifiedIntent = true;
  }

  // ===== GOLD =====
  if (text.includes("gold")) {
    let nums = extractNumbers(text.substring(text.indexOf("gold")));
    if (nums.length > 0) {
      updatedProfile.assets.gold += normalizeAmount(text, nums[0]);
      identifiedIntent = true;
    }
  }

  // ===== STOCK DETECTION =====
  if (text.includes("buy") || text.includes("bought") || text.includes("shares") || text.includes("stock")) {
    let nums = extractNumbers(text);
    
    // Check if it's an abstract amount like "invested 50k in stocks"
    if (text.includes("invested") && nums.length === 1) {
      updatedProfile.assets.stocks.push({
        name: "Equity Portfolio",
        quantity: 1,
        buyPrice: normalizeAmount(text, nums[0]),
        currentPrice: normalizeAmount(text, nums[0])
      });
      identifiedIntent = true;
    } else if (nums.length >= 2) {
      updatedProfile.assets.stocks.push({
        name: "Manual Entry",
        quantity: nums[0],
        buyPrice: normalizeAmount(text, nums[1]),
        currentPrice: normalizeAmount(text, nums[1])
      });
      identifiedIntent = true;
    }
  }

  // ===== GOALS =====
  if (text.includes("goal") || text.includes("want") || text.includes("plan to")) {
    updatedProfile.goals.push({
      text: message,
      createdAt: Date.now()
    });
    identifiedIntent = true;
  }

  const nums = extractNumbers(text);
  if (!identifiedIntent && nums.length >= 2) {
    throw new Error("I see multiple numbers but I'm not sure how to categorize them. Could you clarify if they are income, expenses, or debt?");
  }
  
  if (!identifiedIntent && nums.length === 1) {
    throw new Error("I see a number but no clear category. Is this related to your income, expenses, or a specific asset/loan?");
  }

  updatedProfile.lastUpdated = Date.now();
  return updatedProfile;
}
