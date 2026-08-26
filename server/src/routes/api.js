import { Router } from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../controllers/servicesController.js';
import {
  getDependencies,
  createDependency,
  deleteDependency,
} from '../controllers/dependenciesController.js';
import {
  getFullTopology,
  getTopologyForService,
} from '../controllers/topologyController.js';
import {
  runSimulation,
  getSimulationHistory,
  getSimulationDetails,
  clearSimulationHistory,
} from '../controllers/simulationController.js';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { seedDatabase } from '../seed/seedData.js';

const router = Router();

// Services CRUD
router.get('/services', getServices);
router.get('/services/:id', getServiceById);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// Dependencies CRUD
router.get('/dependencies', getDependencies);
router.post('/dependencies', createDependency);
router.delete('/dependencies/:id', deleteDependency);

// Topology Graph
router.get('/topology', getFullTopology);
router.get('/topology/:serviceId', getTopologyForService);

// Simulation & Impact Engine
router.post('/simulations/run', runSimulation);
router.get('/simulations/history', getSimulationHistory);
router.delete('/simulations/history', clearSimulationHistory);
router.get('/simulations/:id', getSimulationDetails);

// Operations Dashboard Summary
router.get('/dashboard/summary', getDashboardSummary);

// Database Seed Endpoint
router.post('/seed', async (req, res) => {
  try {
    const result = await seedDatabase();
    res.json({ message: 'Database successfully seeded', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
