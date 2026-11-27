import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigationType, useParams } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import BacktestPage from './pages/BacktestPage'
import NewsHomePage from './pages/NewsHomePage'
import NewsSectionPage from './pages/NewsSectionPage'
import NewsArticlePage from './pages/NewsArticlePage'
import LearnHubPage from './pages/LearnHubPage'
import LearnTopicPage from './pages/LearnTopicPage'
import LearnArticlePage from './pages/LearnArticlePage'
import IndicatorsPage from './pages/IndicatorsPage'
import EtfPage from './pages/EtfPage'
import CompaniesByWeightPage from './pages/CompaniesByWeightPage'
import CompanyDetailPage from './pages/CompanyDetailPage'
import UsCompaniesByWeightPage from './pages/UsCompaniesByWeightPage'
import FundExposurePage from './pages/FundExposurePage'
import ReitStockPage from './pages/ReitStockPage'
import TermsPage from './pages/TermsPage'
import GemelFundsPage from './pages/GemelFundsPage'

/** Old /blog/:slug links keep working after the Blog → News rename. */
function BlogRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/news/${encodeURIComponent(slug ?? '')}`} replace />
}

/** New pages start at the top; back/forward (POP) keeps the browser's own scroll restore. */
function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])
  return null
}

function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main id="main" tabIndex={-1} className="focus:outline-none">
          <Routes>
            <Route path="/" element={<Navigate to="/backtest" replace />} />
            <Route path="/backtest" element={<BacktestPage />} />
            <Route path="/news" element={<NewsHomePage />} />
            <Route path="/news/section" element={<Navigate to="/news" replace />} />
            <Route path="/news/section/:section" element={<NewsSectionPage />} />
            <Route path="/news/:slug" element={<NewsArticlePage />} />
            <Route path="/blog" element={<Navigate to="/news" replace />} />
            <Route path="/blog/:slug" element={<BlogRedirect />} />
            <Route path="/learn" element={<LearnHubPage />} />
            <Route path="/learn/topic/:topic" element={<LearnTopicPage />} />
            <Route path="/learn/:slug" element={<LearnArticlePage />} />
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
