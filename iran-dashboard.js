(function () {
  const data = window.IRAN_DASHBOARD_DATA;

  if (!data || !Array.isArray(data.rows)) {
    document.getElementById("segments").innerHTML = '<div class="empty">Dashboard data is not available.</div>';
    return;
  }

  const state = {
    search: "",
    sortKey: "totalScore",
    sortDirection: "desc",
    filter: "all",
    selectedTicker: data.rows[0]?.ticker || null
  };

  const elements = {
    generatedStamp: document.getElementById("generated-stamp"),
    coverageStamp: document.getElementById("coverage-stamp"),
    summaryCards: document.getElementById("summary-cards"),
    segmentNav: document.getElementById("segment-nav"),
    boardNote: document.getElementById("board-note"),
    segments: document.getElementById("segments"),
    detailTop: document.getElementById("detail-top"),
    sourceList: document.getElementById("source-list"),
    searchInput: document.getElementById("search-input"),
    sortSelect: document.getElementById("sort-select"),
    directionToggle: document.getElementById("direction-toggle"),
    filterButtons: Array.from(document.querySelectorAll("[data-filter]"))
  };

  bindEvents();
  render();

  function bindEvents() {
    elements.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value.trim().toLowerCase();
      render();
    });

    elements.sortSelect.addEventListener("change", (event) => {
      state.sortKey = event.target.value;
      render();
    });

    elements.directionToggle.addEventListener("click", () => {
      state.sortDirection = state.sortDirection === "desc" ? "asc" : "desc";
      elements.directionToggle.textContent = state.sortDirection === "desc" ? "Desc" : "Asc";
      render();
    });

    elements.filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        elements.filterButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
        render();
      });
    });

    elements.segments.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-select-ticker]");
      if (!trigger) {
        return;
      }
      state.selectedTicker = trigger.dataset.selectTicker;
      render();
    });
  }

  function render() {
    const filteredRows = getFilteredRows();
    const groupedRows = groupRows(filteredRows);
    const selectedRow = getSelectedRow(filteredRows);

    renderSummary(filteredRows, groupedRows);
    renderSegments(groupedRows);
    renderDetail(selectedRow);
  }

  function getFilteredRows() {
    return data.rows.filter((row) => {
      if (state.filter === "long" && !row.verdict.includes("LONG")) {
        return false;
      }
      if (state.filter === "short" && row.verdict !== "SHORT / HEDGE") {
        return false;
      }
      if (state.filter === "avoid" && row.verdict !== "AVOID") {
        return false;
      }

      if (!state.search) {
        return true;
      }

      const haystack = [
        row.ticker,
        row.name,
        row.segment,
        row.role,
        row.oneLiner,
        row.thesis,
        row.whyUnderfollowed
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(state.search);
    });
  }

  function groupRows(rows) {
    return data.segmentOrder
      .map((segment) => ({
        segment,
        rows: rows.filter((row) => row.segment === segment).sort(compareRows)
      }))
      .filter((group) => group.rows.length > 0);
  }

  function compareRows(left, right) {
    const leftValue = getSortValue(left, state.sortKey);
    const rightValue = getSortValue(right, state.sortKey);

    if (leftValue == null && rightValue == null) {
      return left.name.localeCompare(right.name);
    }
    if (leftValue == null) {
      return 1;
    }
    if (rightValue == null) {
      return -1;
    }

    if (typeof leftValue === "string" || typeof rightValue === "string") {
      const comparison = String(leftValue).localeCompare(String(rightValue));
      return state.sortDirection === "asc" ? comparison : -comparison;
    }

    const comparison = leftValue - rightValue;
    return state.sortDirection === "asc" ? comparison : -comparison;
  }

  function getSortValue(row, sortKey) {
    switch (sortKey) {
      case "torque":
        return row.torque;
      case "defensive":
        return row.defensive;
      case "discovery":
        return row.discovery;
      case "peaceDurability":
        return row.peaceDurability;
      case "warBeta":
        return row.warBeta;
      case "currentPrice":
        return row.currentPrice;
      case "ticker":
        return row.ticker;
      case "totalScore":
      default:
        return row.totalScore;
    }
  }

  function getSelectedRow(filteredRows) {
    const current = filteredRows.find((row) => row.ticker === state.selectedTicker);
    if (current) {
      return current;
    }

    const fallback = filteredRows[0] || data.rows[0] || null;
    state.selectedTicker = fallback ? fallback.ticker : null;
    return fallback;
  }

  function renderSummary(filteredRows, groupedRows) {
    const longs = filteredRows.filter((row) => row.verdict.includes("LONG"));
    const shorts = filteredRows.filter((row) => row.verdict === "SHORT / HEDGE");
    const avgTorque = average(filteredRows.map((row) => row.torque));
    const avgDurability = average(filteredRows.map((row) => row.peaceDurability));
    const hiddenCount = filteredRows.filter((row) => row.discovery >= 70 && row.verdict.includes("LONG")).length;

    elements.generatedStamp.textContent = `Snapshot ${formatDateTime(new Date(data.generatedAt))}`;
    elements.coverageStamp.textContent = `${filteredRows.length} of ${data.rows.length} ideas visible`;

    const cards = [
      {
        label: "Longs",
        value: formatNumber(longs.length),
        note: "Names that still make sense after removing the obvious oil beta."
      },
      {
        label: "Hidden Names",
        value: formatNumber(hiddenCount),
        note: "Longs with discovery score 70 or above."
      },
      {
        label: "Avg Torque",
        value: avgTorque == null ? "n/a" : `${avgTorque.toFixed(0)}/100`,
        note: "Upside if the market reprices LNG and gas bottlenecks harder."
      },
      {
        label: "Avg Early-Peace Durability",
        value: avgDurability == null ? "n/a" : `${avgDurability.toFixed(0)}/100`,
        note: `${shorts.length} hedge names remain available if the board needs protection.`
      }
    ];

    elements.summaryCards.innerHTML = cards.map((card) => `
      <article class="card">
        <span class="card-label">${escapeHtml(card.label)}</span>
        <span class="card-value">${escapeHtml(card.value)}</span>
        <p class="card-note">${escapeHtml(card.note)}</p>
      </article>
    `).join("");

    elements.segmentNav.innerHTML = groupedRows.map((group) => `
      <a class="segment-link" href="#segment-${slugify(group.segment)}">${escapeHtml(group.segment)} (${group.rows.length})</a>
    `).join("");

    elements.boardNote.textContent = `Scenario: ${data.scenario} Showing ${filteredRows.length} names across ${groupedRows.length} groups. Sort inside each group by ${prettySortKey(state.sortKey)}. Price snapshot date: ${data.priceDate}.`;
  }

  function renderSegments(groupedRows) {
    if (!groupedRows.length) {
      elements.segments.innerHTML = '<div class="empty">No ideas match the current filter.</div>';
      return;
    }

    elements.segments.innerHTML = groupedRows.map((group) => {
      const avgScore = average(group.rows.map((row) => row.totalScore));
      const avgDiscovery = average(group.rows.map((row) => row.discovery));
      const avgDurability = average(group.rows.map((row) => row.peaceDurability));

      return `
        <section class="segment-card" id="segment-${slugify(group.segment)}">
          <header class="segment-header">
            <div>
              <p class="eyebrow">Segment</p>
              <h2>${escapeHtml(group.segment)}</h2>
              <p class="segment-meta">${group.rows.length} names grouped here.</p>
            </div>
            <div class="segment-badges">
              <span class="badge">Avg score ${avgScore == null ? "n/a" : avgScore.toFixed(0)}</span>
              <span class="badge">Discovery ${avgDiscovery == null ? "n/a" : avgDiscovery.toFixed(0)}</span>
              <span class="badge">Peace durability ${avgDurability == null ? "n/a" : avgDurability.toFixed(0)}</span>
            </div>
          </header>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th class="sticky-col">Ticker / Company</th>
                  <th>Verdict</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Torque</th>
                  <th>Defensive</th>
                  <th>Discovery</th>
                  <th>Structural</th>
                  <th>Peace Durability</th>
                  <th>War Beta</th>
                  <th>Fragility</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                ${group.rows.map(renderRow).join("")}
              </tbody>
            </table>
          </div>
        </section>
      `;
    }).join("");
  }

  function renderRow(row) {
    const selected = row.ticker === state.selectedTicker;

    return `
      <tr class="${selected ? "is-selected" : ""}">
        <td class="sticky-col">
          <button class="idea-button" type="button" data-select-ticker="${escapeHtml(row.ticker)}">
            <span class="ticker-dot">${escapeHtml(row.ticker.slice(0, 4))}</span>
            <span class="identity">
              <span class="ticker">${escapeHtml(row.ticker)}</span>
              <span class="company">${escapeHtml(row.name)}</span>
              <span class="subcopy">${escapeHtml(row.segment)}</span>
            </span>
          </button>
        </td>
        <td>${renderVerdict(row.verdict)}</td>
        <td class="mono">${escapeHtml(formatPrice(row.currentPrice))}</td>
        <td>${renderScore(row.totalScore)}</td>
        <td>${renderMetric(row.torque)}</td>
        <td>${renderMetric(row.defensive)}</td>
        <td>${renderMetric(row.discovery)}</td>
        <td>${renderMetric(row.structural)}</td>
        <td>${renderMetric(row.peaceDurability)}</td>
        <td>${renderMetric(row.warBeta)}</td>
        <td>${renderMetric(100 - row.fragility)}</td>
        <td>${escapeHtml(row.role)}</td>
      </tr>
    `;
  }

  function renderDetail(row) {
    if (!row) {
      elements.detailTop.innerHTML = '<div class="empty">No row selected.</div>';
      elements.sourceList.innerHTML = "";
      return;
    }

    elements.detailTop.innerHTML = `
      <div class="detail-heading">
        <div>
          <p class="eyebrow">Selected Idea</p>
          <h2>${escapeHtml(row.ticker)}</h2>
          <p>${escapeHtml(row.name)} / ${escapeHtml(row.segment)}</p>
        </div>
        <div class="detail-links">
          <span class="${verdictClass(row.verdict)} verdict">${escapeHtml(row.verdict)}</span>
        </div>
      </div>
      <div class="detail-grid">
        <article class="detail-stat">
          <span class="label">Price</span>
          <span class="value">${escapeHtml(formatPrice(row.currentPrice))}</span>
          <span class="small">Snapshot ${escapeHtml(data.priceDate)}</span>
        </article>
        <article class="detail-stat">
          <span class="label">Portfolio Role</span>
          <span class="value">${escapeHtml(scoreWord(row.totalScore))}</span>
          <span class="small">${escapeHtml(row.role)}</span>
        </article>
        <article class="detail-stat">
          <span class="label">Early-Peace Durability</span>
          <span class="value">${escapeHtml(formatScore(row.peaceDurability))}</span>
          <span class="small">How much survives if the war ends quickly</span>
        </article>
        <article class="detail-stat">
          <span class="label">Torque / Discovery</span>
          <span class="value">${escapeHtml(formatScore(row.torque))} / ${escapeHtml(formatScore(row.discovery))}</span>
          <span class="small">Upside beta and underfollowed potential</span>
        </article>
        <article class="detail-stat">
          <span class="label">Structural / War Beta</span>
          <span class="value">${escapeHtml(formatScore(row.structural))} / ${escapeHtml(formatScore(row.warBeta))}</span>
          <span class="small">Duration beyond headlines and direct crisis sensitivity</span>
        </article>
        <article class="detail-stat">
          <span class="label">Fragility</span>
          <span class="value">${escapeHtml(formatScore(row.fragility))}</span>
          <span class="small">${escapeHtml(row.risk)}</span>
        </article>
      </div>
      <div class="detail-copy">
        <p class="note"><strong>Research view:</strong> ${escapeHtml(row.oneLiner)}</p>
        <p class="note"><strong>Thesis:</strong> ${escapeHtml(row.thesis)}</p>
        <p class="note"><strong>Why now:</strong> ${escapeHtml(row.whyNow)}</p>
        <p class="note"><strong>Why still underfollowed:</strong> ${escapeHtml(row.whyUnderfollowed)}</p>
        <p class="note"><strong>Invalidation:</strong> ${escapeHtml(row.invalidation)}</p>
      </div>
    `;

    elements.sourceList.innerHTML = (row.links || []).map((link) => `
      <li>
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
          ${escapeHtml(link.label)}
          <span>${escapeHtml(link.note || "")}</span>
        </a>
      </li>
    `).join("");
  }

  function renderVerdict(verdict) {
    return `<span class="${verdictClass(verdict)} verdict">${escapeHtml(verdict)}</span>`;
  }

  function verdictClass(verdict) {
    if (verdict === "CORE LONG") {
      return "verdict-core";
    }
    if (verdict === "TORQUE LONG") {
      return "verdict-torque";
    }
    if (verdict === "SHORT / HEDGE") {
      return "verdict-short";
    }
    return "verdict-avoid";
  }

  function renderScore(value) {
    return `
      <div class="score">
        <div class="score-bar"><div class="score-fill" style="width:${clamp(value, 0, 100)}%"></div></div>
        <span class="score-label">${escapeHtml(formatScore(value))}</span>
      </div>
    `;
  }

  function renderMetric(value) {
    const className = value >= 75 ? "metric-strong" : value >= 50 ? "metric-medium" : "metric-weak";
    return `<span class="metric-pill ${className}">${escapeHtml(formatScore(value))}</span>`;
  }

  function average(values) {
    const valid = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
    if (!valid.length) {
      return null;
    }
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
  }

  function formatDateTime(date) {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function formatPrice(value) {
    if (typeof value !== "number") {
      return "n/a";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: value < 10 ? 2 : 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatScore(value) {
    if (typeof value !== "number") {
      return "n/a";
    }
    return `${Math.round(value)}/100`;
  }

  function formatNumber(value) {
    if (typeof value !== "number") {
      return "n/a";
    }
    return new Intl.NumberFormat("en-US").format(value);
  }

  function scoreWord(value) {
    if (value >= 85) {
      return "High Conviction";
    }
    if (value >= 70) {
      return "Actionable";
    }
    if (value >= 50) {
      return "Tactical";
    }
    return "Avoid";
  }

  function prettySortKey(sortKey) {
    switch (sortKey) {
      case "peaceDurability":
        return "early-peace durability";
      case "warBeta":
        return "war beta";
      default:
        return sortKey.replace(/([A-Z])/g, " $1").toLowerCase();
    }
  }

  function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
