import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Pilots from './pages/Pilots';
import PilotForm from './pages/PilotForm';
import Teams from './pages/Teams';
import TeamForm from './pages/TeamForm';
import Rankings from './pages/Rankings';
import Maps from './pages/Maps';
import MapEditor from './pages/MapEditor';
import PreGame from './pages/PreGame';
import Race from './pages/Race';
import PostRace from './pages/PostRace';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pilotos" element={<Pilots />} />
          <Route path="/pilotos/novo" element={<PilotForm />} />
          <Route path="/pilotos/editar/:id" element={<PilotForm />} />
          <Route path="/equipes" element={<Teams />} />
          <Route path="/equipes/novo" element={<TeamForm />} />
          <Route path="/equipes/editar/:id" element={<TeamForm />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/mapas" element={<Maps />} />
          <Route path="/mapas/novo" element={<MapEditor />} />
          <Route path="/mapas/editar/:id" element={<MapEditor />} />
          <Route path="/pre-jogo" element={<PreGame />} />
          <Route path="/corrida" element={<Race />} />
          <Route path="/pos-corrida" element={<PostRace />} />
          <Route path="/configuracoes" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
