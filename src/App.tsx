import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import PasswordPerformance from "./components/PasswordPerformance";
import { ThemeProvider } from "./components/ThemeProvider";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/password-performance"
            element={<PasswordPerformance />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
