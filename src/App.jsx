import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dasboard/Dashboard";
import DonPage from "./pages/donPage/donPage";
import DonorsPage from "./pages/Donateur/DonorsPage";
import StatePage from "./pages/StatistiquePage/StatistiquesPage";
import DonHistory from "./pages/DonHistory/DonHistory";
import TypeDonPage from "./pages/TypeDonPage/TypeDonPage"; 
import Report from "./pages/ReportPage/ReportPage"; 
import QuickSummary from "./pages/QuickSummary/QuickSummary"; 
import Maharitra from "./pages/Maharitra/Maharitra"; 
import Auth from "./pages/auth/LoginPage"; 

// Composant pour protéger les routes
const PrivateRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem("user"));
    // Si pas d'utilisateur, redirection vers la page de login
    return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        
        {/* --- ROUTE INDÉPENDANTE (Pas de Sidebar) --- */}
        <Route path="/login" element={<Auth />} />

        {/* --- ROUTES PROTÉGÉES AVEC LAYOUT --- */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Redirection automatique vers dashboard si on arrive sur "/" */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="saisie-don" element={<DonPage />} /> 
          <Route path="donateur" element={<DonorsPage />} /> 
          <Route path="type-don" element={<TypeDonPage />} /> 
          <Route path="statistique" element={<StatePage />} /> 
          <Route path="historique" element={<DonHistory />} />
          <Route path="Report" element={<Report />} />
          <Route path="QuickSummary" element={<QuickSummary />} />
          <Route path="Maharitra" element={<Maharitra />} />
        </Route>

        {/* Redirection si l'URL n'existe pas */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;