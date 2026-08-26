import { Dependency } from '../models/Dependency.js';
import { Service } from '../models/Service.js';
import { AuditEvent } from '../models/AuditEvent.js';

export async function getDependencies(req, res) {
  try {
    const dependencies = await Dependency.find()
      .populate('sourceService', 'name criticality status team environment')
      .populate('targetService', 'name criticality status team environment')
      .sort({ createdAt: -1 });
    res.json(dependencies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createDependency(req, res) {
  try {
    const { sourceService, targetService, relationType, criticality } = req.body;

    if (sourceService === targetService) {
      return res.status(400).json({ error: 'A service cannot depend on itself.' });
    }

    const source = await Service.findById(sourceService);
    const target = await Service.findById(targetService);
    if (!source || !target) {
      return res.status(404).json({ error: 'Source or target service not found.' });
    }

    const dependency = new Dependency({
      sourceService,
      targetService,
      relationType: relationType || 'depends_on',
      criticality: criticality || 'Medium',
    });
    await dependency.save();

    await AuditEvent.create({
      action: 'DEPENDENCY_CREATED',
      actor: req.body.actor || 'system',
      details: {
        dependencyId: dependency._id,
        source: source.name,
        target: target.name,
        relationType: dependency.relationType,
      },
    });

    const populated = await Dependency.findById(dependency._id)
      .populate('sourceService', 'name criticality status team environment')
      .populate('targetService', 'name criticality status team environment');

    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'This dependency relationship already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
}

export async function deleteDependency(req, res) {
  try {
    const deleted = await Dependency.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Dependency relationship not found' });

    await AuditEvent.create({
      action: 'DEPENDENCY_DELETED',
      actor: 'system',
      details: { dependencyId: req.params.id },
    });

    res.json({ message: 'Dependency relationship removed', dependency: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
