import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import buildingsMetadata from '../data/buildingsMetadata.json';
import {
  sceneToLatLng,
  latLngToScene,
  isWithinCampusBounds,
  OUT_OF_BOUNDS_FALLBACK,
} from '../utils/coordinates';
import {
  buildWaypointGraph,
  getEntranceNodeForLocation,
  findShortestPath,
  computePathDistanceMeters,
  generateTurnByTurnSteps,
} from '../utils/pathfinding';
import { api } from '../utils/api';

const CampusContext = createContext(null);

export const CATEGORIES = ['All', 'Academic', 'Hostel', 'Facility', 'Landmark', 'Playground'];

export function CampusProvider({ children }) {
  const [pathData, setPathData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showLabels, setShowLabels] = useState(false);
  const [showEventMarkers, setShowEventMarkers] = useState(false);

  // Map selection & navigation
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [transportMode, setTransportMode] = useState('walking');
  const [navPathPoints, setNavPathPoints] = useState([]);
  const [navSteps, setNavSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // User GPS / current location (hidden by default until GPS allowed or navigation started)
  const [userLocation, setUserLocation] = useState(null);
  const [locationNotice, setLocationNotice] = useState(null);

  // UI HUD state: 'explore' | 'navigation' | 'events' | null
  const [activeTab, setActiveTab] = useState(null);
  const [cameraFocusTarget, setCameraFocusTarget] = useState(null);

  // Events state
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Post Event modal & map coordinate picker
  const [postEventOpen, setPostEventOpen] = useState(false);
  const [isPickingCoords, setIsPickingCoords] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(null);

  // On-demand Auth modal (Person icon in top-right)
  const [authUser, setAuthUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Load path.json & merge with buildingsMetadata.json
  useEffect(() => {
    fetch('/data/path.json')
      .then((res) => res.json())
      .then((data) => {
        setPathData(data);

        // Build initial locations list from buildingsMetadata + entrance coordinates
        const wpMap = new Map(
          (data.waypoints || []).map((w) => [parseInt(w.id, 10), w])
        );

        const initialLocs = Object.entries(buildingsMetadata).map(([id, meta]) => {
          const entId = data.buildingEntrances?.[id]?.entrances?.[0];
          const wp = entId !== undefined ? wpMap.get(entId) : null;
          const x = wp ? parseFloat(wp.x) : 0;
          const z = wp ? parseFloat(wp.z) : 0;
          const gps = wp?.lat
            ? { lat: parseFloat(wp.lat), lng: parseFloat(wp.lon) }
            : sceneToLatLng(x, z);

          return {
            id,
            name: meta.displayName,
            type: meta.type || 'landmark',
            category: meta.type || 'landmark',
            description: meta.description || '',
            image: meta.image || '',
            panoramaUrl: meta.panoramaUrl || '',
            subLocations: meta.subLocations || [],
            entranceNodeId: entId ?? null,
            coordinates: { x, y: 0, z, ...gps },
          };
        });

        setLocations(initialLocs);
      })
      .catch((err) => {
        console.error('Failed to load path.json:', err);
      });
  }, []);

  // Register Service Worker (sw.js)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  // Restore JWT session if present
  useEffect(() => {
    const token = localStorage.getItem('vit_connect_token');
    if (!token) return;
    api
      .me()
      .then(({ user }) => setAuthUser(user))
      .catch(() => {
        localStorage.removeItem('vit_connect_token');
        setAuthUser(null);
      });
  }, []);

  // Fetch events from backend
  const refreshEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      setEventsError(null);
      const data = await api.getEvents();
      setEvents(data.events || []);
    } catch (err) {
      setEventsError(err.message);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEvents();
    const interval = setInterval(refreshEvents, 60000);
    return () => clearInterval(interval);
  }, [refreshEvents]);

  const waypointGraph = useMemo(() => buildWaypointGraph(pathData), [pathData]);

  // Update building coordinates once 3D bounding boxes are computed from vit_map.glb
  const updateLocationCoordinatesFromScene = useCallback((meshCoordsMap) => {
    setLocations((prev) =>
      prev.map((loc) => {
        const scenePos = meshCoordsMap.get(loc.id);
        if (!scenePos) return loc;
        const gps = sceneToLatLng(scenePos.x, scenePos.z);
        return {
          ...loc,
          coordinates: {
            x: Number(scenePos.x.toFixed(3)),
            y: Number(scenePos.y.toFixed(3)),
            z: Number(scenePos.z.toFixed(3)),
            ...gps,
          },
        };
      })
    );
  }, []);

  // Focus camera on any { x, y, z }
  const focusCameraOn = useCallback((coords) => {
    if (!coords) return;
    setCameraFocusTarget({
      x: Number(coords.x),
      y: Number(coords.y || 0),
      z: Number(coords.z),
      ts: Date.now(),
    });
  }, []);

  // Select a building/location and focus camera
  const selectLocation = useCallback(
    (loc) => {
      setSelectedLocation(loc);
      if (loc?.coordinates) {
        focusCameraOn(loc.coordinates);
      }
    },
    [focusCameraOn]
  );

  // Select an event, focus camera on its coordinates, and open its popup
  const focusEvent = useCallback(
    (ev) => {
      setSelectedEvent(ev);
      setShowEventMarkers(true);
      if (ev?.coordinates) {
        focusCameraOn(ev.coordinates);
      }
    },
    [focusCameraOn]
  );

  // Compute navigation route
  const startNavigation = useCallback(
    (customStart = startLocation, customEnd = endLocation, mode = transportMode) => {
      if (!customStart || !customEnd || waypointGraph.size === 0) return false;
      const effectiveStartCoords =
        customStart.coordinates || {
          ...OUT_OF_BOUNDS_FALLBACK,
          ...sceneToLatLng(OUT_OF_BOUNDS_FALLBACK.x, OUT_OF_BOUNDS_FALLBACK.z),
        };
      const effectiveStart = { ...customStart, coordinates: effectiveStartCoords };

      const startNode = getEntranceNodeForLocation(effectiveStart, pathData, waypointGraph);
      const endNode = getEntranceNodeForLocation(customEnd, pathData, waypointGraph);
      if (startNode === null || endNode === null) return false;

      const pts = findShortestPath(waypointGraph, startNode, endNode, {
        transportMode: mode,
        oneWayRoads: pathData?.oneWayRoads,
      });

      if (pts.length === 0) return false;
      setNavPathPoints(pts);
      const steps = generateTurnByTurnSteps(pts, customEnd.name || 'Destination', mode);
      setNavSteps(steps);
      setActiveStepIndex(0);

      const distanceMeters = computePathDistanceMeters(pts);
      const speedMps = mode === 'driving' ? 6.5 : 1.35;
      setRouteInfo({
        distanceMeters,
        durationMinutes: Math.max(1, Math.round(distanceMeters / speedMps / 60)),
      });
      setIsNavigating(true);

      // Show 3D current_location model at the starting area when navigation starts
      setUserLocation({
        x: effectiveStartCoords.x,
        y: effectiveStartCoords.y ?? 0.337,
        z: effectiveStartCoords.z,
        lat: effectiveStartCoords.lat,
        lng: effectiveStartCoords.lng,
        heading: 0,
        fromNavigation: true,
      });

      focusCameraOn(effectiveStartCoords);
      return true;
    },
    [startLocation, endLocation, transportMode, waypointGraph, pathData, focusCameraOn]
  );

  const clearNavigation = useCallback(() => {
    setNavPathPoints([]);
    setNavSteps([]);
    setActiveStepIndex(0);
    setRouteInfo(null);
    setIsNavigating(false);
    setStartLocation(null);
    setEndLocation(null);
    setUserLocation((prev) => (prev?.fromNavigation ? null : prev));
  }, []);

  const locateUserGPS = useCallback(() => {
    const placeOutOfBoundsFallback = () => {
      const gps = sceneToLatLng(OUT_OF_BOUNDS_FALLBACK.x, OUT_OF_BOUNDS_FALLBACK.z);
      const fallbackLoc = {
        ...OUT_OF_BOUNDS_FALLBACK,
        ...gps,
        heading: 0,
      };
      setUserLocation(fallbackLoc);
      setLocationNotice(
        'Location out of bounds — starting point set near entrance. Please proceed to Main Gate, Student Parking Lot 1, or Gate 2.'
      );
      focusCameraOn(fallbackLoc);
    };

    if (!navigator.geolocation) {
      placeOutOfBoundsFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, heading } = pos.coords;
        const scene = latLngToScene(latitude, longitude);
        if (!isWithinCampusBounds(scene.x, scene.z)) {
          placeOutOfBoundsFallback();
          return;
        }
        const nextLoc = {
          ...scene,
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
          heading: heading || 0,
        };
        setLocationNotice(null);
        setUserLocation(nextLoc);
        focusCameraOn(nextLoc);
      },
      () => {
        setLocationNotice(
          'Location access denied or unavailable. Allow GPS or enter Start & Destination to navigate.'
        );
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, [focusCameraOn]);

  const logout = useCallback(() => {
    localStorage.removeItem('vit_connect_token');
    setAuthUser(null);
  }, []);

  const canPostEvents =
    authUser &&
    (authUser.role === 'admin' ||
      (authUser.role === 'club_member' && authUser.isApproved));

  // Group events into Live Now & Upcoming
  const { liveEvents, upcomingEvents } = useMemo(() => {
    const now = Date.now();
    const live = [];
    const upcoming = [];
    for (const ev of events) {
      const start = new Date(ev.startTime).getTime();
      const end = new Date(ev.endTime).getTime();
      if (start <= now && now <= end) {
        live.push(ev);
      } else if (start > now) {
        upcoming.push(ev);
      }
    }
    return { liveEvents: live, upcomingEvents: upcoming };
  }, [events]);

  const value = {
    pathData,
    locations,
    updateLocationCoordinatesFromScene,
    selectedCategory,
    setSelectedCategory,
    showLabels,
    setShowLabels,
    showEventMarkers,
    setShowEventMarkers,
    selectedLocation,
    setSelectedLocation,
    selectLocation,
    startLocation,
    setStartLocation,
    endLocation,
    setEndLocation,
    transportMode,
    setTransportMode,
    navPathPoints,
    navSteps,
    activeStepIndex,
    setActiveStepIndex,
    routeInfo,
    isNavigating,
    startNavigation,
    clearNavigation,
    userLocation,
    locateUserGPS,
    locationNotice,
    setLocationNotice,
    activeTab,
    setActiveTab,
    cameraFocusTarget,
    focusCameraOn,
    events,
    liveEvents,
    upcomingEvents,
    eventsLoading,
    eventsError,
    refreshEvents,
    selectedEvent,
    setSelectedEvent,
    focusEvent,
    postEventOpen,
    setPostEventOpen,
    isPickingCoords,
    setIsPickingCoords,
    pickedCoords,
    setPickedCoords,
    authUser,
    setAuthUser,
    authModalOpen,
    setAuthModalOpen,
    logout,
    canPostEvents,
  };

  return <CampusContext.Provider value={value}>{children}</CampusContext.Provider>;
}

export function useCampus() {
  const ctx = useContext(CampusContext);
  if (!ctx) throw new Error('useCampus must be used inside CampusProvider');
  return ctx;
}
