import React from 'react';
import { CampusProvider } from './context/CampusContext';
import CampusMap3D from './components/CampusMap3D';
import TopHud from './components/TopHud';
import LeftDrawer from './components/LeftDrawer';
import BottomRightControls from './components/BottomRightControls';
import SelectedLocationCard from './components/SelectedLocationCard';
import EventPopup from './components/EventPopup';
import PostEventModal from './components/PostEventModal';
import AuthModal from './components/AuthModal';

export default function App() {
  return (
    <CampusProvider>
      <main className="relative w-screen h-screen overflow-hidden bg-[#090d16]">
        {/* Default Route loads 3D Campus Map immediately (no login gate) */}
        <CampusMap3D />
        <TopHud />
        <LeftDrawer />
        <SelectedLocationCard />
        <EventPopup />
        <BottomRightControls />
        <PostEventModal />
        <AuthModal />
      </main>
    </CampusProvider>
  );
}
