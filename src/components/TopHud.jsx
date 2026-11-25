import React, { useState, useMemo } from 'react';
import {
  Map,
  Search,
  Navigation,
  User,
  Sparkles,
  X,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { useCampus, CATEGORIES } from '../context/CampusContext';

export default function TopHud() {
  const {
    locations,
    selectLocation,
    selectedCategory,
    setSelectedCategory,
    showLabels,
    setShowLabels,
    showEventMarkers,
    setShowEventMarkers,
    activeTab,
    setActiveTab,
    liveEvents,
    upcomingEvents,
    authUser,
    setAuthModalOpen,
  } = useCampus();

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return locations
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.type || '').toLowerCase().includes(q)
      )
      .slice(0, 7);
  }, [query, locations]);

  const toggleTab = (tab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const totalEventsCount = liveEvents.length + upcomingEvents.length;

  return (
    <header className="fixed top-4 left-4 right-4 z-30 pointer-events-none flex flex-col items-center gap-2.5">
      {/* Main Top Bar */}
      <div className="w-full max-w-6xl flex items-center justify-end gap-2 flex-wrap pointer-events-auto">
        {/* Explore Button */}
        <button
          type="button"
          onClick={() => toggleTab('explore')}
          className={`hud-glass px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'explore'
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 neon-glow-cyan'
              : 'text-slate-100 hover:border-cyan-400/60 hover:text-cyan-200'
          }`}
        >
          <Map className="w-4 h-4 text-cyan-400" />
          <span>Explore</span>
        </button>

        {/* What's Happening? Tab Button */}
        <button
          type="button"
          onClick={() => toggleTab('events')}
          className={`hud-glass px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'events'
              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 neon-glow-emerald'
              : 'text-slate-100 hover:border-emerald-400/60 hover:text-emerald-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">What&apos;s Happening?</span>
          <span className="sm:hidden">Events</span>
          {liveEvents.length > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#FF5722] text-white flex items-center gap-1 shadow-[0_0_10px_rgba(255,87,34,0.7)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {liveEvents.length} LIVE
            </span>
          ) : (
            totalEventsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                {totalEventsCount}
              </span>
            )
          )}
        </button>

        {/* Markers Toggle right next to What's Happening? (OFF by default) */}
        <div
          className={`hud-glass px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition ${
            showEventMarkers
              ? 'border-orange-400/60 text-orange-200 shadow-[0_0_14px_rgba(255,87,34,0.28)]'
              : 'text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-[#FF5722]" />
          <span>Markers</span>
          <button
            type="button"
            role="switch"
            aria-checked={showEventMarkers}
            onClick={() => setShowEventMarkers((m) => !m)}
            className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
              showEventMarkers
                ? 'bg-[#FF5722] shadow-[0_0_10px_rgba(255,87,34,0.7)]'
                : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                showEventMarkers ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Search Locations Input */}
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <div className="hud-glass rounded-xl flex items-center px-3.5 py-2.5 gap-2.5 focus-within:border-cyan-400/70 focus-within:shadow-[0_0_18px_rgba(34,211,238,0.25)] transition">
            <Search className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="text"
              value={query}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search locations..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-cyan-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 hud-glass rounded-xl overflow-hidden py-1 z-50">
              {searchResults.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onMouseDown={() => {
                    selectLocation(loc);
                    setQuery(loc.name);
                    setSearchFocused(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-sm hover:bg-cyan-500/20 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium text-slate-100">{loc.name}</span>
                  <span className="text-[11px] uppercase tracking-wider text-cyan-300">
                    {loc.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Toggle Button */}
        <button
          type="button"
          title="Campus Navigation"
          onClick={() => toggleTab('navigation')}
          className={`hud-glass p-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'navigation'
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 neon-glow-cyan'
              : 'text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
        </button>

        {/* Top-Right Person Icon (On-Demand Auth) */}
        <button
          type="button"
          title={authUser ? `${authUser.name} (${authUser.role})` : 'Sign In / Club Portal'}
          onClick={() => setAuthModalOpen(true)}
          className={`hud-glass p-2.5 rounded-xl transition cursor-pointer relative flex items-center gap-1.5 ${
            authUser
              ? 'border-emerald-400/60 text-emerald-300 neon-glow-emerald'
              : 'text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200'
          }`}
        >
          {authUser?.role === 'admin' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <User className="w-4 h-4" />
          )}
          {authUser && (
            <span className="hidden md:inline text-xs font-medium max-w-[90px] truncate">
              {authUser.name.split(' ')[0]}
            </span>
          )}
        </button>
      </div>

      {/* Second Row: Label Toggle + Category Filter Pills */}
      <div className="w-full max-w-6xl flex items-center justify-end gap-2 flex-wrap pointer-events-auto">
        <div className="hud-pill px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-200">
          <span>Label</span>
          <button
            type="button"
            role="switch"
            aria-checked={showLabels}
            onClick={() => setShowLabels((s) => !s)}
            className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
              showLabels
                ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.7)]'
                : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                showLabels ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                active
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.65)]'
                  : 'hud-pill text-slate-200 hover:border-cyan-400/60 hover:text-cyan-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </header>
  );
}
