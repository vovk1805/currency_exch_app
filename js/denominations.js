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

const DENOMINATIONS = {
  USD: [100, 50, 20, 10, 5, 1],
  EUR: [500, 200, 100, 50, 20, 10, 5],
  GBP: [50, 20, 10, 5],
  PLN: [500, 200, 100, 50, 20, 10],
  CHF: [1000, 200, 100, 50, 20, 10],
  CZK: [5000, 2000, 1000, 500, 200, 100],
  TRY: [200, 100, 50, 20, 10, 5],
  CAD: [100, 50, 20, 10, 5],
  JPY: [10000, 5000, 2000, 1000],
  CNY: [100, 50, 20, 10, 5, 1],
  UAH: [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1],
};

function formatMoney(amount, code) {
  const currency = CURRENCIES.find((item) => item.code === code);
  const symbol = currency ? currency.symbol : code;
  const formatted = Number(amount).toLocaleString("uk-UA");
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
