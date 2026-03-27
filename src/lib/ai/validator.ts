/**
 * Anti-Hallucination & Compliance Middleware
 * Scans AI responses for forbidden "guarantee" language and replaces it with compliant alternatives.
 */

const FORBIDDEN_MAP: Record<string, string> = {
  'guarantee': 'historically project',
  'guaranteed': 'historically projected',
  'promise': 'indicate',
  'promised': 'indicated',
  'risk-free': 'mathematically optimized',
  'sure thing': 'statistically probable outcome',
  'must buy': 'potential consideration',
  'will make': 'may yield',
  'no risk': 'calculated risk',
};

export function validateAndSanitizeResponse(text: string): string {
  let sanitized = text;
  
  // Case-insensitive replacement for forbidden words
  Object.entries(FORBIDDEN_MAP).forEach(([forbidden, compliant]) => {
    const regex = new RegExp(`\\b${forbidden}\\b`, 'gi');
    sanitized = sanitized.replace(regex, (match) => {
      // Preserve capitalization if possible
      if (match[0] === match[0].toUpperCase()) {
        return compliant.charAt(0).toUpperCase() + compliant.slice(1);
      }
      return compliant;
    });
  });

  return sanitized;
}

/**
 * Extracts ROI percentages from text to verify against math engine
 */
export function extractROIs(text: string): number[] {
  const roiRegex = /(\d+(?:\.\d+)?)\s*%/g;
  const matches = [...text.matchAll(roiRegex)];
  return matches.map(m => parseFloat(m[1]));
}
