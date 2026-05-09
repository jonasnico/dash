import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PasswordPerformance from "./components/PasswordPerformance";
import { ThemeProvider } from "./components/ThemeProvider";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PasswordPerformance />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
