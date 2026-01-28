import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Calculator from './pages/Calculator';
import Results from './pages/Results';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
