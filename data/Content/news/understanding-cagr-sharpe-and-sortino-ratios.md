---
title: "Understanding CAGR, Sharpe, and Sortino Ratios"
date: 2026-06-16
category: Explainers
excerpt: "Three numbers show up in almost every portfolio report. Here's what each one actually measures, and why looking at return alone can be misleading."
slug: understanding-cagr-sharpe-and-sortino-ratios
cover_image: /content-images/understanding-cagr-sharpe-and-sortino-ratios.svg
---

If you've run a backtest, you've seen these three metrics sitting next to the ending balance. They look similar — all just numbers describing performance — but each answers a different question.

## CAGR: how fast did it actually grow?

CAGR (Compound Annual Growth Rate) answers: "If this investment grew at a steady, constant rate every year, what would that rate be?" It smooths out the bumpy year-to-year returns into a single, comparable number.

CAGR is useful precisely because raw total return is hard to compare across different time periods. A 50% total return sounds great — until you learn it happened over 15 years, which is a very different result than 50% over 2 years. CAGR normalizes for time, which is why it's the standard way to compare investments.

What CAGR *doesn't* tell you is anything about the ride along the way. Two investments can post the same CAGR while one moved in a straight line and the other swung wildly.

## Sharpe ratio: was the return worth the volatility?

The Sharpe ratio asks a sharper question: "How much return did you earn *per unit of risk taken*?" It's calculated by taking the return above a risk-free rate and dividing by the standard deviation of returns (volatility).

A higher Sharpe ratio means you got more return for the bumps you endured. A low Sharpe ratio can mean one of two things: either the returns were mediocre, or the ride was so volatile that the returns don't really compensate for the stress of holding through it.

This is why comparing two strategies by CAGR alone can be misleading. A strategy with a slightly lower CAGR but a much higher Sharpe ratio might be the better real-world choice, because it delivers similar results with far less turbulence.

## Sortino ratio: what about just the downside?

The Sortino ratio is a variation on the Sharpe ratio with one key difference: it only penalizes *downside* volatility, not volatility in general.

This distinction matters because standard deviation (used in the Sharpe ratio) treats a sudden 10% jump upward the same as a sudden 10% drop — both count as "volatility." Most investors, however, don't actually mind upside swings; what they care about is downside risk. The Sortino ratio isolates that, which is why it's often considered a more intuitive risk-adjusted measure for long-term investors.

## Putting it together

None of these numbers should be read in isolation:

- **CAGR** tells you the growth rate.
- **Sharpe ratio** tells you whether that growth came with excessive volatility, good and bad.
- **Sortino ratio** tells you specifically about the downside risk you were exposed to.

A strategy with a high CAGR, a poor Sharpe ratio, and an even worse Sortino ratio is one that likely delivered its gains through a genuinely rough ride — worth knowing before committing real savings to it.
