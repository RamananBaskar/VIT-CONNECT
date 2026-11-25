import React from 'react';
import { LocateFixed } from 'lucide-react';
import { useCampus } from '../context/CampusContext';

export default function BottomRightControls() {
  const { locateUserGPS } = useCampus();

  return (
    <div className="fixed bottom-4 right-4 z-30 flex items-end gap-3 pointer-events-none">
      {/* Locate GPS button */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <button
          type="button"
          title="Locate Me (GPS)"
          onClick={locateUserGPS}
          className="hud-glass p-3 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/90 transition cursor-pointer"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {/* Legend Card */}
      <div className="hud-glass rounded-2xl p-3.5 w-40 pointer-events-auto hidden sm:block">
        <h4 className="text-xs font-bold text-white mb-2.5">Legend</h4>
        <div className="space-y-2 text-[11px] text-slate-200">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: '#38BDF8' }}
            />
            <span>You</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: '#10B981' }}
            />
            <span>Start (Route)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: '#F43F5E' }}
            />
            <span>End (Route)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: '#A855F7' }}
            />
            <span>Selected (Node)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: '#FF5722' }}
            />
            <span>Live Event</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: '#FBBF24' }}
            />
            <span>Upcoming Event</span>
          </div>
        </div>
      </div>
    </div>
  );
}
