/**
 * Format number according to Indian numeral system
 * Examples: 1,00,000 (1 lakh), 10,00,000 (10 lakh), 1,00,00,000 (1 crore)
 */
export function formatIndianCurrency(num: number): string {
  const numStr = Math.abs(num).toFixed(2);
  const [integerPart, decimalPart] = numStr.split('.');
  
  // Handle numbers less than 1000
  if (integerPart.length <= 3) {
    return `${num < 0 ? '-' : ''}${integerPart}.${decimalPart}`;
  }
  
  // Split into last 3 digits and remaining
  const lastThree = integerPart.slice(-3);
  const remaining = integerPart.slice(0, -3);
  
  // Add commas every 2 digits for the remaining part (Indian system)
  let formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  formatted = `${formatted},${lastThree}`;
  
  return `${num < 0 ? '-' : ''}${formatted}.${decimalPart}`;
}

/**
 * Format as currency with ₹ symbol
 */
export function formatINR(num: number): string {
  return `₹${formatIndianCurrency(num)}`;
}

/**
 * Ensure value is a number
 */
export function toNumber(value: any): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}