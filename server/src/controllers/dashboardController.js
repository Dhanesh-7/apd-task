import { Service } from '../models/Service.js';
import { Dependency } from '../models/Dependency.js';
import { Simulation } from '../models/Simulation.js';

export async function getDashboardSummary(req, res) {
  try {
    const [services, dependencies, recentSimulations] = await Promise.all([
      Service.find().lean(),
      Dependency.find()
        .populate('sourceService', 'name criticality')
        .populate('targetService', 'name criticality')
        .lean(),
      Simulation.find()
        .populate('service', 'name criticality status')
        .sort({ startedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalServices = services.length;

    const statusCounts = {
      Healthy: 0,
      Degraded: 0,
      Unhealthy: 0,
      Maintenance: 0,
    };

    const criticalityCounts = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    services.forEach((s) => {
      if (statusCounts[s.status] !== undefined) statusCounts[s.status]++;
      if (criticalityCounts[s.criticality] !== undefined) criticalityCounts[s.criticality]++;
    });

    const criticalServices = services.filter((s) => s.criticality === 'Critical');

    // High impact dependencies: target is High or Critical
    const highImpactDependencies = dependencies.filter(
      (d) => d.targetService && (d.targetService.criticality === 'Critical' || d.targetService.criticality === 'High')
    );

    res.json({
      totalServices,
      totalDependencies: dependencies.length,
      statusCounts,
      criticalityCounts,
      criticalServicesCount: criticalServices.length,
      highImpactDependenciesCount: highImpactDependencies.length,
      criticalServices,
      recentSimulations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
