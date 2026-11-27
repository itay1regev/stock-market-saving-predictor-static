import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import BacktestPage from './pages/BacktestPage'
import BlogListPage from './pages/BlogListPage'
import BlogPostPage from './pages/BlogPostPage'
import IndicatorsPage from './pages/IndicatorsPage'
import EtfPage from './pages/EtfPage'
import CompaniesByWeightPage from './pages/CompaniesByWeightPage'
import CompanyDetailPage from './pages/CompanyDetailPage'
import UsCompaniesByWeightPage from './pages/UsCompaniesByWeightPage'
import FundExposurePage from './pages/FundExposurePage'
import ReitStockPage from './pages/ReitStockPage'
import TermsPage from './pages/TermsPage'
import GemelFundsPage from './pages/GemelFundsPage'

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main id="main" tabIndex={-1} className="focus:outline-none">
          <Routes>
            <Route path="/" element={<Navigate to="/backtest" replace />} />
            <Route path="/backtest" element={<BacktestPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/indicators/:country" element={<IndicatorsPage />} />
            <Route path="/etf/:index" element={<EtfPage />} />
            <Route path="/companies-by-weight/:index" element={<CompaniesByWeightPage />} />
            <Route path="/companies-by-weight/company/:id" element={<CompanyDetailPage />} />
            <Route path="/us-stocks/:index" element={<UsCompaniesByWeightPage />} />
            <Route path="/fund-exposure/:fund" element={<FundExposurePage />} />
            <Route path="/reit-stocks/:securityId" element={<ReitStockPage />} />
            <Route path="/gemel/:kind" element={<GemelFundsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<Navigate to="/backtest" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  )
}

export default App
