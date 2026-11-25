import React, { useState, useEffect } from 'react';
import { X, MapPin, Crosshair, CalendarPlus } from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { sceneToLatLng } from '../utils/coordinates';
import { api } from '../utils/api';

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PostEventModal() {
  const {
    postEventOpen,
    setPostEventOpen,
    locations,
    authUser,
    isPickingCoords,
    setIsPickingCoords,
    pickedCoords,
    setPickedCoords,
    refreshEvents,
    focusEvent,
  } = useCampus();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clubName, setClubName] = useState(authUser?.clubName || '');
  const [category, setCategory] = useState('Technical');
  const [nodeId, setNodeId] = useState('Building001');
  const [locationName, setLocationName] = useState('Academic Block 3');
  const [coordX, setCoordX] = useState('38.366');
  const [coordY, setCoordY] = useState('2');
  const [coordZ, setCoordZ] = useState('-110.207');
  const [startTime, setStartTime] = useState(() => toLocalInputValue(new Date()));
  const [endTime, setEndTime] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 2 * 3600 * 1000))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authUser?.clubName && !clubName) {
      setClubName(authUser.clubName);
    }
  }, [authUser, clubName]);

  useEffect(() => {
    if (pickedCoords) {
      setCoordX(String(pickedCoords.x));
      setCoordY(String(pickedCoords.y || 2));
      setCoordZ(String(pickedCoords.z));
      setNodeId('');
    }
  }, [pickedCoords]);

  if (!postEventOpen || isPickingCoords) return null;

  const handleSelectBuilding = (id) => {
    setNodeId(id);
    const loc = locations.find((l) => l.id === id);
    if (loc) {
      setLocationName(loc.name);
      setCoordX(String(loc.coordinates.x));
      setCoordY(String(loc.coordinates.y || 2));
      setCoordZ(String(loc.coordinates.z));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setSubmitting(true);
      const x = parseFloat(coordX);
      const y = parseFloat(coordY) || 0;
      const z = parseFloat(coordZ);
      const gps = sceneToLatLng(x, z);

      const { event } = await api.createEvent({
        title,
        description,
        clubName: clubName || authUser?.clubName || 'VIT Club',
        category,
        locationName,
        nodeId,
        coordinates: { x, y, z, lat: gps.lat, lng: gps.lng },
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });

      await refreshEvents();
      setPostEventOpen(false);
      setPickedCoords(null);
      setTitle('');
      setDescription('');
      if (event) focusEvent(event);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg hud-glass rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Post Campus Event</h2>
          </div>
          <button
            type="button"
            onClick={() => setPostEventOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-sm">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Event Title *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Agents & Robotics Meetup"
              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Club Name *
              </label>
              <input
                required
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g. IEEE CS VITC"
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="Technical">Technical</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Workshop">Workshop</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary, speaker details, or registration info..."
              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Building / Node Picker OR Click on 3D Map */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Venue &amp; 3D Coordinates
              </span>
              <button
                type="button"
                onClick={() => setIsPickingCoords(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Pick on 3D Map</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={nodeId}
                onChange={(e) => handleSelectBuilding(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="">Custom Map Point</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <input
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Venue / Room Name"
                className="bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">X</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={coordX}
                  onChange={(e) => setCoordX(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Y</label>
                <input
                  type="number"
                  step="any"
                  value={coordY}
                  onChange={(e) => setCoordY(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Z</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={coordZ}
                  onChange={(e) => setCoordZ(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setPostEventOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
