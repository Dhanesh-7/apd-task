import { Service } from '../models/Service.js';
import { Dependency } from '../models/Dependency.js';
import { getServiceTopology } from '../services/traversalEngine.js';

export async function getFullTopology(req, res) {
  try {
    const services = await Service.find().lean();
    const dependencies = await Dependency.find()
      .populate('sourceService', 'name criticality status team environment')
      .populate('targetService', 'name criticality status team environment')
      .lean();

    res.json({ services, dependencies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getTopologyForService(req, res) {
  try {
    const { serviceId } = req.params;
    const services = await Service.find().lean();
    const dependencies = await Dependency.find().lean();

    const topology = getServiceTopology(serviceId, services, dependencies);
    res.json(topology);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
