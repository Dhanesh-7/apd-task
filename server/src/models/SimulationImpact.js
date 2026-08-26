import mongoose from 'mongoose';

const simulationImpactSchema = new mongoose.Schema(
  {
    simulation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Simulation',
      required: true,
    },
    affectedService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    depth: {
      type: Number,
      required: true,
    },
    impactType: {
      type: String,
      enum: ['Direct', 'Indirect'],
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    path: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const SimulationImpact = mongoose.model('SimulationImpact', simulationImpactSchema);
