import json
import re
from pathlib import Path

import yfinance as yf


DATA_FILE = Path("/Users/timli/Code/Iran/iran-dashboard-data.js")
OUTPUT_FILE = Path("/tmp/iran_metrics.json")


def load_tickers():
    text = DATA_FILE.read_text()
    return re.findall(r'ticker: "([A-Z]+)"', text)


def fetch_metrics(symbol):
    hist = yf.download(symbol, period="1y", interval="1d", auto_adjust=True, progress=False, threads=False)
    if hist is None or hist.empty or "Close" not in hist:
        return {"error": "no_data"}

    close = hist["Close"]
    if hasattr(close, "columns"):
        close = close.iloc[:, 0]
    close = close.dropna()
    if len(close) < 30:
        return {"error": "too_short"}

    current = float(close.iloc[-1])
    sma20 = float(close.tail(20).mean()) if len(close) >= 20 else None
    sma50 = float(close.tail(50).mean()) if len(close) >= 50 else None
    sma200 = float(close.tail(200).mean()) if len(close) >= 200 else None
    one_month_idx = max(len(close) - 22, 0)
    ytd_candidates = close[close.index.year == close.index[-1].year]
    ytd_start = float(ytd_candidates.iloc[0]) if len(ytd_candidates) else float(close.iloc[0])
    one_year_start = float(close.iloc[0])
    week52_high = float(close.max())
    week52_low = float(close.min())
    step = max(len(close) // 70, 1)
    spark = [round(float(v), 2) for v in close.iloc[::step].tolist()]
    if spark and spark[-1] != round(current, 2):
        spark.append(round(current, 2))

    return {
        "currentPrice": round(current, 2),
        "oneMonthReturn": round((current / float(close.iloc[one_month_idx]) - 1) * 100, 2),
        "ytdReturn": round((current / ytd_start - 1) * 100, 2),
        "oneYearReturn": round((current / one_year_start - 1) * 100, 2),
        "distanceFromHigh": round((current / week52_high - 1) * 100, 2),
        "week52High": round(week52_high, 2),
        "week52Low": round(week52_low, 2),
        "sma20": round(sma20, 2) if sma20 else None,
        "sma50": round(sma50, 2) if sma50 else None,
        "sma200": round(sma200, 2) if sma200 else None,
        "above20Sma": bool(current > sma20) if sma20 else None,
        "above50Sma": bool(current > sma50) if sma50 else None,
        "above200Sma": bool(current > sma200) if sma200 else None,
        "sparkline": spark[-72:],
        "symbol": symbol,
    }


def main():
    symbol_map = {
        "TKGSY": "TKGSY",
        "KAEPY": "KAEPY",
    }
    tickers = load_tickers()
    data = {}
    for ticker in tickers:
        symbol = symbol_map.get(ticker, ticker)
        try:
            data[ticker] = fetch_metrics(symbol)
        except Exception as exc:
            data[ticker] = {"error": str(exc)}

    valid = [(ticker, payload["oneYearReturn"]) for ticker, payload in data.items() if "oneYearReturn" in payload]
    valid_sorted = sorted(valid, key=lambda item: item[1])
    if valid_sorted:
        count = len(valid_sorted)
        for idx, (ticker, _value) in enumerate(valid_sorted):
            rs = round((idx / (count - 1)) * 100) if count > 1 else 100
            data[ticker]["relativeStrength"] = rs

    OUTPUT_FILE.write_text(json.dumps(data, indent=2))
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
