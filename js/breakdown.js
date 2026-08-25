const MAX_VISIBLE_BILLS = 14;

function greedyBreakdown(amount, denominations) {
  let remaining = Math.floor(Math.max(0, amount));
  const parts = [];

  for (const denom of denominations) {
    if (remaining < denom) {
      continue;
    }
    const count = Math.floor(remaining / denom);
    parts.push({ denom, count });
    remaining = remaining - count * denom;
  }

  return parts;
}

function summarizeBreakdown(parts, code) {
  if (!parts.length) {
    return '—';
  }

  const pieces = [];
  for (const part of parts) {
    pieces.push(`${formatUaInt(part.count)} × ${formatMoney(part.denom, code)}`);
  }
  return pieces.join('  ·  ');
}

function buildVisualPlan(parts) {
  const visual = [];
  let remainingSlots = MAX_VISIBLE_BILLS;
  let truncated = false;

  for (const part of parts) {
    if (remainingSlots <= 0) {
      truncated = true;
      break;
    }

    const showCount = Math.min(part.count, remainingSlots);
    visual.push({
      denom: part.denom,
      count: part.count,
      showCount,
      compact: part.count > showCount || part.count > 4,
    });
    remainingSlots -= showCount === 1 && part.count > 4 ? 1 : showCount;

    if (part.count > showCount) {
      truncated = true;
    }
  }

  return { visual, truncated };
}

const PLACEHOLDER_COLORS = Object.fromEntries(
  Object.entries(CURRENCY_COLORS).map(([code, colors]) => [code, [colors.from, colors.to]]),
);

function createPlaceholder(code, denom) {
  const placeholder = document.createElement('div');
  placeholder.className = 'bill-placeholder';
  const colors = PLACEHOLDER_COLORS[code] || ['#4a5d75', '#2a3850'];
  placeholder.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
  placeholder.textContent = formatMoney(denom, code);
  return placeholder;
}

function createBillImage(code, denom) {
  const img = document.createElement('img');
  img.className = 'bill-img';
  img.alt = `${denom} ${code}`;
  img.loading = 'lazy';

  const mapped = typeof BANKNOTE_ASSETS !== 'undefined' ? BANKNOTE_ASSETS[`${code}:${denom}`] : null;

  if (mapped) {
    img.src = mapped;
    img.onerror = () => {
      img.replaceWith(createPlaceholder(code, denom));
    };
    return img;
  }

  let extIndex = 0;
  const tryNext = () => {
    if (extIndex >= BANKNOTE_EXTS.length) {
      img.replaceWith(createPlaceholder(code, denom));
      return;
    }
    const ext = BANKNOTE_EXTS[extIndex];
    extIndex += 1;
    img.src = `assets/banknotes/${code}/${denom}.${ext}`;
  };
  img.onerror = tryNext;
  tryNext();
  return img;
}

function renderBillGroups(container, parts, code) {
  container.innerHTML = '';

  if (!parts.length) {
    const hint = document.createElement('div');
    hint.className = 'empty-hint';
    hint.textContent = 'Введіть суму';
    container.appendChild(hint);
    return { truncated: false };
  }

  const { visual, truncated } = buildVisualPlan(parts);

  for (const item of visual) {
    const group = document.createElement('div');
    group.className = 'bill-group';

    const label = document.createElement('div');
    label.className = 'count-label';
    label.textContent = `${formatUaInt(item.count)} × ${formatMoney(item.denom, code)}`;
    group.appendChild(label);

    const stack = document.createElement('div');
    stack.className = 'bill-stack';

    if (item.compact) {
      const img = createBillImage(code, item.denom);
      img.classList.add('compact');
      stack.appendChild(img);
    } else {
      for (let i = 0; i < item.showCount; i += 1) {
        stack.appendChild(createBillImage(code, item.denom));
      }
    }

    group.appendChild(stack);
    container.appendChild(group);
  }

  if (truncated) {
    const note = document.createElement('div');
    note.className = 'empty-hint';
    note.textContent = '≈ приблизний вигляд (точна сума вище)';
    container.appendChild(note);
  }

  return { truncated };
}
