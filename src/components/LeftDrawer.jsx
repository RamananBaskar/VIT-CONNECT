import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  ChevronDown,
  ChevronRight,
  Navigation,
  ArrowUpDown,
  Crosshair,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  Footprints,
  Car,
} from 'lucide-react';
import { useCampus, CATEGORIES } from '../context/CampusContext';
import WhatsHappeningPanel from './WhatsHappeningPanel';

function ExplorePanel() {
  const {
    locations,
    selectLocation,
    setEndLocation,
    setActiveTab,
  } = useCampus();
  const [openCat, setOpenCat] = useState('Academic');

  const categories = CATEGORIES.filter((c) => c !== 'All');

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-400/20 text-xs text-blue-200 leading-relaxed mb-3">
        Select a category below to browse locations, or tap on a building in the 3D map to view details.
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {categories.map((cat) => {
          const items = locations.filter(
            (l) => (l.type || '').toLowerCase() === cat.toLowerCase()
          );
          const isOpen = openCat === cat;
          return (
            <div
              key={cat}
              className="rounded-xl bg-slate-900/70 border border-slate-700/50 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenCat(isOpen ? '' : cat)}
                className="w-full px-3.5 py-3 flex items-center justify-between text-sm font-medium text-slate-100 hover:bg-slate-800/70 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>{cat}</span>
                  <span className="text-[11px] text-slate-400">({items.length})</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isOpen && items.length > 0 && (
                <div className="px-2 pb-2 space-y-1">
                  {items.map((loc) => (
                    <div
                      key={loc.id}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => selectLocation(loc)}
                        className="text-left flex-1 cursor-pointer group"
                      >
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-purple-300">
                          {loc.name}
                        </div>
                      </button>

                      <button
                        type="button"
                        title="Navigate here"
                        onClick={() => {
                          setEndLocation(loc);
                          setActiveTab('navigation');
                        }}
                        className="p-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepDirectionIcon({ direction, className = 'w-6 h-6 text-white' }) {
  switch (direction) {
    case 'left':
      return <ArrowLeft className={className} />;
    case 'right':
      return <ArrowRight className={className} />;
    case 'slight-left':
      return <CornerUpLeft className={className} />;
    case 'slight-right':
      return <CornerUpRight className={className} />;
    case 'arrive':
      return <Flag className={className} />;
    default:
      return <ArrowUp className={className} />;
  }
}

function formatDist(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${meters} m`;
}

function ActiveRouteView() {
  const {
    routeInfo,
    navSteps,
    activeStepIndex,
    setActiveStepIndex,
    clearNavigation,
    focusCameraOn,
  } = useCampus();

  const currentStep = navSteps[activeStepIndex] || navSteps[0];
  const totalSteps = navSteps.length;

  const goToStep = (idx) => {
    const clamped = Math.max(0, Math.min(totalSteps - 1, idx));
    setActiveStepIndex(clamped);
    const step = navSteps[clamped];
    if (step?.point) {
      focusCameraOn(step.point);
    }
  };

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Green Active Route Header matching image 1.png */}
      <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between text-white rounded-t-2xl">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase">
          <Navigation className="w-4 h-4" />
          <span>Active Route</span>
        </div>
        <div className="text-xs font-bold">
          {routeInfo?.durationMinutes ?? 1} min | {formatDist(routeInfo?.distanceMeters ?? 0)}
        </div>
      </div>

      {/* Current Step Highlight Card */}
      {currentStep && (
        <div className="p-4 border-b border-slate-700/60 bg-slate-900/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
              <StepDirectionIcon direction={currentStep.direction} />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-white leading-tight">
                {currentStep.instruction}
              </div>
              <div className="text-xs text-blue-400 font-medium mt-1">
                {formatDist(currentStep.distanceMeters)} · Step {currentStep.index} of {totalSteps}
              </div>
            </div>
          </div>

          {/* Prev / Next Controls */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={activeStepIndex === 0}
              onClick={() => goToStep(activeStepIndex - 1)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <div className="text-center">
              <div className="text-[11px] text-slate-400">
                Step {activeStepIndex + 1} of {totalSteps}
              </div>
              <div className="text-xs font-bold text-white">
                {routeInfo?.durationMinutes ?? 1} min
              </div>
            </div>

            <button
              type="button"
              disabled={activeStepIndex >= totalSteps - 1}
              onClick={() => goToStep(activeStepIndex + 1)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Step List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {navSteps.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          return (
            <button
              key={step.index}
              type="button"
              onClick={() => goToStep(idx)}
              className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600/20 border-blue-500/60'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/70'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-400'
                    : 'bg-slate-900 text-blue-400 border-blue-500/50'
                }`}
              >
                {step.index}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">
                  {step.instruction}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {formatDist(step.distanceMeters)} · {step.durationMinutes} min
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Exit Button (no speech button) */}
      <div className="p-3 border-t border-slate-700/60 bg-slate-950/60 rounded-b-2xl">
        <button
          type="button"
          onClick={clearNavigation}
          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
}

function NavigationPanel() {
  const {
    locations,
    startLocation,
    setStartLocation,
    endLocation,
    setEndLocation,
    transportMode,
    setTransportMode,
    startNavigation,
    clearNavigation,
    isNavigating,
    navSteps,
    userLocation,
    locateUserGPS,
  } = useCampus();

  if (isNavigating && navSteps.length > 0) {
    return <ActiveRouteView />;
  }

  const handleUseCurrentLocation = () => {
    if (!userLocation) {
      locateUserGPS();
    }
    setStartLocation({
      id: 'CURRENT_LOCATION',
      name: 'Your Current Location',
      coordinates: userLocation || { x: -73.353, y: 0.337, z: 340.876 },
    });
  };

  const handleSwap = () => {
    const tmp = startLocation;
    setStartLocation(endLocation);
    setEndLocation(tmp);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Walking / Driving toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTransportMode('walking')}
          className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition cursor-pointer ${
            transportMode === 'walking'
              ? 'bg-blue-600/30 border-blue-400/60 text-blue-200'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Footprints className="w-4 h-4" />
          <span>Walking</span>
        </button>
        <button
          type="button"
          onClick={() => setTransportMode('driving')}
          className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition cursor-pointer ${
            transportMode === 'driving'
              ? 'bg-blue-600/30 border-blue-400/60 text-blue-200'
              : 'bg-slate-900/60 border-slate-700/50 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Driving</span>
        </button>
      </div>

      {/* Start Box */}
      <div className="p-3 rounded-xl bg-slate-900/75 border border-slate-700/60">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Start
        </div>
        <select
          value={startLocation?.id || ''}
          onChange={(e) => {
            if (e.target.value === 'CURRENT_LOCATION') {
              handleUseCurrentLocation();
            } else {
              const found = locations.find((l) => l.id === e.target.value);
              setStartLocation(found || null);
            }
          }}
          className="w-full bg-slate-950/70 border border-slate-700/70 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
        >
          <option value="">Select start location...</option>
          <option value="CURRENT_LOCATION">Your Current Location</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="mt-2 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-400/30 text-[11px] font-medium text-sky-300 hover:bg-sky-500/25 flex items-center gap-1.5 cursor-pointer"
        >
          <Crosshair className="w-3 h-3" />
          <span>Use Current Location</span>
        </button>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-2 z-10">
        <button
          type="button"
          onClick={handleSwap}
          className="p-2 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 shadow-lg cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Destination Box */}
      <div className="p-3 rounded-xl bg-slate-900/75 border border-rose-500/30">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          Destination
        </div>
        <select
          value={endLocation?.id || ''}
          onChange={(e) => {
            const found = locations.find((l) => l.id === e.target.value);
            setEndLocation(found || null);
          }}
          className="w-full bg-slate-950/70 border border-slate-700/70 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
        >
          <option value="">Select destination...</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={clearNavigation}
          className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => startNavigation()}
          disabled={!startLocation || !endLocation}
          className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
        >
          <Navigation className="w-4 h-4" />
          <span>Start</span>
        </button>
      </div>
    </div>
  );
}

export default function LeftDrawer() {
  const { activeTab, setActiveTab, isNavigating } = useCampus();

  const titles = {
    explore: 'Explore',
    navigation: 'Navigation',
    events: "What's Happening?",
  };

  const hideOuterHeader = activeTab === 'navigation' && isNavigating;

  return (
    <AnimatePresence>
      {activeTab && (
        <motion.aside
          initial={{ x: -360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -360, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed top-4 left-4 bottom-4 w-[335px] max-w-[calc(100vw-2rem)] z-40 hud-glass rounded-2xl p-4 flex flex-col"
        >
          {!hideOuterHeader && (
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/50">
              <h2 className="text-base font-bold text-white tracking-tight">
                {titles[activeTab]}
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'explore' && <ExplorePanel />}
            {activeTab === 'navigation' && <NavigationPanel />}
            {activeTab === 'events' && <WhatsHappeningPanel />}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
