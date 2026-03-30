"""Inject fetched market metrics and updated profile data into iran-dashboard-data.js."""

import json
import re
from pathlib import Path

DATA_FILE = Path("/Users/timli/Code/Iran/iran-dashboard-data.js")
METRICS_FILE = Path("/tmp/iran_metrics.json")

# Updated profile data for all new tickers
PROFILE_UPDATES = {
    "EQT": {
        "currentPrice": 67.55,
        "totalScore": 82,
        "financials": "FY2025 operating revenue of $8.64B with adjusted EBITDA of $5.39B (up 45% YoY), net income of $2.04B, free cash flow of $2.5B, and record-low per-unit operating costs of $1.05/Mcfe; proved reserves of 28.0 Tcfe across ~2.3M gross acres in the Marcellus/Utica.",
        "marketView": "Consensus is Buy (20 Buy / 6 Hold / 1 Sell). Average price target ~$66-67 with BMO at $76 and JPMorgan at $72. The market prices EQT as a quality gas producer benefiting from higher gas prices but does not assign a significant premium for structural LNG export demand catalysts.",
        "dislocation": "The market is underpricing the structural demand ramp from LNG exports (EIA forecasts 16.3 Bcf/d in 2026) and data center power demand (EQT estimates 10 Bcf/d incremental gas demand by 2030). EQT just signed gas supply contracts for a 4.4 GW AI campus in Pennsylvania. The vertically integrated model with record-low $1.05/Mcfe costs is structural, not cyclical.",
        "socialSentiment": "Moderately bullish on Reddit/Seeking Alpha. Featured on 'best natural gas stocks for 2026' lists. The AI/data center narrative has not yet fully permeated retail sentiment for gas producers the way it has for power/utility stocks. Not euphoric.",
        "links": [
            {"label": "EQT FY2025 Results & 2026 Guidance", "url": "https://www.prnewswire.com/news-releases/eqt-reports-fourth-quarter-and-full-year-2025-results-and-provides-2026-guidance-302689893.html", "note": "Official Q4/FY2025 earnings with 2026 capex guidance of $2.65-$2.85B."},
            {"label": "EQT 4.4 GW AI Campus Gas Contract", "url": "https://naturalgasintel.com/news/eqt-snags-two-natural-gas-supply-contracts-including-for-massive-44-gw-ai-campus-in-pennsylvania/", "note": "Data center demand directly contracting with Appalachian producers."},
            {"label": "EIA Natural Gas Outlook 2026-2027", "url": "https://www.eia.gov/todayinenergy/detail.php?id=67166", "note": "US natural gas production record projections and LNG export growth."}
        ]
    },
    "AR": {
        "currentPrice": 45.15,
        "totalScore": 76,
        "financials": "FY2025 revenue of $5.28B (up 22% YoY) with EBITDA of $1.6B (up 114% YoY), net income of $674.6M, free cash flow exceeding $750M; NGL production guided at 125,000 bbl/d of C3+ for 2026. Debt reduced by $300M+ and $136M in shares repurchased.",
        "marketView": "Consensus is Buy (15 Buy / 6 Hold / 1 Sell). Average price target ~$44-46 with Scotiabank at $55 (NGL bull case) and Morgan Stanley at $26 (gas bear case). Market treats AR as a higher-beta gas/NGL play relative to EQT, trading at ~7x EV/EBITDA.",
        "dislocation": "The market undervalues Antero's unique NGL barrel composition (57% propane, 26% butane/isobutane) and its proximity to Marcus Hook/Northeast LPG export terminals. The EBITDA doubling in 2025 (+114%) signals operating leverage that forward estimates may still undercount. The HG Energy acquisition added significant West Virginia acreage not yet fully reflected in reserve upgrades.",
        "socialSentiment": "Active on Reddit/WallStreetBets with 83% positive sentiment. Trending as a natural gas value play with NGL optionality. Cautiously bullish, not euphoric or crowded.",
        "links": [
            {"label": "Antero Q4 2025 Results & 2026 Guidance", "url": "https://www.prnewswire.com/news-releases/antero-resources-announces-fourth-quarter-2025-results-and-2026-guidance-302685639.html", "note": "Official earnings release with 2026 production and cost guidance."},
            {"label": "Antero 2025 Form 10-K", "url": "https://www.anteroresources.com/investors/sec-filings/all-sec-filings/content/0001104659-26-013386/0001104659-26-013386.pdf", "note": "Full annual report: 537K net acres, HG Energy acquisition details."},
            {"label": "Antero NGL Fundamentals Presentation", "url": "https://d1io3yog0oux5.cloudfront.net/_3a053d77006981a9b3a82b57eccf0445/anteroresources/db/819/7723/pdf/NGL_Fundamentals_June_2025_vF.pdf", "note": "NGL barrel composition, export advantage, and pricing dynamics."}
        ]
    },
    "TRGP": {
        "currentPrice": 250.23,
        "totalScore": 80,
        "financials": "FY2025 record adjusted EBITDA of $4.96B (up 20% YoY), net income of $1.92B (up 47% YoY); 2026 guidance of $5.4-$5.6B adjusted EBITDA (11% growth); common dividend increased 25% to $5.00/share annualized; repurchased 3.77M shares in 2025 at avg. $170.45 for $642M total.",
        "marketView": "Consensus is Strong Buy (11 Buy / 1 Hold / 0 Sell). UBS target $280, Morgan Stanley $298, Wells Fargo $264. Trades at a premium EV/EBITDA of ~12x (vs. midstream average of ~8-9x). Priced as the premier Permian midstream growth story.",
        "dislocation": "The market still undervalues the late-2027 capital inflection point when Permian downstream infrastructure spending drops while EBITDA keeps climbing, transforming TRGP from a capital-intensive grower into a FCF machine. DCF models suggest fair value of ~$347. However, Permian inlet volume growth decelerated to 0.4% in Q4 2025 — a risk to monitor.",
        "socialSentiment": "Bullish institutional darling. Less discussed on Reddit/retail forums compared to upstream names — primarily a professional/institutional holding. Seeking Alpha sentiment very positive with multiple 'buy the dip' articles. Institutionally loved, retail-ignored.",
        "links": [
            {"label": "Targa Record Q4 & FY2025 Results", "url": "https://www.targaresources.com/news-releases/news-release-details/targa-resources-corp-reports-record-fourth-quarter-and-full-1", "note": "Record EBITDA, 2026 guidance, $5.00 dividend announcement."},
            {"label": "Targa 2025 Form 10-K", "url": "https://last10k.com/sec-filings/trgp/0001193125-26-059296.htm", "note": "Capex breakdown, Permian project pipeline, risk factors."},
            {"label": "Targa Valuation Analysis", "url": "https://finance.yahoo.com/news/look-targa-resources-trgp-valuation-042332139.html", "note": "Post-earnings valuation discussing premium vs. DCF fair value."}
        ]
    },
    "LEU": {
        "currentPrice": 182.90,
        "totalScore": 83,
        "financials": "FY2025 revenue of $448.7M (+1.5% YoY), gross profit $117.5M, net income $77.8M ($3.90 diluted EPS); backlog reached $3.8B ($2.9B LEU + $0.9B Technical Solutions). SWU revenue up 21%, Technical Solutions revenue up 11% to $102.5M driven by HALEU contract growth.",
        "marketView": "Trading at ~$183 (market cap ~$3.6B) with P/E of ~47x. Consensus is Buy (11 buy / 5 hold / 0 sell), average price target $238-$298. 52-week range is enormous ($49-$464), reflecting high speculative volatility. Priced as a strategic national security asset.",
        "dislocation": "The market prices Centrus as a steady-state SWU trader, but the real option value lies in execution on the $900M DOE HALEU expansion. If Centrus scales commercial centrifuge manufacturing, it transitions from a middleman reselling Russian-origin SWU to the only domestic enricher with a multi-decade monopoly on Western HALEU production. The Russian uranium import ban (full effect 2028) creates a structural supply gap only Centrus can fill.",
        "socialSentiment": "Extremely bullish on StockTwits (sentiment scores 86-95/100 during catalysts). Reddit frames LEU as a unique monopoly play on nuclear/AI energy infrastructure. After 280%+ gain, some cooling but dip-buying conviction remains strong. High-conviction retail favorite.",
        "links": [
            {"label": "Centrus $900M DOE HALEU Contract", "url": "https://investors.centrusenergy.com/news-releases/news-release-details/centrus-awarded-900-million-expand-uranium-enrichment-ohio", "note": "DOE contract to expand HALEU production at Piketon, OH."},
            {"label": "Centrus Q4/FY2025 Earnings", "url": "https://www.prnewswire.com/news-releases/centrus-reports-fourth-quarter-and-full-year-2025-results-and-provides-2026-guidance-302684342.html", "note": "Revenue, EPS, 2026 guidance, $3.8B backlog."},
            {"label": "HALEU Investment Story Analysis", "url": "https://simplywall.st/stocks/us/energy/nyse-leu/centrus-energy/news/how-does-us900-million-haleu-expansion-award-at-centrus-ener", "note": "Bull/bear framework on the HALEU contract catalyst."}
        ]
    },
    "CCJ": {
        "currentPrice": 103.92,
        "totalScore": 77,
        "financials": "FY2025 revenue of $3.48B (+11% YoY), adjusted EBITDA $1.93B, net earnings $590M (up $418M YoY), operating cash flow $1.41B; $1.2B cash vs $1.0B total debt. Westinghouse segment posted 30% EBITDA growth, outperforming acquisition-case expectations.",
        "marketView": "Trading at ~$104 (down from ATH of ~$134 in Jan 2026). Consensus is Moderate Buy to Strong Buy (10-12 buy / 1-3 hold / 0 sell), average price targets $124-$150. Valued at a premium on quality, tier-1 Canadian mining assets, and Westinghouse vertical integration.",
        "dislocation": "The market is underpricing the uranium supply deficit (projected 50M lb shortfall by 2026 growing to 100M+ lb). Cameco's long-term contract book caps 2026 realized prices at CAD $85-89/lb even as spot approaches $100+/lb, creating a 'strength is the ceiling' dynamic that obscures true leverage when contracts roll. The bigger underappreciated angle is Westinghouse as a nuclear infrastructure monopoly.",
        "socialSentiment": "Bullish but cooling from peak. Reddit sentiment dropped from 81.2 to 68.2 recently, partly due to frustration that contracts cap near-term leverage. Most popular thesis frames CCJ + UUUU as 'fuel for the AI era.' Widely held — not a hidden gem — but pullbacks treated as buying opportunities.",
        "links": [
            {"label": "Cameco Q4/FY2025 Results", "url": "https://www.cameco.com/media/news/cameco-reports-2025-fourth-quarter-results", "note": "Full year financials, Westinghouse performance, guidance."},
            {"label": "Cameco 40-F Annual Report", "url": "https://www.stocktitan.net/sec-filings/CCJ/40-f-cameco-corp-annual-report-canadian-issuer-ae3e6223a626.html", "note": "Audited 2025 financials filed with SEC."},
            {"label": "CCJ Contract Book Analysis", "url": "https://247wallst.com/investing/2026/02/28/why-ccjs-long-term-contract-book-is-both-its-strength-and-its-ceiling/", "note": "Analysis of contract book capping near-term upside vs. long-term stability."}
        ]
    },
    "BTU": {
        "currentPrice": 39.50,
        "totalScore": 70,
        "financials": "FY2025 revenue of $3.86B, Adjusted EBITDA of $454.9M, net loss of $(52.9)M but generated $336M operating cash flow; ended year with $575M cash. 120.3M tons produced across 16 mines in US and Australia. Centurion met coal mine commenced full-scale longwall production in Feb 2026.",
        "marketView": "Mixed consensus (3 Buy, 1 Hold, 2 Sell). Average target ~$32-39. Up ~120% over past year and +26% YTD. Recently jumped 5.1% on March 27 analyst upgrade. UBS raised PT to $36.50. Market prices it as a coal cycle play with Centurion met coal optionality.",
        "dislocation": "The Centurion mine ramp-up could add $35-50M incremental EBITDA at $115/ton costs with ~80% benchmark realization. The terminated $3.78B Anglo American deal removed a major capital overhang. With thermal coal prices rallying +21% in March on Iran/Hormuz disruption and Japan restarting coal plants, 2026 EBITDA could reach $600-700M, yet the stock trades at only ~7-8x that potential.",
        "socialSentiment": "Moderately bullish. BTU was a WSB darling during the 2021 coal rally (+482% that year) and retains retail following. Currently cautiously optimistic on the coal price spike from Iran/Hormuz and Japan's coal policy reversal. Not euphoric but gaining attention as a geopolitical hedge.",
        "links": [
            {"label": "Peabody FY2025 Earnings", "url": "https://www.prnewswire.com/news-releases/peabody-reports-results-for-the-quarter-and-year-ended-december-31-2025-302679605.html", "note": "Full Q4/FY2025 results, EBITDA, segment detail."},
            {"label": "Peabody 10-K (SEC)", "url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001064728&type=10-K", "note": "Annual report for fiscal year ending Dec 31, 2025."},
            {"label": "Centurion Mine Expansion Analysis", "url": "https://seekingalpha.com/news/4512218-peabody-energy-targets-3_5m-ton-centurion-coal-expansion-in-2026-amid-strong-u-s-demand", "note": "3.5M ton Centurion ramp and 2026 met coal outlook."}
        ]
    },
    "CEIX": {
        "currentPrice": 113.23,
        "totalScore": 67,
        "financials": "FY2025 revenue of $4.165B (first full year post-merger), 87.8M tons produced (30.5M high-CV thermal, 8.4M met, 48.9M PRB), operating margin 21.7%, P/E of 7.4x; returned ~$245M to shareholders in 2025 through buybacks and dividends. $1B buyback authorization with 75% FCF return policy.",
        "marketView": "Strongly bullish analyst consensus (3 Buy, 0 Hold, 0 Sell among covering analysts). Average PT around $113-$135 with UBS at $115. Consensus 2026 EPS of $3.99. Market cap ~$2.93B. Viewed as the premium US coal platform with best-in-class assets.",
        "dislocation": "Merger synergy upside target has been raised from $110-140M to $150-170M, and full realization is still ahead. Trading at 5.8x P/E with 529M tons of reserves at PA Mining Complex alone. Operational headwinds in 2025 (flagged as trough by management) mask improving 2026 execution. The coal price tailwind from Iran/Hormuz is an additional unpriced catalyst.",
        "socialSentiment": "Low retail visibility. Ticker changed from CEIX to CNR, scattering social following. StockTwits has limited volume. Primarily institutional/value investor name. Ignored by retail/Reddit crowds — a potential positive for contrarian value investors.",
        "links": [
            {"label": "Core Natural Resources 10-K (FY2025)", "url": "https://www.stocktitan.net/sec-filings/CNR/10-k-core-natural-resources-inc-files-annual-report-6058bb213304.html", "note": "Annual report detailing merger, production, reserves."},
            {"label": "CNR $1B Buyback & Q4 Results", "url": "https://www.stocktitan.net/news/CNR/core-natural-resources-reports-fourth-quarter-2024-rs6qb442o7iq.html", "note": "75% FCF return framework, earnings details."},
            {"label": "CONSOL + Arch Merger Completion", "url": "https://www.prnewswire.com/news-releases/successful-completion-of-merger-creating-core-natural-resources-302350535.html", "note": "Merger details and synergy targets."}
        ]
    },
    "EQNR": {
        "currentPrice": 41.53,
        "totalScore": 74,
        "financials": "FY2025 revenue of $106.5B (+2.6% YoY), adjusted operating income of $27.6B, adjusted net income of $6.43B; TTM EBITDA ~$40.5B. Guiding for ~3% production growth in 2026, 10% opex reduction, ROACE ~13%. Cut organic capex outlook by $4B for 2026-27 (reducing renewables spend).",
        "marketView": "Consensus is cautious despite +73% YTD rally (5 Sell, 11 Hold, 1 Strong Buy — consensus 'Reduce'). Average PT around $28-$35. Morgan Stanley upgraded to Equal Weight with $40.40 PT. Market is treating the rally as geopolitically driven and temporary, pricing in reversion of European gas prices.",
        "dislocation": "The analyst consensus 'Reduce' rating looks stale, anchored to pre-crisis gas price assumptions. Qatar's Ras Laffan LNG facilities (17% of capacity) could be offline 3-5 years. European gas storage was at just 28-31% entering spring. If TTF stays above EUR 40/MWh through 2026, earnings estimates need sharp upward revision. Equinor at max capacity means all price upside flows directly to earnings.",
        "socialSentiment": "Growing interest but under-owned by US retail. Gaining traction as a 'Hormuz crisis play' on investment forums. Seeking Alpha turning bullish. European energy stocks remain structurally under-followed by US retail, creating an information asymmetry.",
        "links": [
            {"label": "Equinor Q4/FY2025 Results", "url": "https://www.equinor.com/news/equinor-fourth-quarter-and-full-year-2025-results", "note": "Official results with full financials and production data."},
            {"label": "European Gas Surges 70%", "url": "https://markets.financialcontent.com/stocks/article/marketminute-2026-3-27-european-natural-gas-surges-70-amid-west-asia-geopolitical-crisis", "note": "TTF at 54.5 EUR/MWh and European supply dynamics."},
            {"label": "Equinor Strategic Buy Analysis", "url": "https://seekingalpha.com/article/4860374-equinor-stock-strategic-european-energy-buy-with-margin-of-safety", "note": "Bull case with valuation analysis and margin of safety framework."}
        ]
    },
    "LSB": {
        "currentPrice": 16.30,
        "totalScore": 71,
        "financials": "FY2025 revenue of $615.2M (+17.8% YoY), EBITDA of $139.2M, Adjusted EBITDA of $161.5M, net income of $24.6M (return to profitability). Balance sheet shows $19.5M cash against $440.3M long-term debt. 5th largest US ammonia producer with ~875K tonnes capacity across three facilities (OK, AR, AL).",
        "marketView": "Hold consensus (1 Buy, 2 Hold). Average PT ~$13-$15. UBS raised PT from $9.75 to $16.50, Jefferies from $11 to $15. Market sees LXU as a commodity chemical company with limited scale and gas cost sensitivity.",
        "dislocation": "Multiple underappreciated angles: (1) Urea FOB US Gulf surged 50%+ since Iran war began but 2026 EBITDA estimates have not fully reflected this; (2) $243.9M federal + $342.7M state NOLs mean no cash taxes for 4-5 years — a massive hidden asset at ~$1B enterprise value; (3) blue ammonia/CCS optionality at El Dorado and green ammonia at Pryor add clean energy upside the market assigns zero value to.",
        "socialSentiment": "Under the radar but heating up. StockTwits has limited volume. Starting to gain niche attention on X/Twitter as a 'Hormuz secondary effect' play. The munitions angle (ammonium nitrate) is being discussed on fintwit. Ignored by mainstream retail — a small cohort of value/special-situation investors is accumulating.",
        "links": [
            {"label": "LSB Industries FY2025 Earnings", "url": "https://www.businesswire.com/news/home/20260225704169/en/LSB-Industries-Inc.-Reports-Operating-Results-for-the-2025-Fourth-Quarter-and-Full-Year-and-Provides-Product-Sales-Volume-Outlook-for-2026", "note": "Q4/Full year results and 2026 volume outlook."},
            {"label": "LSB NOLs and Poison Pill Analysis", "url": "https://seekingalpha.com/article/4876719-lsb-industries-strong-2025-massive-nols-lead-to-poison-pill-defense", "note": "Deep dive on NOL value, poison pill, and valuation."},
            {"label": "LSB at Gabelli Symposium", "url": "https://www.investing.com/news/transcripts/lsb-industries-at-gabelli-symposium-strategic-shift-towards-higher-margins-93CH-4571018", "note": "Management discussing shift to higher-margin products."}
        ]
    },
    "STNG": {
        "currentPrice": 75.71,
        "totalScore": 72,
        "financials": "FY2025 revenue of ~$890M with adjusted EBITDA of $568M; swung from $3.1B net debt in 2021 to a net cash position of $309M with $1.7B total liquidity. Fleet cash breakeven of just $11K/day/vessel. Q4 2025 net income was $128M. Fleet of 90 owned vessels.",
        "marketView": "Consensus Strong Buy from 5 analysts with median 12-month target of ~$79 (range $70-$90). Up ~71% over past year. Market views it as a well-run product tanker pure-play benefiting from geopolitical rerouting and historically low orderbook, but prices in some rate mean-reversion.",
        "dislocation": "LR2 rates jumped from $51K/day in Q1 to $101K/day in Q2 2026, with Middle East-Japan benchmark at $120K/day. Near-zero net fleet growth in product tankers (historically low orderbook, aging vessels facing scrapping) means supply is locked tight for 2-3 years. STNG's $309M net cash and $11K/day breakeven mean enormous FCF at current rates, yet the stock trades as if rates will revert sharply.",
        "socialSentiment": "Reddit sentiment score of 90.8/100 but driven by a single viral $90K YOLO options post. Actual retail community is thin and speculative. Not a meme stock, not widely followed by retail. The real investor base is institutional. StockTwits activity moderate.",
        "links": [
            {"label": "STNG 2025 Annual Report (20-F)", "url": "https://www.stocktitan.net/sec-filings/STNG/20-f-scorpio-tankers-inc-files-annual-report-foreign-issuer-644025879243.html", "note": "Complete audited FY2025 financials, fleet of 90 owned vessels."},
            {"label": "STNG Q4 2025 Earnings Transcript", "url": "https://www.fool.com/earnings/call-transcripts/2026/02/12/scorpio-tankers-stng-q4-2025-earnings-transcript/", "note": "Q4 2025 results, newbuilding program, rate outlook."},
            {"label": "Product Tanker Market 2026 Outlook", "url": "https://www.hellenicshippingnews.com/product-tanker-market-prospects-looking-rosy-at-the-start-of-2026/", "note": "Industry-level LR2/MR rate analysis and supply/demand dynamics."}
        ]
    },
    "FRO": {
        "currentPrice": 33.65,
        "totalScore": 68,
        "financials": "FY2025 total revenue of ~$1.77B; Q4 revenue of $624.5M (+36% YoY) with Q4 EBITDA of $359.9M; Q4 net income of $227.9M ($1.03/share, up 242% YoY). Full-year operating cash flow of $682.5M. Fleet of 80 vessels (41 VLCCs, 21 Suezmaxes, 18 LR2/Aframaxes). Q4 dividend of $1.03/share, 5.2% TTM yield.",
        "marketView": "Consensus Strong Buy from 4 analysts with median target of $32 (range $29-$42). Up 58% YTD. Market views FRO as the premier VLCC leverage play. The $831.5M sale of 8 older VLCCs and $1.224B acquisition of 9 eco-newbuildings is seen as smart fleet renewal.",
        "dislocation": "VLCC Q1 2026 bookings at $107.1K/day (92% fixed) are extraordinary and the market is not fully pricing the duration. Fleet renewal drops opex per vessel and extends earnings power. Shadow fleet disruption from sanctions enforcement is structurally removing supply. Revenue estimates for FY2026 have actually been cut from $1.62B to $1.58B — analysts are too conservative given the rate trajectory.",
        "socialSentiment": "StockTwits sentiment neutral (47-69/100), improving from bearish post-Q3 2025. Not a prominent WSB pick — the tanker trade on Reddit focuses more on DHT and STNG. FRO is more institutional/dividend investor. Seeking Alpha coverage active and generally bullish.",
        "links": [
            {"label": "FRO Q4 & FY2025 Results", "url": "https://www.frontlineplc.cy/fro-fourth-quarter-and-full-year-2025-results/", "note": "Complete FY2025 financial results, fleet data, rate bookings."},
            {"label": "FRO Q4 Earnings Transcript", "url": "https://www.fool.com/earnings/call-transcripts/2026/02/27/frontline-fro-q4-2025-earnings-call-transcript/", "note": "Fleet renewal, VLCC rate outlook, capital allocation."},
            {"label": "CNBC: Oil Supertanker Rates Soar", "url": "https://www.cnbc.com/2026/03/03/middle-east-crisis-iran-us-shipping-oil-tankers-strait-of-hormuz.html", "note": "VLCC rate spike to $423K/day on Hormuz disruption."}
        ]
    },
    "ZIM": {
        "currentPrice": 26.19,
        "totalScore": 64,
        "financials": "FY2025 revenue of $6.90B (down from $8.43B), adjusted EBITDA of $2.17B (31% margin), net income of $481M; the decline reflects normalization with 29% lower average freight rates and 9% lower carried volume versus the exceptional 2024.",
        "marketView": "Now an acquisition/arb story. Hapag-Lloyd offered $35/share all-cash on Feb 16, 2026 (58% premium). Stock trades at ~$26, a full $9 below deal price, implying ~30-40% deal-break probability. Israeli government Golden Share approval and EU regulatory clearance are the key risks. Shareholder vote is April 30, 2026.",
        "dislocation": "The $9 spread to the $35 deal price is the thesis. If the deal closes, it is a 34% return from current levels. Key risks: (1) Israeli Knesset panel opposed the deal citing ZIM's wartime logistics role; (2) EU regulatory clearance for combining 5th and ~10th largest container lines; (3) CEO sold 87% of holdings at $28-29 (below deal price) — a bearish insider signal. If the deal breaks, the stock likely falls to $15-20.",
        "socialSentiment": "Reddit sentiment score of 49/100 (neutral, the lowest tracked) reflecting genuine uncertainty. A viral post on the $35 buyout gap drew attention but no consensus. Discussed primarily in merger-arb and shipping specialist circles. Not a retail favorite.",
        "links": [
            {"label": "ZIM-Hapag-Lloyd Merger Announcement", "url": "https://investors.zim.com/news/news-details/2026/ZIM-to-be-Acquired-by-Hapag-Lloyd-for-35-00-per-Share-in-Cash-at-Aggregate-Cash-Consideration-of-Approximately-4-2-Billion-New-Israeli-Company-New-ZIM-to-Acquire-Portion-of-ZIMs-Business/default.aspx", "note": "Official deal terms, $35/share, 'New ZIM' structure."},
            {"label": "Hapag-Lloyd ZIM Investor Presentation", "url": "https://www.hapag-lloyd.com/content/dam/website/downloads/ir/Investor_Presentation_HLAG_ZIM.pdf", "note": "Acquirer's synergy estimates, financing plan, strategic rationale."},
            {"label": "ZIM Arbitrage Analysis", "url": "https://seekingalpha.com/article/4880880-zim-integrated-shipping-arbitrage-opportunity", "note": "Arb spread analysis, regulatory risk assessment, deal timeline."}
        ]
    },
    "RTX": {
        "currentPrice": 189.71,
        "totalScore": 75,
        "financials": "FY2025 revenue of $88.6B (+11% organic), EBITDA of $13.7B (+25.5% YoY), adjusted EPS of $6.29 (+10% YoY), free cash flow of $7.9B (+$3.4B YoY), and a record backlog of $268B; 2026 guidance calls for $6.60-$6.80 adjusted EPS and $8.25-$8.75B FCF.",
        "marketView": "Consensus Moderate Buy with median target ~$225 (range $179-$240) from 27 analysts. Trades at ~42x trailing P/E. Market views RTX as well-positioned defense prime with geopolitical tailwinds but assigns a premium valuation that assumes clean execution on GTF engine crisis and backlog conversion.",
        "dislocation": "The market is underpricing the munitions replenishment supercycle. In Feb 2026, Raytheon signed five framework agreements with the Department of War to quadruple missile output — Tomahawks to 1,000+/yr, AMRAAMs to 1,900+/yr, SM-6 to 500+/yr, plus an $8.4B SM-3 contract expansion through 2029. Operation Epic Fury consumed munitions at rates that will take years to replenish. The multi-year NATO restocking tail is a 3-5 year revenue driver that consensus EPS has not fully captured.",
        "socialSentiment": "Reddit sentiment scores 63-78 (moderately bullish). Broadly owned by retail as the 'defense play' with conviction on Iran munitions burn. Not euphoric — steady conviction — with GTF engine issue acting as a brake on full enthusiasm. StockTwits leans bullish. Institutional-led with retail piggybacking.",
        "links": [
            {"label": "RTX 2025 Annual Results & 2026 Outlook", "url": "https://www.rtx.com/news/news-center/2026/01/27/rtx-reports-2025-results-and-announces-2026-outlook-", "note": "Official press release with FY2025 financials and 2026 guidance."},
            {"label": "Raytheon Landmark Munitions Agreements", "url": "https://www.rtx.com/news/news-center/2026/02/04/rtxs-raytheon-partners-with-department-of-war-on-five-landmark-agreements-to-exp", "note": "Framework to quadruple missile output (Tomahawk, AMRAAM, SM-3, SM-6)."},
            {"label": "Time: Defense Contractors and Iran War", "url": "https://time.com/article/2026/03/19/trump-iran-war-set-to-boost-profits-for-these-defense-contractors/", "note": "Overview of which defense primes benefit most from Iran theater spending."}
        ]
    },
    "PANW": {
        "currentPrice": 147.02,
        "totalScore": 73,
        "financials": "FY2025 (ended Jul 31) revenue of $9.2B (+15% YoY), EBITDA of $2.1B (+48% YoY), next-gen security ARR of $5.6B (+32% YoY), remaining performance obligations of $15.8B (+24% YoY); Q2 FY2026 (Jan 2026) revenue of $2.594B (+14.9% YoY) with Next-Gen Security ARR of $6.3B (+33% YoY).",
        "marketView": "Consensus Buy from 36-40 analysts with average target ~$213-$218 (range $114-$265), implying ~45% upside. Down 19% YTD on two fears: (1) AI commoditization of cybersecurity sparked by leaked 'Claude Mythos' model; (2) broader tech multiple compression. P/E of 81x despite 15%+ growth.",
        "dislocation": "The market is overweighting the AI disruption narrative and underweighting the Iran cyber retaliation catalyst. Unit 42 documented 60+ pro-Iranian hacktivist groups mobilizing within hours of Operation Epic Fury. The Stryker medical device cyberattack — potentially the most significant wartime cyberattack against the U.S. in history — forced hospitals to disconnect vital-sign monitoring. This is exactly when CISO budgets get emergency unlocks. The $400M Koi Security acquisition (agentic AI endpoint) directly counters the AI bear thesis by making PANW the AI-native security platform.",
        "socialSentiment": "Reddit sentiment volatile — swung from bearish 35 (peak AI fear) to 75 by late February. r/investing split between 'AI will eat cybersecurity' bears and 'platform winners take all' bulls. The Stryker cyberattack generating fresh bullish interest. StockTwits heavy bearish activity on March 27 drop, but Wall Street did not downgrade. Fearful but not capitulatory, contrarian buyers emerging.",
        "links": [
            {"label": "Unit 42: Iranian Cyberattacks 2026", "url": "https://unit42.paloaltonetworks.com/iranian-cyberattacks-2026/", "note": "Threat intelligence on Iranian hacktivist mobilization and Stryker attack."},
            {"label": "PANW FY2025 10-K", "url": "https://www.sec.gov/Archives/edgar/data/1327567/000132756725000027/panw-20250731.htm", "note": "Full annual report with detailed financials and risk factors."},
            {"label": "PANW AI Security Bet Analysis", "url": "https://247wallst.com/investing/2026/02/25/panw-is-down-19-but-its-ai-security-bet-may-change-that/", "note": "Koi Security acquisition analysis and why the AI bear thesis may be overstated."}
        ]
    }
}


def main():
    metrics = json.loads(METRICS_FILE.read_text())
    text = DATA_FILE.read_text()

    # Parse the JS file as JSON (strip the window assignment)
    json_str = re.sub(r'^window\.IRAN_DASHBOARD_DATA\s*=\s*', '', text)
    json_str = re.sub(r';\s*$', '', json_str)
    data = json.loads(json_str)

    for row in data["rows"]:
        ticker = row["ticker"]

        # Inject market metrics from fetch
        if ticker in metrics and "error" not in metrics[ticker]:
            m = metrics[ticker]
            row["marketMetrics"] = {
                "currentPrice": m["currentPrice"],
                "currency": "USD",
                "oneMonthReturn": m["oneMonthReturn"],
                "ytdReturn": m["ytdReturn"],
                "oneYearReturn": m["oneYearReturn"],
                "distanceFromHigh": m["distanceFromHigh"],
                "week52High": m["week52High"],
                "week52Low": m["week52Low"],
                "sma20": m["sma20"],
                "sma50": m["sma50"],
                "sma200": m["sma200"],
                "above20Sma": m["above20Sma"],
                "above50Sma": m["above50Sma"],
                "above200Sma": m["above200Sma"],
                "sparkline": m["sparkline"]
            }
            row["currentPrice"] = m["currentPrice"]
            row["relativeStrength"] = m.get("relativeStrength")
            row["marketDataStatus"] = "ok"

        # Inject profile updates
        if ticker in PROFILE_UPDATES:
            updates = PROFILE_UPDATES[ticker]
            for key, value in updates.items():
                row[key] = value

    # Write back
    output = "window.IRAN_DASHBOARD_DATA = " + json.dumps(data, indent=2) + ";\n"
    DATA_FILE.write_text(output)
    print(f"Updated {len(data['rows'])} rows. Done.")


if __name__ == "__main__":
    main()
