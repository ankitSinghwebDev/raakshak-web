import { Helmet } from 'react-helmet-async'
import { useAppContext } from '../context/AppContext'
import Header from '../components/Header/Header'
import Hero from '../components/Hero/Hero'
import Features from '../components/Features/Features'
import ProcessFlow from '../components/Features/ProcessFlow'
import WhyIndia from '../components/Features/WhyIndia'
import Reviews from '../components/Reviews/Reviews'
import PremiumTools from '../components/Features/PremiumTools'
import Services from '../components/Features/Services'
import Contact from '../components/Footer/Contact'
import Footer from '../components/Footer/Footer'

const HomePage = () => {
  const {
    language, setLanguage,
    handleRegisterClick, handleLoginClick,
    handleBenefitSlider, handleServiceClick,
    setPartnerLoginOpen, setSupportTicketOpen, setAdminLoginOpen,
  } = useAppContext()

  return (
    <>
      <Helmet>
        <title>Rakshak - Har Gaadi Ka Guardian | Vehicle Privacy & Safety</title>
        <meta name="description" content="Protect your vehicle's privacy with Rakshak QR smart tags. Emergency alerts, parking solutions, and 24/7 digital vehicle protection across India." />
      </Helmet>
      <Header
        language={language}
        setLanguage={setLanguage}
        onLoginClick={handleLoginClick}
        onPartnerLogin={() => setPartnerLoginOpen(true)}
        onSupportTicket={() => setSupportTicketOpen(true)}
        onAdminLogin={() => setAdminLoginOpen(true)}
      />
      <main>
        <Hero onRegisterClick={handleRegisterClick} />
        <Features onCardClick={handleBenefitSlider} />
        <ProcessFlow />
        <WhyIndia onCardClick={handleBenefitSlider} />
        <Reviews />
        <PremiumTools onLoginClick={handleLoginClick} />
        <Services onServiceClick={handleServiceClick} />
        <Contact />
      </main>
      <Footer onAdminLogin={() => setAdminLoginOpen(true)} />
    </>
  )
}

export default HomePage
