(function () {
  const data = window.IRAN_DASHBOARD_DATA;

  if (!data || !Array.isArray(data.rows)) {
    document.getElementById("segments").innerHTML = '<div class="empty">Dashboard data is not available.</div>';
    return;
  }

  const NEW_TICKERS = new Set(["EQT","AR","TRGP","LEU","CCJ","BTU","CEIX","EQNR","LSB","STNG","FRO","ZIM","RTX","PANW"]);

  const state = {
    search: "",
    sortKey: "totalScore",
    sortDirection: "desc",
    filter: "all",
    segmentFilter: "all",
    showHeatmap: false,
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
    chartHost: document.getElementById("chart-host"),
    sourceList: document.getElementById("source-list"),
    searchInput: document.getElementById("search-input"),
    sortSelect: document.getElementById("sort-select"),
    directionToggle: document.getElementById("direction-toggle"),
    filterButtons: Array.from(document.querySelectorAll("[data-filter]")),
    segmentFilter: document.getElementById("segment-filter"),
    heatmapToggle: document.getElementById("heatmap-toggle")
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

    elements.segmentFilter.innerHTML = '<option value="all">All Segments</option>' +
      data.segmentOrder.map((seg) => `<option value="${escapeHtml(seg)}">${escapeHtml(seg)}</option>`).join("");

    elements.segmentFilter.addEventListener("change", (event) => {
      state.segmentFilter = event.target.value;
      render();
    });

    elements.heatmapToggle.addEventListener("click", () => {
      state.showHeatmap = !state.showHeatmap;
      elements.heatmapToggle.classList.toggle("active", state.showHeatmap);
      render();
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
      if (state.segmentFilter !== "all" && row.segment !== state.segmentFilter) {
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
      case "structural":
        return row.structural;
      case "peaceDurability":
        return row.peaceDurability;
      case "warBeta":
        return row.warBeta;
      case "fragility":
        return row.fragility;
      case "relativeStrength":
        return row.relativeStrength;
      case "oneYearReturn":
        return row.marketMetrics?.oneYearReturn;
      case "currentPrice":
        return row.marketMetrics?.currentPrice ?? row.currentPrice;
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
    const liveCount = filteredRows.filter((row) => row.marketDataStatus === "ok").length;
    const avgOneYear = average(filteredRows.map((row) => row.marketMetrics?.oneYearReturn));

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
      },
      {
        label: "Avg 1Y Return",
        value: avgOneYear == null ? "n/a" : formatPercent(avgOneYear),
        note: `${liveCount} names have live price history powering RS and SMA metrics.`
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

  function renderHeatmap(filteredRows) {
    const sorted = filteredRows.slice().sort((a, b) => b[state.sortKey] - a[state.sortKey] || b.totalScore - a.totalScore);
    return `
      <div class="heatmap">
        ${sorted.map((row) => {
          const val = getSortValue(row, state.sortKey);
          const cls = val >= 75 ? "h-strong" : val >= 50 ? "h-medium" : val >= 25 ? "h-neutral" : "h-weak";
          const isNew = NEW_TICKERS.has(row.ticker);
          return `
            <div class="heatmap-cell ${cls}" data-select-ticker="${escapeHtml(row.ticker)}" title="${escapeHtml(row.name)} — ${escapeHtml(row.segment)}">
              <span class="h-ticker">${escapeHtml(row.ticker)}${isNew ? '<span class="badge-new" style="margin-left:3px;font-size:7px;">NEW</span>' : ''}</span>
              <span class="h-score">${val != null ? Math.round(val) : "n/a"}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderSegments(groupedRows) {
    if (!groupedRows.length) {
      elements.segments.innerHTML = '<div class="empty">No ideas match the current filter.</div>';
      return;
    }

    const allFiltered = groupedRows.flatMap((g) => g.rows);
    const heatmapHtml = state.showHeatmap ? renderHeatmap(allFiltered) : "";

    elements.segments.innerHTML = heatmapHtml + groupedRows.map((group) => {
      const avgScore = average(group.rows.map((row) => row.totalScore));
      const avgDiscovery = average(group.rows.map((row) => row.discovery));
      const avgDurability = average(group.rows.map((row) => row.peaceDurability));

      const newCount = group.rows.filter((row) => NEW_TICKERS.has(row.ticker)).length;
      const newLabel = newCount > 0 ? ` <span class="badge-new">${newCount} NEW</span>` : "";

      return `
        <section class="segment-card" id="segment-${slugify(group.segment)}">
          <header class="segment-header">
            <div>
              <p class="eyebrow">Segment</p>
              <h2>${escapeHtml(group.segment)}${newLabel}</h2>
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
                  <th>Price</th>
                  <th>Verdict</th>
                  <th>Chart 1Y</th>
                  <th>1M</th>
                  <th>YTD</th>
                  <th>1Y</th>
                  <th>High Gap</th>
                  <th>RS</th>
                  <th>20D</th>
                  <th>50D</th>
                  <th>200D</th>
                  <th>Total</th>
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
    const isNew = NEW_TICKERS.has(row.ticker);

    return `
      <tr class="${selected ? "is-selected" : ""}">
        <td class="sticky-col">
          <button class="idea-button" type="button" data-select-ticker="${escapeHtml(row.ticker)}">
            <span class="ticker-dot">${escapeHtml(row.ticker.slice(0, 4))}</span>
            <span class="identity">
              <span class="ticker">${escapeHtml(row.ticker)}${isNew ? '<span class="badge-new">NEW</span>' : ''}</span>
              <span class="company">${escapeHtml(row.name)}</span>
              <span class="subcopy">${escapeHtml(row.segment)}</span>
            </span>
          </button>
        </td>
        <td class="mono">${escapeHtml(formatPrice(row.marketMetrics?.currentPrice ?? row.currentPrice))}</td>
        <td>${renderVerdict(row.verdict)}</td>
        <td>${renderSparkline(row.marketMetrics?.sparkline)}</td>
        <td>${renderMetricPill(row.marketMetrics?.oneMonthReturn)}</td>
        <td>${renderMetricPill(row.marketMetrics?.ytdReturn)}</td>
        <td>${renderMetricPill(row.marketMetrics?.oneYearReturn)}</td>
        <td>${renderMetricPill(row.marketMetrics?.distanceFromHigh, { invert: true })}</td>
        <td>${renderStrength(row.relativeStrength)}</td>
        <td>${renderTrend(row.marketMetrics?.above20Sma)}</td>
        <td>${renderTrend(row.marketMetrics?.above50Sma)}</td>
        <td>${renderTrend(row.marketMetrics?.above200Sma)}</td>
        <td>${renderScore(row.totalScore)}</td>
        <td>${escapeHtml(row.role)}</td>
      </tr>
    `;
  }

  function renderDetail(row) {
    if (!row) {
      elements.detailTop.innerHTML = '<div class="empty">No row selected.</div>';
      elements.chartHost.innerHTML = "";
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
          <a class="detail-link" href="${escapeHtml(getYahooUrl(row))}" target="_blank" rel="noreferrer">Yahoo</a>
          <a class="detail-link" href="${escapeHtml(getTradingViewUrl(row))}" target="_blank" rel="noreferrer">TradingView</a>
          <a class="detail-link" href="${escapeHtml(getRedditUrl(row))}" target="_blank" rel="noreferrer">Reddit</a>
          <span class="${verdictClass(row.verdict)} verdict">${escapeHtml(row.verdict)}</span>
        </div>
      </div>
      <div class="detail-grid">
        <article class="detail-stat">
          <span class="label">Price</span>
          <span class="value">${escapeHtml(formatPrice(row.marketMetrics?.currentPrice ?? row.currentPrice))}</span>
          <span class="small">Snapshot ${escapeHtml(data.priceDate)}</span>
        </article>
        <article class="detail-stat">
          <span class="label">Portfolio Role</span>
          <span class="value">${escapeHtml(scoreWord(row.totalScore))}</span>
          <span class="small">${escapeHtml(row.role)}</span>
        </article>
        <article class="detail-stat">
          <span class="label">Momentum</span>
          <span class="value">${escapeHtml(formatPercent(row.marketMetrics?.oneYearReturn))}</span>
          <span class="small">1M ${escapeHtml(formatPercent(row.marketMetrics?.oneMonthReturn))} / YTD ${escapeHtml(formatPercent(row.marketMetrics?.ytdReturn))}</span>
        </article>
        <article class="detail-stat">
          <span class="label">Trend Setup</span>
          <span class="value">${escapeHtml(renderTrendLabel(row))}</span>
          <span class="small">RS ${row.relativeStrength == null ? "n/a" : `${row.relativeStrength}/100`} / High gap ${escapeHtml(formatPercent(row.marketMetrics?.distanceFromHigh))}</span>
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
        ${row.financials ? `<p class="note"><strong>Financials:</strong> ${escapeHtml(row.financials)}</p>` : ""}
        ${row.marketView ? `<p class="note"><strong>Current market view:</strong> ${escapeHtml(row.marketView)}</p>` : ""}
        ${row.dislocation ? `<p class="note"><strong>Expectation dislocation:</strong> ${escapeHtml(row.dislocation)}</p>` : ""}
        ${row.socialSentiment ? `<p class="note"><strong>Reddit / X sentiment:</strong> ${escapeHtml(row.socialSentiment)}</p>` : ""}
        <p class="note"><strong>Why now:</strong> ${escapeHtml(row.whyNow)}</p>
        <p class="note"><strong>Why still underfollowed:</strong> ${escapeHtml(row.whyUnderfollowed)}</p>
        <p class="note"><strong>Invalidation:</strong> ${escapeHtml(row.invalidation)}</p>
      </div>
    `;

    renderChart(row);
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

  function renderSparkline(values) {
    if (!values || !values.length) {
      return '<span class="subcopy">n/a</span>';
    }

    const width = 118;
    const height = 34;
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const range = max - min || 1;
    const points = values
      .map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * width;
        const y = height - ((value - min) / range) * (height - 4) - 2;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
    const stroke = values[values.length - 1] >= values[0] ? "#145c4d" : "#b6453e";

    return `
      <svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
        <polyline fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${points}"></polyline>
      </svg>
    `;
  }

  function renderMetricPill(value, options) {
    if (value == null) {
      return '<span class="metric-pill metric-medium">n/a</span>';
    }

    const invert = Boolean(options && options.invert);
    const positive = invert ? value >= -8 : value >= 0;
    const negative = invert ? value < -20 : value < 0;
    const className = positive ? "metric-strong" : negative ? "metric-weak" : "metric-medium";
    return `<span class="metric-pill ${className}">${escapeHtml(formatPercent(value))}</span>`;
  }

  function renderStrength(value) {
    if (value == null) {
      return '<span class="subcopy">n/a</span>';
    }

    return `
      <div class="strength">
        <span class="mono">${escapeHtml(String(value))}</span>
        <span class="strength-bar"><span class="strength-fill" style="width:${Math.max(0, Math.min(100, value))}%"></span></span>
      </div>
    `;
  }

  function renderTrend(flag) {
    if (flag == null) {
      return '<span class="trend trend-flat">n/a</span>';
    }
    return flag ? '<span class="trend trend-up">UP</span>' : '<span class="trend trend-down">DN</span>';
  }

  function renderTrendLabel(row) {
    const metrics = row.marketMetrics || {};
    const label = (flag) => flag == null ? "n/a" : flag ? "UP" : "DN";
    return `20D ${label(metrics.above20Sma)} / 50D ${label(metrics.above50Sma)} / 200D ${label(metrics.above200Sma)}`;
  }

  function renderChart(row) {
    const tradingViewSymbol = getTradingViewSymbol(row);

    if (!tradingViewSymbol || !window.TradingView || typeof window.TradingView.widget !== "function") {
      elements.chartHost.innerHTML = `
        <div class="fallback-chart">
          <div class="empty">Chart widget unavailable for ${escapeHtml(row.ticker)}.</div>
          <div class="fallback-caption">Use the Yahoo and TradingView buttons above for the full external page.</div>
        </div>
      `;
      return;
    }

    elements.chartHost.innerHTML = '<div id="tv-chart-host" style="width:100%;height:100%;"></div>';

    try {
      new window.TradingView.widget({
        autosize: true,
        symbol: tradingViewSymbol,
        interval: "D",
        timezone: "Asia/Hong_Kong",
        theme: "light",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: "tv-chart-host"
      });
    } catch (error) {
      elements.chartHost.innerHTML = `
        <div class="fallback-chart">
          <div class="empty">Could not render TradingView for ${escapeHtml(row.ticker)}.</div>
          <div class="fallback-caption">Use the Yahoo and TradingView buttons above for the full external page.</div>
        </div>
      `;
    }
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

  function formatPercent(value, digits) {
    if (value == null || Number.isNaN(value)) {
      return "n/a";
    }
    const precision = typeof digits === "number" ? digits : Math.abs(value) >= 100 ? 0 : 1;
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(precision)}%`;
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

  function getYahooUrl(row) {
    const symbol = row.yahooSymbol || row.ticker;
    return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
  }

  function getTradingViewUrl(row) {
    const tradingViewSymbol = getTradingViewSymbol(row);
    if (tradingViewSymbol) {
      return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tradingViewSymbol)}`;
    }
    return `https://www.tradingview.com/symbols/${encodeURIComponent(row.ticker)}/`;
  }

  function getRedditUrl(row) {
    const query = `${row.ticker} ${row.name} stock`;
    return `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&sort=new`;
  }

  function getTradingViewSymbol(row) {
    if (row.tradingViewSymbol) {
      return row.tradingViewSymbol;
    }

    const exchangeMap = {
      LNG: "NYSE:LNG",
      WMB: "NYSE:WMB",
      SRE: "NYSE:SRE",
      BKR: "NASDAQ:BKR",
      EE: "NYSE:EE",
      KGS: "NYSE:KGS",
      AROC: "NYSE:AROC",
      GTLS: "NYSE:GTLS",
      KNTK: "NYSE:KNTK",
      CF: "NYSE:CF",
      NTR: "NYSE:NTR",
      MOS: "NYSE:MOS",
      AA: "NYSE:AA",
      CENX: "NASDAQ:CENX",
      GLNG: "NASDAQ:GLNG",
      NGS: "NYSE:NGS",
      KEP: "NYSE:KEP",
      TKGSY: "OTC:TKGSY",
      KAEPY: "OTC:KAEPY",
      AAL: "NASDAQ:AAL",
      UAL: "NASDAQ:UAL",
      NCLH: "NYSE:NCLH",
      LYB: "NYSE:LYB",
      CCL: "NYSE:CCL",
      NFE: "NASDAQ:NFE",
      EQT: "NYSE:EQT",
      AR: "NYSE:AR",
      TRGP: "NYSE:TRGP",
      LEU: "AMEX:LEU",
      CCJ: "NYSE:CCJ",
      BTU: "NYSE:BTU",
      CEIX: "NYSE:CNR",
      EQNR: "NYSE:EQNR",
      LSB: "NYSE:LXU",
      STNG: "NYSE:STNG",
      FRO: "NYSE:FRO",
      ZIM: "NYSE:ZIM",
      RTX: "NYSE:RTX",
      PANW: "NASDAQ:PANW"
    };

    return exchangeMap[row.ticker] || null;
  }
})();
