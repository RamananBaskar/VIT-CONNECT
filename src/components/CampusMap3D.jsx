import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useCampus } from '../context/CampusContext';
import { sceneToLatLng } from '../utils/coordinates';
import buildingsMetadata from '../data/buildingsMetadata.json';

function BlueSkyDome() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Daytime blue sky gradient from zenith to horizon
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0.0, '#1e64c8');
    grad.addColorStop(0.32, '#3b95e8');
    grad.addColorStop(0.5, '#8fd0fa');
    grad.addColorStop(0.55, '#cfeafd');
    grad.addColorStop(1.0, '#9fc8e8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Soft wispy horizon clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    for (let i = 0; i < 26; i++) {
      const cx = ((i * 97) % 1024);
      const cy = 200 + ((i * 31) % 60);
      const rx = 45 + ((i * 19) % 55);
      const ry = 10 + ((i * 7) % 14);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[3600, 48, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

function CurrentLocationMarker({ position, heading = 0 }) {
  const { scene } = useGLTF('/data/current_location.glb');
  const cloned = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef();
  const ringRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current && position) {
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        position.x,
        0.25
      );
      groupRef.current.position.z = THREE.MathUtils.lerp(
        groupRef.current.position.z,
        position.z,
        0.25
      );
    }
    if (ringRef.current) {
      const t = performance.now() * 0.003;
      const scale = 1 + Math.sin(t) * 0.14;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[position?.x || 0, 1.5, position?.z || 0]}
      rotation={[0, -THREE.MathUtils.degToRad(heading), 0]}
    >
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <circleGeometry args={[12, 32]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <primitive object={cloned} scale={[7.5, 7.5, 7.5]} />
    </group>
  );
}

function NavigationPath({ points }) {
  if (!points || points.length < 2) return null;
  const vectors = useMemo(
    () => points.map((p) => new THREE.Vector3(p.x, (p.y || 0) + 2.5, p.z)),
    [points]
  );

  return (
    <group>
      <Line
        points={vectors}
        color="#3b82f6"
        lineWidth={6}
        dashed
        dashSize={6}
        gapSize={4}
      />
      {points.map((pt, idx) => (
        <mesh key={idx} position={[pt.x, (pt.y || 0) + 2.2, pt.z]}>
          <sphereGeometry args={[1.6, 12, 12]} />
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#2563eb"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

function EventPin3D({ event, isLive, isSelected, onSelect }) {
  const pulseRef = useRef();
  const pinY = (event.coordinates?.y || 0) + 14;

  useFrame(() => {
    if (pulseRef.current && isLive) {
      const s = 1 + Math.sin(performance.now() * 0.005) * 0.25;
      pulseRef.current.scale.set(s, s, 1);
    }
  });

  if (!event.coordinates) return null;

  return (
    <group position={[event.coordinates.x, 0, event.coordinates.z]}>
      {/* Vertical beacon stem */}
      <mesh position={[0, pinY / 2, 0]}>
        <cylinderGeometry args={[0.5, 0.5, pinY, 8]} />
        <meshStandardMaterial
          color={isLive ? '#FF5722' : '#FBBF24'}
          emissive={isLive ? '#FF5722' : '#FBBF24'}
          emissiveIntensity={0.75}
        />
      </mesh>

      {/* Ground ring */}
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.2, 0]}>
        <ringGeometry args={[4, 7, 32]} />
        <meshBasicMaterial
          color={isLive ? '#FF5722' : '#FBBF24'}
          transparent
          opacity={isLive ? 0.8 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Interactive HTML Pin */}
      <Html position={[0, pinY + 4, 0]} center distanceFactor={280} zIndexRange={[20, 0]}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(event);
          }}
          className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-xl transition-transform hover:scale-110 cursor-pointer whitespace-nowrap border ${
            isLive
              ? 'bg-[#FF5722] text-white border-orange-200/70'
              : 'bg-[#FBBF24] text-slate-950 border-amber-200/80'
          } ${isSelected ? 'ring-2 ring-white scale-110' : ''}`}
        >
          {isLive && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
          )}
          <span>{event.title}</span>
        </button>
      </Html>
    </group>
  );
}

function CampusScene({ controlsRef }) {
  const {
    locations,
    updateLocationCoordinatesFromScene,
    selectedCategory,
    showLabels,
    showEventMarkers,
    selectedLocation,
    selectLocation,
    startLocation,
    endLocation,
    navPathPoints,
    userLocation,
    events,
    selectedEvent,
    focusEvent,
    isPickingCoords,
    setPickedCoords,
    setIsPickingCoords,
    cameraFocusTarget,
  } = useCampus();

  const { scene } = useGLTF('/data/vit_map.glb');
  const { camera } = useThree();
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const focusAnimRef = useRef(null);
  const pointerDownPosRef = useRef(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Extract 3D bounding box centers for buildings in vit_map.glb
  useEffect(() => {
    if (!clonedScene) return;
    const coordsMap = new Map();
    const box = new THREE.Box3();
    const center = new THREE.Vector3();

    clonedScene.traverse((obj) => {
      const name = (obj.name || '').trim();
      const parentName = (obj.parent?.name || '').trim();
      let key = '';
      if (buildingsMetadata[name]) key = name;
      else if (buildingsMetadata[parentName]) key = parentName;

      if (key) {
        obj.userData.buildingId = key;
        if (!coordsMap.has(key)) {
          box.setFromObject(obj);
          if (!box.isEmpty()) {
            box.getCenter(center);
            coordsMap.set(key, { x: center.x, y: box.max.y, z: center.z });
          }
        }
      }
    });

    if (coordsMap.size > 0) {
      updateLocationCoordinatesFromScene(coordsMap);
    }
  }, [clonedScene, updateLocationCoordinatesFromScene]);

  // Smooth camera focus when cameraFocusTarget changes
  useEffect(() => {
    if (!cameraFocusTarget) return;
    focusAnimRef.current = {
      target: new THREE.Vector3(cameraFocusTarget.x, 0, cameraFocusTarget.z),
      camPos: new THREE.Vector3(
        cameraFocusTarget.x + 85,
        115,
        cameraFocusTarget.z + 125
      ),
      alpha: 0,
    };
  }, [cameraFocusTarget]);

  useFrame((_, delta) => {
    if (focusAnimRef.current && controlsRef.current) {
      const anim = focusAnimRef.current;
      const step = Math.min(1, delta * 3.5);
      controlsRef.current.target.lerp(anim.target, step);
      camera.position.lerp(anim.camPos, step);
      controlsRef.current.update();
      if (
        controlsRef.current.target.distanceTo(anim.target) < 1.5 &&
        camera.position.distanceTo(anim.camPos) < 2.5
      ) {
        focusAnimRef.current = null;
      }
    }
  });

  const handlePointerDown = (e) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    // Cancel any ongoing camera focus animation as soon as the user interacts
    focusAnimRef.current = null;
  };

  const handlePointerClick = (e) => {
    e.stopPropagation();

    // Ignore clicks that were actually map drags/pans/orbits
    if (pointerDownPosRef.current) {
      const dist = Math.hypot(
        e.clientX - pointerDownPosRef.current.x,
        e.clientY - pointerDownPosRef.current.y
      );
      pointerDownPosRef.current = null;
      if (dist > 5) return;
    }

    const pt = e.point;

    if (isPickingCoords) {
      const gps = sceneToLatLng(pt.x, pt.z);
      setPickedCoords({
        x: Number(pt.x.toFixed(3)),
        y: Number(pt.y.toFixed(3)),
        z: Number(pt.z.toFixed(3)),
        lat: gps.lat,
        lng: gps.lng,
      });
      setIsPickingCoords(false);
      return;
    }

    let curr = e.object;
    let buildingId = '';
    while (curr) {
      if (curr.userData?.buildingId) {
        buildingId = curr.userData.buildingId;
        break;
      }
      if (buildingsMetadata[curr.name]) {
        buildingId = curr.name;
        break;
      }
      curr = curr.parent;
    }

    if (buildingId) {
      const loc = locations.find((l) => l.id === buildingId);
      if (loc) selectLocation(loc);
    }
  };

  const visibleLocations = useMemo(() => {
    if (selectedCategory === 'All') return locations;
    const cat = selectedCategory.toLowerCase();
    return locations.filter((l) => (l.type || '').toLowerCase() === cat);
  }, [locations, selectedCategory]);

  const now = Date.now();

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[180, 280, 150]} intensity={1.5} castShadow />
      <directionalLight position={[-150, 120, -150]} intensity={0.5} />

      <primitive
        object={clonedScene}
        onPointerDown={handlePointerDown}
        onClick={handlePointerClick}
        onPointerOver={(e) => {
          const id = e.object?.userData?.buildingId;
          if (id) setHoveredBuilding(id);
        }}
        onPointerOut={() => setHoveredBuilding(null)}
      />

      {userLocation && (
        <CurrentLocationMarker position={userLocation} heading={userLocation?.heading || 0} />
      )}
      <NavigationPath points={navPathPoints} />

      {/* Building Labels */}
      {showLabels &&
        visibleLocations.map((loc) => {
          if (!loc.coordinates) return null;
          const isStart = startLocation?.id === loc.id;
          const isEnd = endLocation?.id === loc.id;
          const isSelected = selectedLocation?.id === loc.id;
          const isHovered = hoveredBuilding === loc.id;

          let pillClass =
            'bg-white/95 text-slate-900 border-slate-200/80 hover:bg-purple-50';
          if (isStart) pillClass = 'bg-[#10B981] text-white border-emerald-300';
          else if (isEnd) pillClass = 'bg-[#F43F5E] text-white border-rose-300';
          else if (isSelected) pillClass = 'bg-[#A855F7] text-white border-purple-300';
          else if (isHovered) pillClass = 'bg-purple-100 text-slate-900 border-purple-400';

          return (
            <Html
              key={loc.id}
              position={[
                loc.coordinates.x,
                (loc.coordinates.y || 0) + 12,
                loc.coordinates.z,
              ]}
              center
              distanceFactor={320}
              zIndexRange={[10, 0]}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  selectLocation(loc);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-md border transition-transform hover:scale-105 cursor-pointer whitespace-nowrap ${pillClass}`}
              >
                {loc.name}
              </button>
            </Html>
          );
        })}

      {/* 3D Event Pins (toggled via Markers switch; off by default) */}
      {showEventMarkers &&
        events.map((ev) => {
          const start = new Date(ev.startTime).getTime();
          const end = new Date(ev.endTime).getTime();
          const isLive = start <= now && now <= end;
          return (
            <EventPin3D
              key={ev._id}
              event={ev}
              isLive={isLive}
              isSelected={selectedEvent?._id === ev._id}
              onSelect={focusEvent}
            />
          );
        })}
    </>
  );
}

useGLTF.preload('/data/vit_map.glb');
useGLTF.preload('/data/current_location.glb');

export default function CampusMap3D() {
  const controlsRef = useRef();
  const { isPickingCoords, setIsPickingCoords, locationNotice, setLocationNotice } = useCampus();

  return (
    <div className="relative w-full h-full">
      {locationNotice && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100vw-2rem)] px-4 py-2.5 rounded-2xl bg-amber-500/95 text-slate-950 font-semibold text-xs sm:text-sm shadow-xl flex items-center justify-between gap-3">
          <span>{locationNotice}</span>
          <button
            type="button"
            onClick={() => setLocationNotice(null)}
            className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-xs cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {isPickingCoords && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-amber-500 text-slate-950 font-semibold text-sm shadow-xl flex items-center gap-3">
          <span>Click anywhere on the 3D campus map to pick event coordinates</span>
          <button
            type="button"
            onClick={() => setIsPickingCoords(false)}
            className="px-2 py-0.5 rounded bg-slate-900 text-white text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      <Canvas
        shadows
        camera={{ position: [0, 1450, 1], fov: 45, near: 1, far: 6000 }}
        className={`w-full h-full ${isPickingCoords ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <color attach="background" args={['#7ec8f2']} />
        <fog attach="fog" args={['#b8e1f7', 1800, 4800]} />
        <BlueSkyDome />

        <React.Suspense
          fallback={
            <Html center>
              <div className="hud-glass px-5 py-3 rounded-2xl text-sm font-medium text-blue-200 flex items-center gap-3">
                <span className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                Loading VIT Chennai 3D Campus...
              </div>
            </Html>
          }
        >
          <CampusScene controlsRef={controlsRef} />
        </React.Suspense>

        <OrbitControls
          ref={controlsRef}
          target={[0, 0, 0]}
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={30}
          maxDistance={2000}
        />
      </Canvas>
    </div>
  );
}
