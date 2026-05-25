/**
 * Utility mathematical validations for Brazilian e-commerce systems and anti-fraud checks
 */

/**
 * Validates credit card number correctness using Luhn's algorithm checksum digits
 */
export function isValidLuhn(cardNumber: string): boolean {
  const clean = cardNumber.replace(/\D/g, "");
  if (clean.length < 13 || clean.length > 22) return false;
  
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
}

/**
 * Validates Brazilian CPF numbers mathematically using primary and secondary checksum digits.
 * Rejects repeated duplicate patterns.
 */
export function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  
  // Reject identical numerals (e.g. 111.111.111-11, 222.222.222-22)
  if (/^(\d)\1{10}$/.test(clean)) return false;
  
  let sum = 0;
  let remainder;
  
  // First verification digit check
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10), 10)) return false;
  
  // Second verification digit check
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(clean.substring(i - 1, i), 10) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11), 10)) return false;
  
  return true;
}

/**
 * Detects card issuer banner based on typical IIN (Issuer Identification Number) prefix rules
 */
export function detectCardBrand(number: string): 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'unknown' {
  const clean = number.replace(/\D/g, "");
  if (!clean) return 'unknown';
  
  if (clean.startsWith('4')) return 'visa';
  if (/^(5[1-5]\d{2}|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[0-1]\d|2720)/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^(401178|431274|438935|451416|457393|457631|457632|504175|627780|636297|636368|650|651|652)/.test(clean)) return 'elo';
  if (/^(3841(0|4|6)0|606282)/.test(clean)) return 'hipercard';
  
  return 'unknown';
}
