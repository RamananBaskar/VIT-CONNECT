import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  Navigation,
  Trash2,
  Crosshair,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { api } from '../utils/api';

export default function EventPopup() {
  const {
    selectedEvent,
    setSelectedEvent,
    locations,
    setStartLocation,
    setEndLocation,
    setActiveTab,
    userLocation,
    startNavigation,
    focusCameraOn,
    authUser,
    refreshEvents,
  } = useCampus();

  const [deleting, setDeleting] = useState(false);

  if (!selectedEvent) return null;

  const now = Date.now();
  const start = new Date(selectedEvent.startTime);
  const end = new Date(selectedEvent.endTime);
  const isLive = start.getTime() <= now && now <= end.getTime();

  const canDelete =
    authUser &&
    (authUser.role === 'admin' ||
      String(selectedEvent.createdBy?._id || selectedEvent.createdBy) ===
        String(authUser.id));

  const linkedLocation =
    locations.find((l) => l.id === selectedEvent.nodeId) || {
      id: selectedEvent.nodeId || selectedEvent._id,
      name: selectedEvent.locationName,
      coordinates: selectedEvent.coordinates,
    };

  const handleNavigateHere = () => {
    const startLoc = {
      id: 'CURRENT_LOCATION',
      name: 'Your Current Location',
      coordinates: userLocation,
    };
    setStartLocation(startLoc);
    setEndLocation(linkedLocation);
    setActiveTab('navigation');
    startNavigation(startLoc, linkedLocation);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.deleteEvent(selectedEvent._id);
      setSelectedEvent(null);
      await refreshEvents();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const coords = selectedEvent.coordinates || {};

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[390px] max-w-[calc(100vw-2rem)] hud-glass rounded-2xl p-4 shadow-2xl border border-slate-600/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5722]/20 text-[#FF7A50] border border-[#FF5722]/45">
                ● LIVE NOW
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/40">
                UPCOMING
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              {selectedEvent.category}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-bold text-white leading-snug">
            {selectedEvent.title}
          </h3>
          <p className="text-xs font-medium text-blue-300">
            {selectedEvent.clubName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedEvent(null)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {selectedEvent.description && (
        <p className="mt-2.5 text-xs text-slate-300 leading-relaxed line-clamp-3">
          {selectedEvent.description}
        </p>
      )}

      <div className="mt-3 space-y-1.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{selectedEvent.locationName}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>
            {start.toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            –{' '}
            {end.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => focusCameraOn(coords)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Focus</span>
        </button>

        <button
          type="button"
          onClick={handleNavigateHere}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Navigate Here</span>
        </button>

        {canDelete && (
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="ml-auto px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-xs font-medium text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? '...' : 'Delete'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
