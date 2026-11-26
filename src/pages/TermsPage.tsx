import type { ReactNode } from 'react'

const LAST_UPDATED = '27 November 2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Terms of Use &amp; Disclaimer</h1>
      <p className="mt-1 text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>

      <p className="mt-6 text-sm leading-relaxed text-slate-700">
        This website (the "Site") is a free, non-commercial resource. By using it you agree to these Terms. If you do
        not agree, please do not use the Site.
      </p>

      <Section title="1. Informational and educational use only — no advice">
        <p>
          Everything on the Site, including data, tables, charts, backtests, indicators, fund comparisons, company
          figures and blog articles, is provided for general informational and educational purposes only.
        </p>
        <p>
          Nothing on the Site is financial, investment, tax, legal or accounting advice, investment marketing, or a
          recommendation or solicitation to buy, sell or hold any security, fund or other financial product. The Site
          does not take into account your personal circumstances, goals or risk tolerance. The operator of the Site is
          not a licensed investment adviser, investment marketer, portfolio manager or broker-dealer, in Israel or
          anywhere else.
        </p>
        <p>
          You are solely responsible for your own investment decisions and invest or trade entirely at your own risk.
          Consider consulting a licensed professional before making any financial decision.
        </p>
      </Section>

      <Section title={'2. Data provided "as is" and "as available"'}>
        <p>
          All data and content are provided "as is" and "as available", without warranties of any kind, express or
          implied, including warranties of accuracy, completeness, timeliness, reliability, merchantability or fitness
          for a particular purpose.
        </p>
        <p>
          Data on the Site is a periodic snapshot taken when the Site was last built. It is not a live or real-time
          feed and may be delayed, out of date, incomplete or wrong. Calculated figures (for example returns, ratios,
          weights, CAGR, Sharpe/Sortino ratios and backtest results) depend on that data and on simplifying
          assumptions, and may contain errors.
        </p>
        <p>
          Backtest and historical results are hypothetical. They do not include fees, taxes, slippage or trading
          costs unless stated otherwise. Past performance does not guarantee or predict future results.
        </p>
      </Section>

      <Section title="3. Third-party data sources">
        <p>Data on the Site is obtained from third parties, including:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Yahoo Finance — U.S.-listed ETF and price data</li>
          <li>Federal Reserve Bank of St. Louis (FRED) — macroeconomic indicators</li>
          <li>funder.co.il — Israeli index-tracking fund data</li>
          <li>Tel Aviv Stock Exchange (TASE) and the MAYA reporting system — company filings and reports</li>
          <li>bizportal.co.il — company financial data</li>
          <li>mygemel.net — Israeli study fund (קרנות השתלמות), provident fund (קופות גמל) and pension fund (קרנות פנסיה) returns</li>
        </ul>
        <p>
          The operator does not independently audit, verify or guarantee these sources. Third-party data remains the
          property of its respective owners and is subject to their own terms. Inclusion of a source does not imply
          its endorsement of the Site. Links to external sites are provided for convenience only; the operator is not
          responsible for their content.
        </p>
      </Section>

      <Section title="4. Blog articles">
        <p>
          Blog articles reflect general commentary and opinion at the time of writing, may be summarised from public
          news reports, and may become outdated. Mentions of companies, funds or investors are for discussion only and
          are not recommendations.
        </p>
      </Section>

      <Section title="5. Limitation of liability">
        <p>
          To the maximum extent permitted by applicable law, the operator of the Site will not be liable for any
          direct, indirect, incidental, special, consequential or punitive damages, or for any loss of profits,
          trading losses, lost opportunities or loss of data, arising out of or in connection with your use of, or
          reliance on, the Site or any of its content, even if advised of the possibility of such damages.
        </p>
        <p>
          Because the Site is provided free of charge, to the maximum extent permitted by applicable law the
          operator's total aggregate liability for any claim relating to the Site is limited to zero. Where the law
          does not allow that, it is limited to USD $100.
        </p>
        <p>
          Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable
          law.
        </p>
      </Section>

      <Section title="6. Changes and availability">
        <p>
          The Site and its content may be changed, suspended or removed at any time without notice. These Terms may
          also be updated from time to time; continued use of the Site after a change means you accept the updated
          Terms.
        </p>
      </Section>
    </div>
  )
}
