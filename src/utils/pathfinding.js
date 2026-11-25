/**
 * A* Shortest-Path Routing & Turn-by-Turn Step Generator over public/data/path.json
 */

export function buildWaypointGraph(pathData) {
  const nodes = new Map();
  if (!pathData || !Array.isArray(pathData.waypoints)) return nodes;

  for (const wp of pathData.waypoints) {
    const id = parseInt(wp.id, 10);
    const x = parseFloat(wp.x);
    const y = parseFloat(wp.y) || 0;
    const z = parseFloat(wp.z);
    if (Number.isNaN(id) || Number.isNaN(x) || Number.isNaN(z)) continue;

    const rawConn = wp.connection ?? wp.connections ?? '';
    let connections = [];
    if (typeof rawConn === 'string') {
      connections = rawConn
        .split(',')
        .map((c) => parseInt(c.trim(), 10))
        .filter((n) => !Number.isNaN(n));
    } else if (Array.isArray(rawConn)) {
      connections = rawConn.map((c) => parseInt(c, 10)).filter((n) => !Number.isNaN(n));
    }

    nodes.set(id, {
      id,
      x,
      y,
      z,
      lat: wp.lat ? parseFloat(wp.lat) : null,
      lng: wp.lon ? parseFloat(wp.lon) : null,
      type: wp.type || 'road',
      connections,
    });
  }

  // Ensure bidirectional connections across all campus paths
  for (const [id, node] of nodes.entries()) {
    for (const neighborId of node.connections) {
      const neighbor = nodes.get(neighborId);
      if (neighbor && !neighbor.connections.includes(id)) {
        neighbor.connections.push(id);
      }
    }
  }

  return nodes;
}

export function findNearestNode(nodes, targetPos) {
  let bestId = null;
  let bestDist = Infinity;
  for (const [id, node] of nodes.entries()) {
    const dx = node.x - targetPos.x;
    const dz = node.z - targetPos.z;
    const d = dx * dx + dz * dz;
    if (d < bestDist) {
      bestDist = d;
      bestId = id;
    }
  }
  return bestId;
}

export function getEntranceNodeForLocation(location, pathData, nodes) {
  if (!location) return null;
  if (location.id && pathData?.buildingEntrances?.[location.id]?.entrances?.length) {
    const entId = pathData.buildingEntrances[location.id].entrances[0];
    if (nodes.has(entId)) return entId;
  }
  if (location.coordinates) {
    return findNearestNode(nodes, location.coordinates);
  }
  return null;
}

export function findShortestPath(nodes, startId, endId, { transportMode = 'walking', oneWayRoads = null } = {}) {
  if (!nodes.has(startId) || !nodes.has(endId)) return [];
  if (startId === endId) {
    const n = nodes.get(startId);
    return [{ x: n.x, y: n.y + 1.5, z: n.z, id: n.id }];
  }

  // Build blocked directed edges for driving mode if oneWayRoads exist
  const blockedEdges = new Set();
  if (transportMode === 'driving' && oneWayRoads) {
    for (const roadKey of ['road1', 'road2']) {
      const arr = oneWayRoads[roadKey];
      if (Array.isArray(arr)) {
        for (let i = 0; i < arr.length - 1; i++) {
          blockedEdges.add(`${arr[i + 1]}->${arr[i]}`);
        }
      }
    }
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const endNode = nodes.get(endId);

  const openSet = new Set([startId]);
  const cameFrom = new Map();
  const gScore = new Map([[startId, 0]]);
  const fScore = new Map([[startId, dist(nodes.get(startId), endNode)]]);

  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;
    for (const id of openSet) {
      const f = fScore.get(id) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        current = id;
      }
    }

    if (current === endId) {
      const path = [];
      let curr = current;
      while (curr !== undefined) {
        const n = nodes.get(curr);
        path.unshift({ x: n.x, y: n.y + 1.5, z: n.z, id: n.id });
        curr = cameFrom.get(curr);
      }
      return path;
    }

    openSet.delete(current);
    const currNode = nodes.get(current);

    for (const neighborId of currNode.connections) {
      if (blockedEdges.has(`${current}->${neighborId}`)) continue;
      const neighbor = nodes.get(neighborId);
      if (!neighbor) continue;

      const tentativeG = (gScore.get(current) ?? Infinity) + dist(currNode, neighbor);
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, current);
        gScore.set(neighborId, tentativeG);
        fScore.set(neighborId, tentativeG + dist(neighbor, endNode));
        openSet.add(neighborId);
      }
    }
  }

  return [];
}

export function computePathDistanceMeters(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
  }
  return Math.round(total);
}

/**
 * Generates turn-by-turn navigation steps from a list of 3D path points.
 */
export function generateTurnByTurnSteps(points, destinationName = 'Destination', transportMode = 'walking') {
  if (!points || points.length === 0) return [];
  if (points.length === 1) {
    return [
      {
        index: 1,
        instruction: `Arrive at ${destinationName}`,
        direction: 'arrive',
        distanceMeters: 0,
        durationMinutes: 0,
        point: points[0],
      },
    ];
  }

  const speedMps = transportMode === 'driving' ? 6.5 : 1.35;
  const rawSteps = [];
  let accumDist = 0;
  let segmentStart = points[0];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const segDist = Math.hypot(curr.x - prev.x, curr.z - prev.z);
    accumDist += segDist;

    if (i < points.length - 1) {
      const next = points[i + 1];
      const v1x = curr.x - prev.x;
      const v1z = curr.z - prev.z;
      const v2x = next.x - curr.x;
      const v2z = next.z - curr.z;
      const len1 = Math.hypot(v1x, v1z);
      const len2 = Math.hypot(v2x, v2z);

      if (len1 > 0.5 && len2 > 0.5) {
        const dot = (v1x * v2x + v1z * v2z) / (len1 * len2);
        const cross = v1x * v2z - v1z * v2x;
        const angleDeg = (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;

        if (angleDeg >= 25) {
          let instruction = 'Continue straight';
          let direction = 'straight';

          if (cross > 0) {
            instruction = angleDeg < 55 ? 'Turn slight left' : 'Turn left';
            direction = angleDeg < 55 ? 'slight-left' : 'left';
          } else {
            instruction = angleDeg < 55 ? 'Turn slight right' : 'Turn right';
            direction = angleDeg < 55 ? 'slight-right' : 'right';
          }

          const distM = Math.max(1, Math.round(accumDist));
          rawSteps.push({
            instruction,
            direction,
            distanceMeters: distM,
            durationMinutes: Math.max(0, Math.round(distM / speedMps / 60)),
            point: segmentStart,
          });
          accumDist = 0;
          segmentStart = curr;
        }
      }
    }
  }

  const finalDist = Math.max(1, Math.round(accumDist));
  rawSteps.push({
    instruction: `Arrive at ${destinationName}`,
    direction: 'arrive',
    distanceMeters: finalDist,
    durationMinutes: Math.max(0, Math.round(finalDist / speedMps / 60)),
    point: points[points.length - 1],
  });

  return rawSteps.map((s, idx) => ({ ...s, index: idx + 1 }));
}
