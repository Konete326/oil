const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertLessThanOneThousand(num) {
  let current = "";

  if (num % 100 < 20) {
    current = ONES[num % 100];
    num = Math.floor(num / 100);
  } else {
    const onesDigit = ONES[num % 10];
    current = onesDigit ? `${TENS[Math.floor((num % 100) / 10)]} ${onesDigit}` : TENS[Math.floor((num % 100) / 10)];
    num = Math.floor(num / 100);
  }

  if (num === 0) return current;
  return current ? `${ONES[num]} Hundred ${current}` : `${ONES[num]} Hundred`;
}

export function numberToWords(num) {
  if (num === 0 || !num) return "Zero Rupees Only";

  const numVal = Math.round(Number(num) || 0);
  if (numVal <= 0) return "Zero Rupees Only";

  let result = "";
  let remainder = numVal;

  if (Math.floor(remainder / 10000000) > 0) {
    const crore = Math.floor(remainder / 10000000);
    result += `${convertLessThanOneThousand(crore)} Crore `;
    remainder %= 10000000;
  }

  if (Math.floor(remainder / 100000) > 0) {
    const lakh = Math.floor(remainder / 100000);
    result += `${convertLessThanOneThousand(lakh)} Lakh `;
    remainder %= 100000;
  }

  if (Math.floor(remainder / 1000) > 0) {
    const thousand = Math.floor(remainder / 1000);
    result += `${convertLessThanOneThousand(thousand)} Thousand `;
    remainder %= 1000;
  }

  if (remainder > 0) {
    result += convertLessThanOneThousand(remainder);
  }

  return `${result.trim()} Rupees Only`;
}
