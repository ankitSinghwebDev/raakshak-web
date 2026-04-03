import { ConfigProvider, theme } from 'antd'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { AppProvider, useAppContext } from './context/AppContext'
import AppRouter from './router/AppRouter'
import RegistrationModal from './components/Auth/RegistrationModal'
import PremiumStudioModal from './components/Auth/PremiumStudioModal'
import SuccessModal from './components/Auth/SuccessModal'
import LoginModal from './components/Auth/LoginModal'
import AdminLoginModal from './components/Auth/AdminLoginModal'
import PartnerLoginModal from './components/Auth/PartnerLoginModal'
import SupportTicketModal from './components/Auth/SupportTicketModal'
import ServiceInquiryModal from './components/Auth/ServiceInquiryModal'
import BenefitsSlider from './components/Features/BenefitsSlider'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import './App.css'

function GlobalModals() {
  const {
    registrationOpen, setRegistrationOpen,
    loginOpen, setLoginOpen,
    adminLoginOpen, setAdminLoginOpen,
    partnerLoginOpen, setPartnerLoginOpen,
    supportTicketOpen, setSupportTicketOpen,
    studioOpen, setStudioOpen,
    successOpen, setSuccessOpen, successData, setSuccessData,
    serviceInquiryOpen, setServiceInquiryOpen, activeServiceType, setActiveServiceType,
    sliderOpen, setSliderOpen, sliderIndex, sliderCategory,
    currentVehicleNum,
    handleRegistrationSuccess, handleOpenStudio,
  } = useAppContext()

  return (
    <>
      <RegistrationModal
        open={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        onSuccess={handleRegistrationSuccess}
        onOpenStudio={handleOpenStudio}
      />
      <PremiumStudioModal
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        vehicleNum={currentVehicleNum}
      />
      <SuccessModal
        open={successOpen}
        onClose={() => { setSuccessOpen(false); setSuccessData(null) }}
        data={successData}
      />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
      <AdminLoginModal
        open={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
      />
      <PartnerLoginModal
        open={partnerLoginOpen}
        onClose={() => setPartnerLoginOpen(false)}
      />
      <SupportTicketModal
        open={supportTicketOpen}
        onClose={() => setSupportTicketOpen(false)}
      />
      <ServiceInquiryModal
        open={serviceInquiryOpen}
        onClose={() => { setServiceInquiryOpen(false); setActiveServiceType(null) }}
        serviceType={activeServiceType}
      />
      <BenefitsSlider
        open={sliderOpen}
        onClose={() => setSliderOpen(false)}
        initialIndex={sliderIndex}
        category={sliderCategory}
      />
    </>
  )
}

function App() {
  return (
    <HelmetProvider>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#F28C38',
            borderRadius: 10,
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          },
        }}
      >
        <ErrorBoundary>
          <AppProvider>
            <div className="app bg-darkBg min-h-screen">
              <AppRouter>
                <GlobalModals />
              </AppRouter>
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#151515',
                    color: '#fff',
                    border: '1px solid rgba(242, 140, 56, 0.2)',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '14px 20px',
                  },
                  success: { iconTheme: { primary: '#00c853', secondary: '#000' } },
                  error: { iconTheme: { primary: '#ff4d4d', secondary: '#000' } },
                }}
              />
            </div>
          </AppProvider>
        </ErrorBoundary>
      </ConfigProvider>
    </HelmetProvider>
  )
}

export default App
