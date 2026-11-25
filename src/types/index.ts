export interface User {
  id: number
  email: string
  created_at: string
  is_admin: boolean
}

export interface SavingPlan {
  id: number
  upfront_amount: number
  monthly_amount: number
  start_date: string
  end_date: string
  predicted_value: number
  total_contributed: number
  mode: 'backtest' | 'projection' | 'mixed'
  cagr_used: number | null
  created_at: string
}

export interface SavingPlanInput {
  upfront_amount: number
  monthly_amount: number
  start_date: string
  end_date: string
}

export type ContributionFrequency = 'none' | 'monthly' | 'quarterly' | 'annually'

export type BacktestAsset = 'sp500' | 'nasdaq100' | 'msci_world'

export interface BacktestInput {
  initial_amount: number
  contribution_amount: number
  contribution_frequency: ContributionFrequency
  asset: BacktestAsset
  start_date: string
  end_date: string
}

export interface YearReturn {
  year: number
  return_pct: number
  ending_balance: number
}

export interface Drawdown {
  peak_date: string
  trough_date: string
  recovery_date: string | null
  depth_pct: number
  length_days: number
  recovery_days: number | null
}

export interface TrailingReturn {
  label: string
  years: number
  annualized_return_pct: number | null
}

export interface GrowthPoint {
  date: string
  balance: number
  contributed: number
}

export interface BacktestResult {
  asset: BacktestAsset
  asset_label: string
  start_date: string
  end_date: string
  start_balance: number
  end_balance: number
  total_contributed: number
  total_gain: number
  cagr: number
  annualized_stdev: number
  best_year: YearReturn | null
  worst_year: YearReturn | null
  max_drawdown_pct: number
  sharpe_ratio: number | null
  sortino_ratio: number | null
  growth_chart: GrowthPoint[]
  annual_returns: YearReturn[]
  drawdowns: Drawdown[]
  trailing_returns: TrailingReturn[]
}

export interface BacktestRun {
  id: number
  asset: BacktestAsset
  asset_label: string
  initial_amount: number
  contribution_amount: number
  contribution_frequency: ContributionFrequency
  start_date: string
  end_date: string
  end_balance: number
  total_contributed: number
  total_gain: number
  cagr: number
  max_drawdown_pct: number
  created_at: string
}

export type IndicatorCountry = 'us' | 'israel' | 'germany'

export interface SparklinePoint {
  date: string
  value: number
}

export interface Indicator {
  key: string
  label: string
  category: string
  value: number
  previous: number | null
  change: number | null
  display_value: string
  display_previous: string | null
  as_of: string
  source: string
  sparkline: SparklinePoint[]
}

export interface IndicatorsResponse {
  country: IndicatorCountry
  country_label: string
  indicators: Indicator[]
}

export interface YearlyPoint {
  year: number
  value: number
  display_value: string
}

export interface IndicatorYearlySeries {
  key: string
  label: string
  category: string
  source: string
  points: YearlyPoint[]
}

export interface Etf {
  symbol: string
  name: string
  issuer: string
  category: string
  price: number
  change_pct: number
  aum: number | null
  expense_ratio: number | null
  avg_volume: number | null
  ytd_return_pct: number | null
  dividend_yield_pct: number | null
  dividend_treatment: string
  display_price: string
  display_change_pct: string
  display_aum: string
  display_expense_ratio: string
  display_avg_volume: string
  display_ytd_return_pct: string
  display_dividend_yield_pct: string
}

export interface EtfsResponse {
  etfs: Etf[]
}

export interface Company {
  security_id: string
  name: string
  industry: string | null
  is_saved: boolean
  weight_pct: number
  pe: number | null
  pb: number | null
  roe_pct: number | null
  bizportal_url: string
  display_weight_pct: string
  display_pe: string
  display_pb: string
  display_roe_pct: string
}

export interface CompaniesResponse {
  companies: Company[]
}

export interface FundHolding {
  security_name: string
  security_number: string
  ticker: string
  weight_pct: number
  sector: string
  display_weight_pct: string
  display_security_ref: string
}

export interface FundHoldingsResponse {
  holdings: FundHolding[]
}

export interface ReportRow {
  category: string | null
  label: string
  values: string[]
}

export interface ReportTable {
  periods: string[]
  rows: ReportRow[]
}

export interface PeriodicReportTable {
  quarterly: ReportTable
  yearly: ReportTable
}

export interface CompanyDetail {
  security_id: string
  name: string
  profile_url: string
  reports_url: string
  industry: string | null
  founded_year: string | null
  description: string | null
  is_saved: boolean
  ratios: ReportTable
  ratios_yearly: ReportTable | null
  balance_sheet: PeriodicReportTable
  income_statement: PeriodicReportTable
  cash_flow: PeriodicReportTable
}

export interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  summary: string
  category: string
  cover_image: string | null
  author: string
  published_at: string
  is_saved: boolean
}

export interface AdminBlogPost {
  id: number
  title: string
  slug: string
  content: string
  summary: string
  category: string
  cover_image: string | null
  author: string
  published_at: string
}

export interface AdminBlogPostInput {
  title: string
  category: string
  excerpt: string
  cover_image: string | null
  body: string
  slug?: string | null
}

export interface RangeValue {
  value: number | null
  low: number | null
  high: number | null
  display: string
}

export interface ReitYear {
  year: number
  status: 'actual' | 'forecast' | 'estimate'
  status_label: string
  noi: RangeValue
  ffo: RangeValue
  ffo_per_share: RangeValue
  market_cap: number | null
  gav: number | null
  net_debt: number | null
  nav: number | null
  p_nav: number | null
  p_ffo: number | null
  updated_guidance: { noi: RangeValue; ffo: RangeValue; ffo_per_share: RangeValue } | null
}

export interface ReitSource {
  title: string
  publish_date: string
  pdf_url: string
  local_path: string
}

export interface ReitStocksResponse {
  stocks: Company[]
}

export interface ReitStockDetail {
  security_id: string
  company: Company
  detail: CompanyDetail
  source: ReitSource
  years: ReitYear[]
}
