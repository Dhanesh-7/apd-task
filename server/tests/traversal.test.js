import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Service } from '../src/models/Service.js';
import { Dependency } from '../src/models/Dependency.js';
import { Simulation } from '../src/models/Simulation.js';
import { calculateBlastRadius } from '../src/services/traversalEngine.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Service.deleteMany({});
  await Dependency.deleteMany({});
  await Simulation.deleteMany({});
});

describe('Graph Traversal & Blast Radius Analyzer Tests (Assessment Section 11 Requirements)', () => {

  it('Case 1: Single service with no dependencies', async () => {
    const s1 = await Service.create({
      name: 'Isolated Service',
      team: 'DevOps',
      criticality: 'Low',
    });

    const services = await Service.find().lean();
    const dependencies = await Dependency.find().lean();

    const result = calculateBlastRadius(s1._id, services, dependencies, 'Failure');

    expect(result.affectedServices).toHaveLength(0);
    expect(result.targetService.name).toBe('Isolated Service');
    expect(result.decision).toBe('LOW IMPACT');
  });

  it('Case 2: One direct dependency', async () => {
    const target = await Service.create({ name: 'Payment DB', criticality: 'Critical' });
    const directDep = await Service.create({ name: 'Payment API', criticality: 'Critical' });

    await Dependency.create({
      sourceService: directDep._id,
      targetService: target._id,
      relationType: 'reads_from',
    });

    const services = await Service.find().lean();
    const dependencies = await Dependency.find().lean();

    const result = calculateBlastRadius(target._id, services, dependencies, 'Failure');

    expect(result.affectedServices).toHaveLength(1);
    expect(result.affectedServices[0].affectedService.name).toBe('Payment API');
    expect(result.affectedServices[0].depth).toBe(1);
    expect(result.affectedServices[0].impactType).toBe('Direct');
  });

  it('Case 3: Multi-level dependency', async () => {
    const target = await Service.create({ name: 'Payment DB', criticality: 'Critical' });
    const api = await Service.create({ name: 'Payment API', criticality: 'Critical' });
    const portal = await Service.create({ name: 'Customer Portal', criticality: 'Critical' });

    // Customer Portal -> Payment API -> Payment DB
    await Dependency.create({ sourceService: api._id, targetService: target._id });
    await Dependency.create({ sourceService: portal._id, targetService: api._id });

    const services = await Service.find().lean();
    const dependencies = await Dependency.find().lean();

    const result = calculateBlastRadius(target._id, services, dependencies, 'Failure');

    expect(result.affectedServices).toHaveLength(2);

    const direct = result.affectedServices.find((a) => a.affectedService.name === 'Payment API');
    const indirect = result.affectedServices.find((a) => a.affectedService.name === 'Customer Portal');

    expect(direct).toBeDefined();
    expect(direct.depth).toBe(1);
    expect(direct.impactType).toBe('Direct');

    expect(indirect).toBeDefined();
    expect(indirect.depth).toBe(2);
    expect(indirect.impactType).toBe('Indirect');
    expect(indirect.path).toEqual(['Customer Portal', 'Payment API', 'Payment DB']);
    expect(indirect.explanation).toBe('Customer Portal is affected through Customer Portal → Payment API → Payment DB.');
  });

  it('Case 4: Circular dependency handling', async () => {
    // Loop: Node A -> Node B -> Node C -> Node A
    const a = await Service.create({ name: 'Service A', criticality: 'Medium' });
    const b = await Service.create({ name: 'Service B', criticality: 'Medium' });
    const c = await Service.create({ name: 'Service C', criticality: 'Medium' });

    await Dependency.create({ sourceService: b._id, targetService: a._id });
    await Dependency.create({ sourceService: c._id, targetService: b._id });
    await Dependency.create({ sourceService: a._id, targetService: c._id });

    const services = await Service.find().lean();
    const dependencies = await Dependency.find().lean();

    // Trigger failure on A
    const result = calculateBlastRadius(a._id, services, dependencies, 'Failure');

    // Should include B (depth 1) and C (depth 2), without infinite loop or duplicate A
    expect(result.affectedServices).toHaveLength(2);
    const affectedNames = result.affectedServices.map((x) => x.affectedService.name);
    expect(affectedNames).toContain('Service B');
    expect(affectedNames).toContain('Service C');
    expect(affectedNames).not.toContain('Service A');
  });

  it('Case 5: Critical service in blast radius becomes HIGH IMPACT', async () => {
    const db = await Service.create({ name: 'Generic DB', criticality: 'Low' });
    const criticalApp = await Service.create({ name: 'Critical Billing Gateway', criticality: 'Critical' });

    await Dependency.create({ sourceService: criticalApp._id, targetService: db._id });

    const services = await Service.find().lean();
    const dependencies = await Dependency.find().lean();

    const result = calculateBlastRadius(db._id, services, dependencies, 'Planned Change');

    expect(result.decision).toBe('HIGH IMPACT');
  });

  it('Case 6: Repeated simulation history storage without changing topology', async () => {
    const target = await Service.create({ name: 'Core DB', criticality: 'High' });
    const client = await Service.create({ name: 'Web API', criticality: 'High' });

    await Dependency.create({ sourceService: client._id, targetService: target._id });

    const services = await Service.find().lean();
    const dependencies = await Dependency.find().lean();

    const initialDepCount = (await Dependency.find()).length;

    // Run simulation 1
    const run1 = calculateBlastRadius(target._id, services, dependencies, 'Failure');
    await Simulation.create({
      service: target._id,
      scenario: 'Failure',
      score: run1.score,
      decision: run1.decision,
    });

    // Run simulation 2
    const run2 = calculateBlastRadius(target._id, services, dependencies, 'Degraded');
    await Simulation.create({
      service: target._id,
      scenario: 'Degraded',
      score: run2.score,
      decision: run2.decision,
    });

    const simCount = await Simulation.countDocuments();
    const finalDepCount = await Dependency.countDocuments();

    expect(simCount).toBe(2);
    expect(finalDepCount).toBe(initialDepCount);
  });
});
