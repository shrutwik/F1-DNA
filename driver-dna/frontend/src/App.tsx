import { Navigate, Route, Routes } from "react-router-dom";
import { DriverPage } from "./pages/DriverPage";
import { ExplorePage } from "./pages/ExplorePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ExplorePage />} />
      <Route path="/driver/:year/:code" element={<DriverPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
