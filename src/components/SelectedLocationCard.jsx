import React from 'react';
import { X, Navigation } from 'lucide-react';
import { useCampus } from '../context/CampusContext';

export default function SelectedLocationCard() {
  const {
    selectedLocation,
    setSelectedLocation,
    selectedEvent,
    setStartLocation,
    setEndLocation,
    setActiveTab,
    userLocation,
    startNavigation,
  } = useCampus();

  // Avoid overlapping with EventPopup if an event is currently selected
  if (!selectedLocation || selectedEvent) return null;

  const handleNavigate = () => {
    const startLoc = {
      id: 'CURRENT_LOCATION',
      name: 'Your Current Location',
      coordinates: userLocation,
    };
    setStartLocation(startLoc);
    setEndLocation(selectedLocation);
    setActiveTab('navigation');
    startNavigation(startLoc, selectedLocation);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[360px] max-w-[calc(100vw-2rem)] hud-glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-semibold">
            {selectedLocation.type}
          </span>
          <h3 className="mt-1.5 text-sm font-bold text-white">
            {selectedLocation.name}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setSelectedLocation(null)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {selectedLocation.description && selectedLocation.description.trim() && (
        <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {selectedLocation.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleNavigate}
          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Navigate Here</span>
        </button>
      </div>
    </div>
  );
}
