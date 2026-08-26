import { describe, it, expect } from 'vitest';
import { calculateBlastRadius, getServiceTopology } from '../src/services/traversalEngine.js';

describe('In-Memory Traversal Engine Unit Tests (Instant & Zero Dependency)', () => {

  const sampleServices = [
    { _id: 's1', name: 'Customer Portal', team: 'Web', environment: 'Production', criticality: 'Critical', status: 'Healthy' },
    { _id: 's2', name: 'Order API', team: 'Orders', environment: 'Production', criticality: 'Critical', status: 'Healthy' },
    { _id: 's3', name: 'Order DB', team: 'DBA', environment: 'Production', criticality: 'High', status: 'Healthy' },
    { _id: 's4', name: 'Notification Service', team: 'Messaging', environment: 'Production', criticality: 'Medium', status: 'Healthy' },
    { _id: 's5', name: 'Payment API', team: 'Payments', environment: 'Production', criticality: 'Critical', status: 'Healthy' },
    { _id: 's6', name: 'Payment DB', team: 'DBA', environment: 'Production', criticality: 'Critical', status: 'Healthy' },
    { _id: 's7', name: 'Isolated Service', team: 'Tools', environment: 'Production', criticality: 'Low', status: 'Healthy' },
    // Cycle services
    { _id: 'ca', name: 'Service Alpha', team: 'Cycle', environment: 'Dev', criticality: 'Low', status: 'Healthy' },
    { _id: 'cb', name: 'Service Beta', team: 'Cycle', environment: 'Dev', criticality: 'Low', status: 'Healthy' },
    { _id: 'cc', name: 'Service Gamma', team: 'Cycle', environment: 'Dev', criticality: 'Low', status: 'Healthy' },
  ];

  const sampleDependencies = [
    { _id: 'd1', sourceService: 's1', targetService: 's2', relationType: 'calls', criticality: 'Critical' },
    { _id: 'd2', sourceService: 's2', targetService: 's3', relationType: 'reads_from', criticality: 'High' },
    { _id: 'd3', sourceService: 's2', targetService: 's4', relationType: 'publishes_to', criticality: 'Medium' },
    { _id: 'd4', sourceService: 's2', targetService: 's5', relationType: 'calls', criticality: 'Critical' },
    { _id: 'd5', sourceService: 's5', targetService: 's6', relationType: 'reads_from', criticality: 'Critical' },
    // Cycle: Alpha -> Beta -> Gamma -> Alpha
    { _id: 'c1', sourceService: 'ca', targetService: 'cb', relationType: 'calls', criticality: 'Low' },
    { _id: 'c2', sourceService: 'cb', targetService: 'cc', relationType: 'calls', criticality: 'Low' },
    { _id: 'c3', sourceService: 'cc', targetService: 'ca', relationType: 'calls', criticality: 'Low' },
  ];

  it('Scenario 1: Single service with no dependencies', () => {
    const result = calculateBlastRadius('s7', sampleServices, sampleDependencies, 'Failure');
    expect(result.affectedServices).toHaveLength(0);
    expect(result.targetService.name).toBe('Isolated Service');
    expect(result.decision).toBe('LOW IMPACT');
  });

  it('Scenario 2: One direct dependency', () => {
    // Payment API -> Payment DB. Outage on Payment DB -> Payment API is direct impact (depth 1)
    const result = calculateBlastRadius('s6', sampleServices, sampleDependencies, 'Failure');
    const direct = result.affectedServices.find((a) => a.affectedService.name === 'Payment API');
    expect(direct).toBeDefined();
    expect(direct.depth).toBe(1);
    expect(direct.impactType).toBe('Direct');
  });

  it('Scenario 3: Multi-level dependency chain & path tracing', () => {
    // Customer Portal -> Order API -> Payment API -> Payment DB
    // Failure on Payment DB
    const result = calculateBlastRadius('s6', sampleServices, sampleDependencies, 'Failure');
    expect(result.affectedServices.length).toBeGreaterThanOrEqual(3);

    const portal = result.affectedServices.find((a) => a.affectedService.name === 'Customer Portal');
    expect(portal).toBeDefined();
    expect(portal.impactType).toBe('Indirect');
    expect(portal.path).toEqual(['Customer Portal', 'Order API', 'Payment API', 'Payment DB']);
    expect(portal.explanation).toBe('Customer Portal is affected through Customer Portal → Order API → Payment API → Payment DB.');
  });

  it('Scenario 4: Circular dependency handling', () => {
    // Failure on Alpha (ca). Dependents: Gamma -> Beta -> Alpha
    const result = calculateBlastRadius('ca', sampleServices, sampleDependencies, 'Failure');
    const affectedNames = result.affectedServices.map((x) => x.affectedService.name);
    expect(affectedNames).toContain('Service Gamma');
    expect(affectedNames).toContain('Service Beta');
    expect(affectedNames).not.toContain('Service Alpha');
    expect(result.affectedServices).toHaveLength(2);
  });

  it('Scenario 5: Critical service in blast radius becomes HIGH IMPACT', () => {
    // Payment DB is Critical. Failure on Payment DB -> Gate decision must be HIGH IMPACT
    const result = calculateBlastRadius('s6', sampleServices, sampleDependencies, 'Planned Change');
    expect(result.decision).toBe('HIGH IMPACT');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('Scenario 6: Service topology extraction', () => {
    const topology = getServiceTopology('s2', sampleServices, sampleDependencies);
    expect(topology.targetService.name).toBe('Order API');
    expect(topology.upstream).toHaveLength(3); // s3, s4, s5
    expect(topology.downstream).toHaveLength(1); // s1
  });
});
