(function initApp() {
  const NFC_ICON = "assets/icons/nfc.jpg";
  const DISCOUNT_ICON = "assets/icons/discount.jpg";

  const state = {
    currency: "USD",
    amountText: "0",
    discountText: "0",
    phoneDigits: "",
    lotteryDiscount: null,
    pendingLotteryDiscount: null,
    modalMode: null,
    inputMode: "amount",
    rates: RATES_FALLBACK,
  };

  const appRoot = document.getElementById("app");
  const currencyRow = document.getElementById("currencyRow");
  const amountLabel = document.getElementById("amountLabel");
  const amountDisplay = document.getElementById("amountDisplay");
  const rateLine = document.getElementById("rateLine");
  const fxTitle = document.getElementById("fxTitle");
  const fxSummary = document.getElementById("fxSummary");
  const uahTitle = document.getElementById("uahTitle");
  const uahSummary = document.getElementById("uahSummary");
  const discountLine = document.getElementById("discountLine");
  const finalLine = document.getElementById("finalLine");
  const fxBills = document.getElementById("fxBills");
  const uahBills = document.getElementById("uahBills");
  const keypad = document.getElementById("keypad");
  const discountBtn = document.getElementById("discountBtn");
  const lotteryBtn = document.getElementById("lotteryBtn");
  const phoneBtn = document.getElementById("phoneBtn");
  const payBtn = document.getElementById("payBtn");
  const freeBtn = document.getElementById("freeBtn");
  const payModal = document.getElementById("payModal");
  const payModalIcon = document.getElementById("payModalIcon");
  const payModalTitle = document.getElementById("payModalTitle");
  const payDoneBtn = document.getElementById("payDoneBtn");
  const payCloseBtn = document.getElementById("payCloseBtn");
  const phoneModal = document.getElementById("phoneModal");
  const phoneDisplay = document.getElementById("phoneDisplay");
  const phoneKeypad = document.getElementById("phoneKeypad");
  const phoneCloseBtn = document.getElementById("phoneCloseBtn");
  const phoneDoneBtn = document.getElementById("phoneDoneBtn");

  function formatUaPhone(digits) {
    const d = String(digits || "").replace(/\D/g, "").slice(0, 9);
    let out = "+380-(";
    out += d.slice(0, 2);
    if (d.length < 2) {
      return out;
    }
    out += `)-${d.slice(2, 4)}`;
    if (d.length < 4) {
      return out;
    }
    out += `-${d.slice(4, 6)}`;
    if (d.length < 6) {
      return out;
    }
    out += `-${d.slice(6, 9)}`;
    return out;
  }

  function updatePhoneDisplay() {
    phoneDisplay.textContent = formatUaPhone(state.phoneDigits);
  }

  function openPhoneModal() {
    updatePhoneDisplay();
    phoneModal.hidden = false;
  }

  function closePhoneModal() {
    phoneModal.hidden = true;
  }

  function applyPhoneKey(key) {
    if (key === "clear") {
      state.phoneDigits = "";
      updatePhoneDisplay();
      return;
    }

    if (key === "back") {
      state.phoneDigits = state.phoneDigits.slice(0, -1);
      updatePhoneDisplay();
      return;
    }

    if (!/^\d$/.test(key) || state.phoneDigits.length >= 9) {
      return;
    }

    state.phoneDigits += key;
    updatePhoneDisplay();
  }

  function parsePositiveInt(text) {
    const value = Number(text);
    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }
    return Math.floor(value);
  }

  function randomLotteryDiscount() {
    return Math.floor(Math.random() * (400 - 50 + 1)) + 50;
  }

  function getFinalPayAmount() {
    const amount = parsePositiveInt(state.amountText);
    const discount = parsePositiveInt(state.discountText);
    const rate = getRateToUah(state.rates, state.currency);
    const uahAmount = rate ? Math.floor(amount * rate) : 0;
    const appliedDiscount = Math.min(discount, uahAmount);
    return Math.max(0, uahAmount - appliedDiscount);
  }

  function openModal(options) {
    state.modalMode = options.mode;
    state.pendingLotteryDiscount = options.pendingLotteryDiscount || null;
    payModalIcon.src = options.icon;
    payModalIcon.alt = options.iconAlt || "";
    payModalTitle.textContent = options.title;
    payDoneBtn.textContent =
      options.mode === "lottery" ? "Застосувати знижку" : "Готово";
    payModal.hidden = false;
  }

  function closePayModalKeepState() {
    state.modalMode = null;
    state.pendingLotteryDiscount = null;
    payModal.hidden = true;
  }

  function closePayModalAndReset() {
    state.modalMode = null;
    state.pendingLotteryDiscount = null;
    payModal.hidden = true;
    resetToInitialState();
  }

  function getActiveText() {
    return state.inputMode === "discount" ? state.discountText : state.amountText;
  }

  function setActiveText(value) {
    if (state.inputMode === "discount") {
      state.discountText = value;
    } else {
      state.amountText = value;
    }
  }

  function renderCurrencyChips() {
    currencyRow.innerHTML = "";
    for (const currency of CURRENCIES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "currency-chip";
      button.setAttribute("role", "option");
      button.dataset.code = currency.code;
      if (currency.code === state.currency) {
        button.classList.add("selected");
        button.setAttribute("aria-selected", "true");
      } else {
        button.setAttribute("aria-selected", "false");
      }
      button.innerHTML = `<span>${currency.code}</span><span class="sym">${currency.symbol}</span>`;
      button.addEventListener("click", () => {
        state.currency = currency.code;
        if (state.inputMode === "discount") {
          exitDiscountMode();
        }
        renderCurrencyChips();
        renderAll();
      });
      currencyRow.appendChild(button);
    }
  }

  function exitDiscountMode() {
    state.inputMode = "amount";
    discountBtn.classList.remove("active");
  }

  function enterDiscountMode() {
    state.inputMode = "discount";
    discountBtn.classList.add("active");
  }

  function applyRememberedLotteryDiscount() {
    if (typeof state.lotteryDiscount !== "number") {
      return false;
    }
    state.discountText = String(state.lotteryDiscount);
    exitDiscountMode();
    return true;
  }

  function updateAmountDisplay() {
    const activeText = getActiveText();
    amountDisplay.textContent = formatUaInt(parsePositiveInt(activeText));
    if (state.inputMode === "discount") {
      amountLabel.textContent = "Знижка (UAH)";
      amountDisplay.classList.add("discount-mode");
    } else {
      amountLabel.textContent = "Сума";
      amountDisplay.classList.remove("discount-mode");
    }
  }

  function applyCurrencyTheme(code) {
    const colors = CURRENCY_COLORS[code] || CURRENCY_COLORS.USD;
    appRoot.style.setProperty("--fx-from", colors.from);
    appRoot.style.setProperty("--fx-to", colors.to);
    appRoot.style.setProperty("--fx-accent", colors.accent);
    appRoot.dataset.currency = code;
  }

  function renderAll() {
    const amount = parsePositiveInt(state.amountText);
    const discount = parsePositiveInt(state.discountText);
    const rate = getRateToUah(state.rates, state.currency);
    const currencyMeta = CURRENCIES.find((item) => item.code === state.currency);
    const uahAmount = rate ? Math.floor(amount * rate) : 0;
    const appliedDiscount = Math.min(discount, uahAmount);
    const finalAmount = Math.max(0, uahAmount - appliedDiscount);
    const hasDiscount = discount > 0 && uahAmount > 0;

    applyCurrencyTheme(state.currency);

    fxTitle.textContent = currencyMeta ? currencyMeta.name : state.currency;

    if (!rate) {
      rateLine.textContent = "Курс недоступний";
    } else {
      rateLine.textContent = `1 ${state.currency} = ${formatUaDecimal(rate, 2)} UAH`;
    }

    const fxParts = greedyBreakdown(amount, DENOMINATIONS[state.currency] || []);
    const billAmount = hasDiscount ? finalAmount : uahAmount;
    const uahParts = greedyBreakdown(billAmount, DENOMINATIONS.UAH);

    if (amount > 0) {
      fxSummary.textContent =
        summarizeBreakdown(fxParts, state.currency) || formatMoney(Math.floor(amount), state.currency);
    } else {
      fxSummary.textContent = "—";
    }

    uahTitle.textContent = "До сплати в UAH";
    uahSummary.textContent = amount > 0 && rate ? `${formatUaInt(uahAmount)} ₴` : "—";

    if (hasDiscount) {
      discountLine.hidden = false;
      finalLine.hidden = false;
      discountLine.textContent = `Знижка: −${formatUaInt(appliedDiscount)} ₴`;
      finalLine.textContent = `Фінальна сума (зі знижкою): ${formatUaInt(finalAmount)} ₴`;
    } else {
      discountLine.hidden = true;
      finalLine.hidden = true;
    }

    discountBtn.classList.toggle("active", state.inputMode === "discount");

    renderBillGroups(fxBills, amount > 0 ? fxParts : [], state.currency);
    renderBillGroups(uahBills, amount > 0 && rate ? uahParts : [], "UAH");
    updateAmountDisplay();
  }

  function resetToInitialState() {
    state.currency = "USD";
    state.amountText = "0";
    state.discountText = "0";
    state.phoneDigits = "";
    state.lotteryDiscount = null;
    state.pendingLotteryDiscount = null;
    state.modalMode = null;
    state.inputMode = "amount";
    discountBtn.classList.remove("active");
    updatePhoneDisplay();
    renderCurrencyChips();
    renderAll();
  }

  function applyKey(key) {
    const text = getActiveText();

    if (key === "clear") {
      resetToInitialState();
      return;
    }

    if (key === "back") {
      if (text.length <= 1) {
        setActiveText("0");
      } else {
        setActiveText(text.slice(0, -1));
      }
      renderAll();
      return;
    }

    if (!/^\d$/.test(key)) {
      return;
    }

    if (text === "0") {
      setActiveText(key);
    } else if (text.length < 9) {
      setActiveText(text + key);
    }

    renderAll();
  }

  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (!button) {
      return;
    }
    applyKey(button.dataset.key);
  });

  discountBtn.addEventListener("click", () => {
    if (applyRememberedLotteryDiscount()) {
      renderAll();
      return;
    }

    if (state.inputMode === "discount") {
      exitDiscountMode();
    } else {
      enterDiscountMode();
    }
    renderAll();
  });

  lotteryBtn.addEventListener("click", () => {
    const value = randomLotteryDiscount();
    openModal({
      mode: "lottery",
      icon: DISCOUNT_ICON,
      iconAlt: "Знижка",
      title: `Знижка: ${formatUaInt(value)}`,
      pendingLotteryDiscount: value,
    });
  });

  phoneBtn.addEventListener("click", () => {
    openPhoneModal();
  });

  phoneKeypad.addEventListener("click", (event) => {
    const button = event.target.closest("[data-phone-key]");
    if (!button) {
      return;
    }
    applyPhoneKey(button.dataset.phoneKey);
  });

  phoneCloseBtn.addEventListener("click", () => {
    closePhoneModal();
  });

  phoneDoneBtn.addEventListener("click", () => {
    closePhoneModal();
  });

  payBtn.addEventListener("click", () => {
    openModal({
      mode: "pay",
      icon: NFC_ICON,
      iconAlt: "NFC",
      title: `Оплата: ${formatUaInt(getFinalPayAmount())} ₴`,
    });
  });

  freeBtn.addEventListener("click", () => {
    openModal({
      mode: "free",
      icon: NFC_ICON,
      iconAlt: "NFC",
      title: "Оплата: БЕЗКОШТОВНО",
    });
  });

  payCloseBtn.addEventListener("click", () => {
    closePayModalKeepState();
  });

  payDoneBtn.addEventListener("click", () => {
    if (state.modalMode === "lottery") {
      state.lotteryDiscount = state.pendingLotteryDiscount;
      state.pendingLotteryDiscount = null;
      state.modalMode = null;
      payModal.hidden = true;
      applyRememberedLotteryDiscount();
      renderAll();
      return;
    }

    closePayModalAndReset();
  });

  renderCurrencyChips();
  renderAll();

  loadRates().then((rates) => {
    state.rates = rates;
    renderAll();
  });
})();
