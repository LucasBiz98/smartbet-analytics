import { Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import Predictions from './pages/Predictions';
import Bets from './pages/Bets';
import Stats from './pages/Stats';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="predictions" element={<Predictions />} />
        <Route path="bets" element={<Bets />} />
        <Route path="stats" element={<Stats />} />
      </Route>
    </Routes>
  );
}

export default App;
