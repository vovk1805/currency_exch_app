(function initApp() {
  const state = {
    currency: 'USD',
    amountText: '0',
    discountText: '0',
    inputMode: 'amount',
    rates: RATES_FALLBACK,
  };

  const appRoot = document.getElementById("app");
  const currencyRow = document.getElementById("currencyRow");
  const amountLabel = document.getElementById('amountLabel');
  const amountDisplay = document.getElementById('amountDisplay');
  const rateLine = document.getElementById('rateLine');
  const fxTitle = document.getElementById('fxTitle');
  const fxSummary = document.getElementById('fxSummary');
  const uahTitle = document.getElementById('uahTitle');
  const uahSummary = document.getElementById('uahSummary');
  const discountLine = document.getElementById('discountLine');
  const finalLine = document.getElementById('finalLine');
  const fxBills = document.getElementById('fxBills');
  const uahBills = document.getElementById('uahBills');
  const keypad = document.getElementById('keypad');
  const discountBtn = document.getElementById("discountBtn");
  const discountClearBtn = document.getElementById("discountClearBtn");
  const payBtn = document.getElementById("payBtn");
  const freeBtn = document.getElementById("freeBtn");
  const payModal = document.getElementById("payModal");
  const payModalTitle = document.getElementById("payModalTitle");
  const payDoneBtn = document.getElementById("payDoneBtn");
  const payCloseBtn = document.getElementById("payCloseBtn");

  function getFinalPayAmount() {
    const amount = parsePositiveInt(state.amountText);
    const discount = parsePositiveInt(state.discountText);
    const rate = getRateToUah(state.rates, state.currency);
    const uahAmount = rate ? Math.floor(amount * rate) : 0;
    const appliedDiscount = Math.min(discount, uahAmount);
    return Math.max(0, uahAmount - appliedDiscount);
  }

  function openPayModal(titleText) {
    payModalTitle.textContent = titleText;
    payModal.hidden = false;
  }

  function closePayModalKeepState() {
    payModal.hidden = true;
  }

  function closePayModalAndReset() {
    payModal.hidden = true;
    resetToInitialState();
  }

  function parsePositiveInt(text) {
    const value = Number(text);
    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }
    return Math.floor(value);
  }

  function getActiveText() {
    return state.inputMode === 'discount' ? state.discountText : state.amountText;
  }

  function setActiveText(value) {
    if (state.inputMode === 'discount') {
      state.discountText = value;
    } else {
      state.amountText = value;
    }
  }

  function renderCurrencyChips() {
    currencyRow.innerHTML = '';
    for (const currency of CURRENCIES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'currency-chip';
      button.setAttribute('role', 'option');
      button.dataset.code = currency.code;
      if (currency.code === state.currency) {
        button.classList.add('selected');
        button.setAttribute('aria-selected', 'true');
      } else {
        button.setAttribute('aria-selected', 'false');
      }
      button.innerHTML = `<span>${currency.code}</span><span class="sym">${currency.symbol}</span>`;
      button.addEventListener('click', () => {
        state.currency = currency.code;
        if (state.inputMode === 'discount') {
          exitDiscountMode();
        }
        renderCurrencyChips();
        renderAll();
      });
      currencyRow.appendChild(button);
    }
  }

  function exitDiscountMode() {
    state.inputMode = 'amount';
    discountBtn.classList.remove('active');
  }

  function enterDiscountMode() {
    state.inputMode = 'discount';
    if (state.discountText === '0') {
      state.discountText = '0';
    }
    discountBtn.classList.add('active');
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

    discountClearBtn.hidden = !(hasDiscount || state.inputMode === 'discount');
    discountBtn.classList.toggle('active', state.inputMode === 'discount');

    renderBillGroups(fxBills, amount > 0 ? fxParts : [], state.currency);
    renderBillGroups(uahBills, amount > 0 && rate ? uahParts : [], 'UAH');
    updateAmountDisplay();
  }

  function resetToInitialState() {
    state.currency = "USD";
    state.amountText = "0";
    state.discountText = "0";
    state.inputMode = "amount";
    discountBtn.classList.remove("active");
    renderCurrencyChips();
    renderAll();
  }

  function applyKey(key) {
    let text = getActiveText();

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

  keypad.addEventListener('click', (event) => {
    const button = event.target.closest('[data-key]');
    if (!button) {
      return;
    }
    applyKey(button.dataset.key);
  });

  discountBtn.addEventListener('click', () => {
    if (state.inputMode === 'discount') {
      exitDiscountMode();
    } else {
      enterDiscountMode();
    }
    renderAll();
  });

  discountClearBtn.addEventListener("click", () => {
    state.discountText = "0";
    exitDiscountMode();
    renderAll();
  });

  payBtn.addEventListener("click", () => {
    openPayModal(`Оплата: ${formatUaInt(getFinalPayAmount())} ₴`);
  });

  freeBtn.addEventListener("click", () => {
    openPayModal("Оплата: БЕЗКОШТОВНО");
  });

  payCloseBtn.addEventListener("click", () => {
    closePayModalKeepState();
  });

  payDoneBtn.addEventListener("click", () => {
    closePayModalAndReset();
  });

  renderCurrencyChips();
  renderAll();

  loadRates().then((rates) => {
    state.rates = rates;
    renderAll();
  });
})();
