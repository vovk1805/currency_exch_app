(function initApp() {
  const state = {
    currency: "USD",
    amountText: "0",
    rates: RATES_FALLBACK,
  };

  const currencyRow = document.getElementById("currencyRow");
  const amountDisplay = document.getElementById("amountDisplay");
  const rateLine = document.getElementById("rateLine");
  const fxTitle = document.getElementById("fxTitle");
  const fxSummary = document.getElementById("fxSummary");
  const uahSummary = document.getElementById("uahSummary");
  const fxBills = document.getElementById("fxBills");
  const uahBills = document.getElementById("uahBills");
  const keypad = document.getElementById("keypad");

  function parseAmount() {
    const value = Number(state.amountText);
    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }
    return value;
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
        renderCurrencyChips();
        renderAll();
      });
      currencyRow.appendChild(button);
    }
  }

  function updateAmountDisplay() {
    amountDisplay.textContent = state.amountText;
  }

  function renderAll() {
    const amount = parseAmount();
    const rate = getRateToUah(state.rates, state.currency);
    const currencyMeta = CURRENCIES.find((item) => item.code === state.currency);
    const uahAmount = rate ? Math.floor(amount * rate) : 0;

    fxTitle.textContent = currencyMeta ? currencyMeta.name : state.currency;

    if (!rate) {
      rateLine.textContent = "Курс недоступний";
    } else {
      const sourceLabel =
        state.rates.source === "api"
          ? "онлайн"
          : state.rates.source === "cache"
            ? "з кешу"
            : "запасний";
      rateLine.textContent = `1 ${state.currency} = ${rate.toFixed(2).replace(".", ",")} UAH · ${state.rates.date} (${sourceLabel})`;
    }

    const fxParts = greedyBreakdown(amount, DENOMINATIONS[state.currency] || []);
    const uahParts = greedyBreakdown(uahAmount, DENOMINATIONS.UAH);

    if (amount > 0) {
      fxSummary.textContent =
        summarizeBreakdown(fxParts, state.currency) || formatMoney(Math.floor(amount), state.currency);
    } else {
      fxSummary.textContent = "—";
    }

    uahSummary.textContent =
      amount > 0 && rate ? `${uahAmount.toLocaleString("uk-UA")} ₴` : "—";

    renderBillGroups(fxBills, amount > 0 ? fxParts : [], state.currency);
    renderBillGroups(uahBills, amount > 0 && rate ? uahParts : [], "UAH");
    updateAmountDisplay();
  }

  function applyKey(key) {
    if (key === "clear") {
      state.amountText = "0";
      renderAll();
      return;
    }

    if (key === "back") {
      if (state.amountText.length <= 1) {
        state.amountText = "0";
      } else {
        state.amountText = state.amountText.slice(0, -1);
      }
      renderAll();
      return;
    }

    if (!/^\d$/.test(key)) {
      return;
    }

    if (state.amountText === "0") {
      state.amountText = key;
    } else if (state.amountText.length < 9) {
      state.amountText += key;
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

  renderCurrencyChips();
  renderAll();

  loadRates().then((rates) => {
    state.rates = rates;
    renderAll();
  });
})();
