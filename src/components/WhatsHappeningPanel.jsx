import React from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';

function formatTimeRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateOpts = { month: 'short', day: 'numeric' };
  const timeOpts = { hour: '2-digit', minute: '2-digit' };
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${start.toLocaleDateString([], dateOpts)} · ${start.toLocaleTimeString([], timeOpts)} – ${end.toLocaleTimeString([], timeOpts)}`;
  }
  return `${start.toLocaleDateString([], dateOpts)} ${start.toLocaleTimeString([], timeOpts)} – ${end.toLocaleDateString([], dateOpts)} ${end.toLocaleTimeString([], timeOpts)}`;
}

function EventCard({ event, isLive, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
        isSelected
          ? 'bg-purple-600/20 border-purple-400/60 shadow-lg'
          : 'bg-slate-900/75 border-slate-700/60 hover:border-slate-500/70 hover:bg-slate-800/80'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5722]/20 text-[#FF7A50] border border-[#FF5722]/45">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722] animate-ping" />
              LIVE NOW
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/40">
              <Clock className="w-2.5 h-2.5" />
              UPCOMING
            </span>
          )}
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {event.category || 'Event'}
          </span>
        </div>
      </div>

      <h4 className="mt-2 text-sm font-semibold text-white leading-snug">
        {event.title}
      </h4>
      <p className="text-xs text-sky-300 font-medium mt-0.5">{event.clubName}</p>

      <div className="mt-2.5 space-y-1 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate font-medium">{event.locationName}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{formatTimeRange(event.startTime, event.endTime)}</span>
        </div>
      </div>
    </button>
  );
}

export default function WhatsHappeningPanel() {
  const {
    liveEvents,
    upcomingEvents,
    eventsLoading,
    eventsError,
    refreshEvents,
    selectedEvent,
    focusEvent,
    canPostEvents,
    setPostEventOpen,
  } = useCampus();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-300">
            Click any event to focus on 3D campus
          </span>
        </div>
        <button
          type="button"
          onClick={refreshEvents}
          title="Refresh events"
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${eventsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {canPostEvents && (
        <button
          type="button"
          onClick={() => setPostEventOpen(true)}
          className="mt-3 w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post Event</span>
        </button>
      )}

      {eventsError && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200">
          {eventsError}
        </div>
      )}

      <div className="mt-3 flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Live Now Section */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Live Now ({liveEvents.length})
            </h3>
          </div>
          {liveEvents.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-900/50 rounded-xl p-3 border border-slate-800">
              No live events at this moment.
            </p>
          ) : (
            <div className="space-y-2.5">
              {liveEvents.map((ev) => (
                <EventCard
                  key={ev._id}
                  event={ev}
                  isLive
                  isSelected={selectedEvent?._id === ev._id}
                  onSelect={focusEvent}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Section */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Upcoming ({upcomingEvents.length})
            </h3>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-900/50 rounded-xl p-3 border border-slate-800">
              No upcoming events scheduled.
            </p>
          ) : (
            <div className="space-y-2.5">
              {upcomingEvents.map((ev) => (
                <EventCard
                  key={ev._id}
                  event={ev}
                  isLive={false}
                  isSelected={selectedEvent?._id === ev._id}
                  onSelect={focusEvent}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
