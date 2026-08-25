const CURRENCIES = [
  { code: "USD", symbol: "$", name: "Долар США" },
  { code: "EUR", symbol: "€", name: "Євро" },
  { code: "GBP", symbol: "£", name: "Фунт стерлінгів" },
  { code: "PLN", symbol: "zł", name: "Польський злотий" },
  { code: "CHF", symbol: "Fr", name: "Швейцарський франк" },
  { code: "CZK", symbol: "Kč", name: "Чеська крона" },
  { code: "TRY", symbol: "₺", name: "Турецька ліра" },
  { code: "CAD", symbol: "C$", name: "Канадський долар" },
  { code: "JPY", symbol: "¥", name: "Японська єна" },
  { code: "CNY", symbol: "¥", name: "Китайський юань" },
];

const CURRENCY_COLORS = {
  USD: { from: "#1f8a4c", to: "#0d5c32", accent: "#1f8a4c" },
  EUR: { from: "#2f6db5", to: "#003399", accent: "#2f6db5" },
  GBP: { from: "#6b3fa0", to: "#4a2775", accent: "#6b3fa0" },
  PLN: { from: "#dc143c", to: "#9e0b2a", accent: "#dc143c" },
  CHF: { from: "#d52b1e", to: "#8f1a12", accent: "#d52b1e" },
  CZK: { from: "#0b6e4f", to: "#084c37", accent: "#0b6e4f" },
  TRY: { from: "#e30a17", to: "#9b0710", accent: "#e30a17" },
  CAD: { from: "#ff0000", to: "#b00000", accent: "#d40000" },
  JPY: { from: "#bc002d", to: "#7a001d", accent: "#bc002d" },
  CNY: { from: "#de2910", to: "#8f1a0a", accent: "#de2910" },
  UAH: { from: "#0057b8", to: "#ffd700", accent: "#0057b8" },
};

const DENOMINATIONS = {
  USD: [100, 50, 20, 10, 5, 1],
  EUR: [500, 200, 100, 50, 20, 10, 5],
  GBP: [50, 20, 10, 5],
  PLN: [500, 200, 100, 50, 20, 10],
  CHF: [1000, 200, 100, 50, 20, 10],
  CZK: [5000, 2000, 1000, 500, 200, 100, 50, 20, 10],
  TRY: [200, 100, 50, 20, 10, 5],
  CAD: [100, 50, 20, 10, 5],
  JPY: [10000, 5000, 2000, 1000],
  CNY: [100, 50, 20, 10, 5, 1],
  UAH: [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1],
};

function formatUaInt(value) {
  const number = Math.floor(Number(value) || 0);
  return number.toLocaleString("uk-UA");
}

function formatUaDecimal(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0," + "0".repeat(digits);
  }
  return number.toLocaleString("uk-UA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMoney(amount, code) {
  const currency = CURRENCIES.find((item) => item.code === code);
  const symbol = currency ? currency.symbol : code;
  const formatted = formatUaInt(amount);
  if (code === "UAH") {
    return `${formatted} ₴`;
  }
  return `${formatted} ${symbol}`;
}

function banknotePath(code, denom) {
  const key = `${code}:${denom}`;
  if (typeof BANKNOTE_ASSETS !== "undefined" && BANKNOTE_ASSETS[key]) {
    return BANKNOTE_ASSETS[key];
  }
  return `assets/banknotes/${code}/${denom}.jpg`;
}

const BANKNOTE_EXTS = ["jpg", "jpeg", "png", "webp"];
