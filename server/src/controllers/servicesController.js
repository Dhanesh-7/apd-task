import { Service } from '../models/Service.js';
import { Dependency } from '../models/Dependency.js';
import { AuditEvent } from '../models/AuditEvent.js';

export async function getServices(req, res) {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getServiceById(req, res) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createService(req, res) {
  try {
    const { name, team, environment, criticality, status, description } = req.body;
    const newService = new Service({
      name,
      team,
      environment,
      criticality,
      status,
      description,
    });
    await newService.save();

    await AuditEvent.create({
      action: 'SERVICE_CREATED',
      actor: req.body.actor || 'system',
      details: { serviceId: newService._id, name: newService.name },
    });

    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateService(req, res) {
  try {
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Service not found' });

    await AuditEvent.create({
      action: 'SERVICE_UPDATED',
      actor: req.body.actor || 'system',
      details: { serviceId: updated._id, name: updated.name },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteService(req, res) {
  try {
    const serviceId = req.params.id;
    const deleted = await Service.findByIdAndDelete(serviceId);
    if (!deleted) return res.status(404).json({ error: 'Service not found' });

    // Clean up dependencies referencing this service
    await Dependency.deleteMany({
      $or: [{ sourceService: serviceId }, { targetService: serviceId }],
    });

    await AuditEvent.create({
      action: 'SERVICE_DELETED',
      actor: 'system',
      details: { serviceId, name: deleted.name },
    });

    res.json({ message: 'Service and associated dependencies deleted', service: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
