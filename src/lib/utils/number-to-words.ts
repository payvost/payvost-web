/**
 * Convert a number to words (e.g., 1234.56 -> "One Thousand Two Hundred Thirty-Four and 56/100")
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

function convertHundreds(num: number): string {
  let result = '';
  
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred';
    num %= 100;
    if (num > 0) result += ' ';
  }
  
  if (num >= 20) {
    result += tens[Math.floor(num / 10)];
    num %= 10;
    if (num > 0) result += '-' + ones[num];
  } else if (num > 0) {
    result += ones[num];
  }
  
  return result;
}

function convertNumber(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Negative ' + convertNumber(-num);
  
  let result = '';
  let scaleIndex = 0;
  
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkWords = convertHundreds(chunk);
      if (scaleIndex > 0) {
        result = chunkWords + ' ' + scales[scaleIndex] + (result ? ' ' + result : '');
      } else {
        result = chunkWords + (result ? ' ' + result : '');
      }
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }
  
  return result;
}

export function numberToWords(amount: number, currency: string = 'USD'): string {
  const currencyNames: { [key: string]: { singular: string; plural: string } } = {
    USD: { singular: 'Dollar', plural: 'Dollars' },
    EUR: { singular: 'Euro', plural: 'Euros' },
    GBP: { singular: 'Pound', plural: 'Pounds' },
    NGN: { singular: 'Naira', plural: 'Naira' },
  };
  
  const currencyInfo = currencyNames[currency.toUpperCase()] || { singular: currency, plural: currency };
  
  const wholePart = Math.floor(amount);
  const fractionalPart = Math.round((amount - wholePart) * 100);
  
  let result = convertNumber(wholePart);
  
  // Add currency
  if (wholePart === 1) {
    result += ' ' + currencyInfo.singular;
  } else {
    result += ' ' + currencyInfo.plural;
  }
  
  // Add cents/decimals
  if (fractionalPart > 0) {
    result += ' and ' + fractionalPart + '/100';
  } else {
    result += ' Only';
  }
  
  return result;
}

