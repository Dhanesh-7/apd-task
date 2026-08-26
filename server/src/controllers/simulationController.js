import { Service } from '../models/Service.js';
import { Dependency } from '../models/Dependency.js';
import { Simulation } from '../models/Simulation.js';
import { SimulationImpact } from '../models/SimulationImpact.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { calculateBlastRadius } from '../services/traversalEngine.js';

export async function runSimulation(req, res) {
  try {
    const { serviceId, scenario, durationMinutes = 30, actor = 'ops-engineer' } = req.body;

    if (!serviceId || !scenario) {
      return res.status(400).json({ error: 'serviceId and scenario are required.' });
    }

    const services = await Service.find().lean();
    const dependencies = await Dependency.find()
      .populate('sourceService', 'name criticality status')
      .populate('targetService', 'name criticality status')
      .lean();

    const analysis = calculateBlastRadius(serviceId, services, dependencies, scenario);

    // Save Simulation record
    const summary = `${scenario} simulation on ${analysis.targetService.name}: ${analysis.affectedServices.length} downstream services affected (${analysis.decision})`;
    
    const simulation = new Simulation({
      service: analysis.targetService._id,
      scenario,
      durationMinutes,
      score: analysis.score,
      decision: analysis.decision,
      actor,
      summary,
      startedAt: new Date(),
    });
    await simulation.save();

    // Save individual SimulationImpact records
    const impactRecords = analysis.affectedServices.map((aff) => ({
      simulation: simulation._id,
      affectedService: aff.affectedService._id,
      depth: aff.depth,
      impactType: aff.impactType,
      explanation: aff.explanation,
      path: aff.path,
    }));

    if (impactRecords.length > 0) {
      await SimulationImpact.insertMany(impactRecords);
    }

    // Save AuditEvent
    await AuditEvent.create({
      simulation: simulation._id,
      action: 'SIMULATION_EXECUTED',
      actor,
      details: {
        targetService: analysis.targetService.name,
        scenario,
        decision: analysis.decision,
        affectedCount: analysis.affectedServices.length,
        score: analysis.score,
      },
    });

    res.status(201).json({
      simulation,
      targetService: analysis.targetService,
      scenario: analysis.scenario,
      durationMinutes,
      score: analysis.score,
      decision: analysis.decision,
      affectedServices: analysis.affectedServices,
      sideEffects: analysis.sideEffects,
      recommendations: analysis.recommendations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getSimulationHistory(req, res) {
  try {
    const { search, scenario, decision } = req.query;

    const query = {};
    if (scenario) query.scenario = scenario;
    if (decision) query.decision = decision;

    const simulations = await Simulation.find(query)
      .populate('service', 'name team environment criticality status')
      .sort({ startedAt: -1 })
      .lean();

    // Filter by target service name if search term provided
    let results = simulations;
    if (search) {
      const term = search.toLowerCase();
      results = simulations.filter(
        (sim) =>
          (sim.service && sim.service.name.toLowerCase().includes(term)) ||
          sim.summary.toLowerCase().includes(term) ||
          sim.actor.toLowerCase().includes(term)
      );
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getSimulationDetails(req, res) {
  try {
    const { id } = req.params;
    const simulation = await Simulation.findById(id)
      .populate('service', 'name team environment criticality status description')
      .lean();

    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    const impacts = await SimulationImpact.find({ simulation: id })
      .populate('affectedService', 'name team environment criticality status')
      .sort({ depth: 1 })
      .lean();

    const audit = await AuditEvent.findOne({ simulation: id }).lean();

    res.json({
      simulation,
      impacts,
      audit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function clearSimulationHistory(req, res) {
  try {
    await Promise.all([
      Simulation.deleteMany({}),
      SimulationImpact.deleteMany({}),
      AuditEvent.deleteMany({ action: 'SIMULATION_EXECUTED' }),
    ]);
    res.json({ message: 'Simulation history and audit logs cleared successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
