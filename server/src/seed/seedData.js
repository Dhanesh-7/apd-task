import { Service } from '../models/Service.js';
import { Dependency } from '../models/Dependency.js';
import { AuditEvent } from '../models/AuditEvent.js';

export async function seedDatabase() {
  // Clear existing data
  await Service.deleteMany({});
  await Dependency.deleteMany({});
  await AuditEvent.deleteMany({});

  console.log('[Seed] Cleared existing services and dependencies.');

  // Create Services
  const servicesData = [
    { name: 'Customer Portal', team: 'Customer Experience', environment: 'Production', criticality: 'Critical', status: 'Healthy', description: 'Web & Mobile portal for customer orders' },
    { name: 'Order API', team: 'Order Management', environment: 'Production', criticality: 'Critical', status: 'Healthy', description: 'Core order processing API' },
    { name: 'Order DB', team: 'Database Platform', environment: 'Production', criticality: 'High', status: 'Healthy', description: 'PostgreSQL database for active orders' },
    { name: 'Notification Service', team: 'Messaging', environment: 'Production', criticality: 'Medium', status: 'Healthy', description: 'Email and push notification engine' },
    { name: 'Payment API', team: 'Payments', environment: 'Production', criticality: 'Critical', status: 'Healthy', description: 'Payment gateway integration & checkout processing' },
    { name: 'Payment DB', team: 'Database Platform', environment: 'Production', criticality: 'Critical', status: 'Healthy', description: 'PCI-compliant payment transaction database' },
    { name: 'Auth Service', team: 'Identity & Access', environment: 'Production', criticality: 'Critical', status: 'Healthy', description: 'OAuth2 and JWT authentication provider' },
    { name: 'Inventory API', team: 'Supply Chain', environment: 'Production', criticality: 'High', status: 'Healthy', description: 'Stock availability & warehouse inventory' },
    { name: 'Inventory DB', team: 'Database Platform', environment: 'Production', criticality: 'High', status: 'Healthy', description: 'Warehouse stock database' },
    { name: 'Analytics Engine', team: 'Data Platform', environment: 'Production', criticality: 'Low', status: 'Healthy', description: 'ETL & business metrics aggregation' },
    { name: 'Reporting Service', team: 'Data Platform', environment: 'Staging', criticality: 'Low', status: 'Healthy', description: 'BI reporting service for internal tools' },
    // Circular dependency services for cycle testing
    { name: 'Service Alpha', team: 'Experimental', environment: 'Development', criticality: 'Low', status: 'Healthy', description: 'Cycle node A' },
    { name: 'Service Beta', team: 'Experimental', environment: 'Development', criticality: 'Low', status: 'Healthy', description: 'Cycle node B' },
    { name: 'Service Gamma', team: 'Experimental', environment: 'Development', criticality: 'Low', status: 'Healthy', description: 'Cycle node C' },
  ];

  const createdServices = await Service.insertMany(servicesData);
  const serviceMap = {};
  createdServices.forEach((s) => {
    serviceMap[s.name] = s._id;
  });

  console.log(`[Seed] Created ${createdServices.length} services.`);

  // Define relationships (source -> target means source depends on / calls target)
  const dependenciesData = [
    { sourceService: serviceMap['Customer Portal'], targetService: serviceMap['Order API'], relationType: 'calls', criticality: 'Critical' },
    { sourceService: serviceMap['Customer Portal'], targetService: serviceMap['Auth Service'], relationType: 'depends_on', criticality: 'Critical' },
    { sourceService: serviceMap['Order API'], targetService: serviceMap['Order DB'], relationType: 'reads_from', criticality: 'High' },
    { sourceService: serviceMap['Order API'], targetService: serviceMap['Notification Service'], relationType: 'publishes_to', criticality: 'Medium' },
    { sourceService: serviceMap['Order API'], targetService: serviceMap['Payment API'], relationType: 'calls', criticality: 'Critical' },
    { sourceService: serviceMap['Order API'], targetService: serviceMap['Inventory API'], relationType: 'calls', criticality: 'High' },
    { sourceService: serviceMap['Payment API'], targetService: serviceMap['Payment DB'], relationType: 'reads_from', criticality: 'Critical' },
    { sourceService: serviceMap['Payment API'], targetService: serviceMap['Auth Service'], relationType: 'depends_on', criticality: 'Critical' },
    { sourceService: serviceMap['Inventory API'], targetService: serviceMap['Inventory DB'], relationType: 'reads_from', criticality: 'High' },
    { sourceService: serviceMap['Notification Service'], targetService: serviceMap['Auth Service'], relationType: 'depends_on', criticality: 'Medium' },
    { sourceService: serviceMap['Analytics Engine'], targetService: serviceMap['Order DB'], relationType: 'reads_from', criticality: 'Low' },
    { sourceService: serviceMap['Analytics Engine'], targetService: serviceMap['Payment DB'], relationType: 'reads_from', criticality: 'Low' },
    { sourceService: serviceMap['Reporting Service'], targetService: serviceMap['Analytics Engine'], relationType: 'depends_on', criticality: 'Low' },
    // Cycle loop: Alpha -> Beta -> Gamma -> Alpha
    { sourceService: serviceMap['Service Alpha'], targetService: serviceMap['Service Beta'], relationType: 'calls', criticality: 'Low' },
    { sourceService: serviceMap['Service Beta'], targetService: serviceMap['Service Gamma'], relationType: 'calls', criticality: 'Low' },
    { sourceService: serviceMap['Service Gamma'], targetService: serviceMap['Service Alpha'], relationType: 'calls', criticality: 'Low' },
  ];

  const createdDeps = await Dependency.insertMany(dependenciesData);
  console.log(`[Seed] Created ${createdDeps.length} dependency relationships.`);

  await AuditEvent.create({
    action: 'SEED_DATA_INITIALIZED',
    actor: 'seed-script',
    details: {
      servicesCount: createdServices.length,
      dependenciesCount: createdDeps.length,
    },
  });

  return { servicesCount: createdServices.length, dependenciesCount: createdDeps.length };
}
