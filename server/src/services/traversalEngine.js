// Service Dependency & Blast Radius Calculation Engine
// Built using Breadth-First Search (BFS) with reverse graph edge lookup

const CRITICALITY_WEIGHTS = { Low: 10, Medium: 25, High: 50, Critical: 100 };

/**
 * Calculates downstream blast radius for a given target service.
 * If Service B fails, any Service A that calls B will be affected.
 */
export function calculateBlastRadius(targetServiceId, servicesList, dependenciesList, scenario = 'Failure') {
  const targetIdStr = targetServiceId.toString();

  // Create a quick lookup map for all services by ID
  const serviceMap = new Map(servicesList.map((s) => [s._id.toString(), s]));
  const targetService = serviceMap.get(targetIdStr);

  if (!targetService) {
    throw new Error(`Target service with ID ${targetServiceId} not found`);
  }

  // 1. Build Reverse Adjacency Graph (Target ID -> List of Dependent Callers)
  // If A -> B (A calls B), then if B breaks, A is affected. So reverse edge maps B -> A.
  const reverseGraph = new Map();
  dependenciesList.forEach((dep) => {
    const srcId = dep.sourceService._id ? dep.sourceService._id.toString() : dep.sourceService.toString();
    const tgtId = dep.targetService._id ? dep.targetService._id.toString() : dep.targetService.toString();
    if (!reverseGraph.has(tgtId)) reverseGraph.set(tgtId, []);
    reverseGraph.get(tgtId).push(srcId);
  });

  // 2. Queue-based BFS Traversal with Cycle Safety
  const visited = new Map();
  const directDependents = (reverseGraph.get(targetIdStr) || []).filter((id) => id !== targetIdStr);

  // Initialize queue with direct callers (Depth = 1)
  const queue = [];
  for (const srcId of directDependents) {
    const s = serviceMap.get(srcId);
    if (s && !visited.has(srcId)) {
      const path = [s.name, targetService.name];
      visited.set(srcId, { depth: 1, path });
      queue.push({ id: srcId, depth: 1, path });
    }
  }

  // Process queue level-by-level
  while (queue.length > 0) {
    const { id, depth, path } = queue.shift();
    const callers = (reverseGraph.get(id) || []).filter((nextId) => nextId !== targetIdStr);

    for (const nextId of callers) {
      const nextDepth = depth + 1;
      // Cycle Protection: Skip if already visited at an equal or smaller depth
      if (!visited.has(nextId) || visited.get(nextId).depth > nextDepth) {
        const nextService = serviceMap.get(nextId);
        if (nextService) {
          const newPath = [nextService.name, ...path];
          visited.set(nextId, { depth: nextDepth, path: newPath });
          queue.push({ id: nextId, depth: nextDepth, path: newPath });
        }
      }
    }
  }

  // 3. Format Affected Services & Build Path Trace Sentences
  const affectedServices = Array.from(visited.entries()).map(([sId, val]) => {
    const s = serviceMap.get(sId);
    return {
      affectedService: s,
      depth: val.depth,
      impactType: val.depth === 1 ? 'Direct' : 'Indirect',
      explanation: `${s.name} is affected through ${val.path.join(' → ')}.`,
      path: val.path,
    };
  });

  // Sort affected services: depth ascending (1 first), then criticality descending
  affectedServices.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    return (CRITICALITY_WEIGHTS[b.affectedService.criticality] || 0) - (CRITICALITY_WEIGHTS[a.affectedService.criticality] || 0);
  });

  // 4. Calculate Overall Risk Score (0 - 100)
  let scoreSum = CRITICALITY_WEIGHTS[targetService.criticality] || 25;
  affectedServices.forEach((aff) => {
    const w = CRITICALITY_WEIGHTS[aff.affectedService.criticality] || 25;
    scoreSum += w * (1 / aff.depth); // Score decays with depth
  });
  const score = Math.min(100, Math.round(scoreSum));

  // 5. Evaluate Change Impact Gate Rules
  const allServices = [targetService, ...affectedServices.map((a) => a.affectedService)];
  const hasCritical = allServices.some((s) => s.criticality === 'Critical');
  const highOrCriticalCount = allServices.filter((s) => s.criticality === 'Critical' || s.criticality === 'High').length;

  let decision = 'REVIEW';
  if (hasCritical || highOrCriticalCount >= 2) decision = 'HIGH IMPACT';
  else if (affectedServices.length === 0 && (targetService.criticality === 'Low' || targetService.criticality === 'Medium')) decision = 'LOW IMPACT';

  // 6. Generate Actionable Pre-checks and Warnings
  const sideEffects = [];
  const recommendations = [];

  if (affectedServices.length > 0) {
    const directs = affectedServices.filter((a) => a.impactType === 'Direct').map((a) => a.affectedService.name);
    const indirects = affectedServices.filter((a) => a.impactType === 'Indirect').map((a) => a.affectedService.name);
    if (directs.length) sideEffects.push(`Direct dependent services (${directs.join(', ')}) will experience immediate request failures or degradation.`);
    if (indirects.length) sideEffects.push(`Indirect dependent applications (${indirects.join(', ')}) may face cascading latency or delayed background operations.`);
    recommendations.push(`Verify health metrics and error rates for direct dependencies (${directs.join(', ')}) prior to change execution.`);
    recommendations.push(`Schedule execution during off-peak traffic windows and confirm rollback procedures.`);
  } else {
    sideEffects.push(`No downstream services detected in the dependency graph.`);
    recommendations.push(`Proceed with standard operational checks for ${targetService.name}.`);
  }

  if (decision === 'HIGH IMPACT') {
    recommendations.unshift(`CRITICAL NOTICE: Approval from Lead Operations Engineer required due to high-impact blast radius.`);
  }

  return { targetService, scenario, score, decision, affectedServices, sideEffects, recommendations };
}

/**
 * Gets upstream and downstream connections for a specific service.
 */
export function getServiceTopology(targetServiceId, servicesList, dependenciesList) {
  const targetIdStr = targetServiceId.toString();
  const serviceMap = new Map(servicesList.map((s) => [s._id.toString(), s]));

  const getId = (val) => (val._id ? val._id.toString() : val.toString());

  // Services that targetService calls/depends on
  const upstream = dependenciesList
    .filter((d) => getId(d.sourceService) === targetIdStr)
    .map((d) => ({ dependencyId: d._id, service: serviceMap.get(getId(d.targetService)), relationType: d.relationType, criticality: d.criticality }));

  // Services that depend on targetService
  const downstream = dependenciesList
    .filter((d) => getId(d.targetService) === targetIdStr)
    .map((d) => ({ dependencyId: d._id, service: serviceMap.get(getId(d.sourceService)), relationType: d.relationType, criticality: d.criticality }));

  return { targetService: serviceMap.get(targetIdStr), upstream, downstream };
}
