import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    scenario: {
      type: String,
      enum: ['Failure', 'Degraded', 'Planned Change'],
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    decision: {
      type: String,
      enum: ['LOW IMPACT', 'REVIEW', 'HIGH IMPACT'],
      required: true,
    },
    actor: {
      type: String,
      default: 'ops-engineer',
    },
    summary: {
      type: String,
      default: '',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Simulation = mongoose.model('Simulation', simulationSchema);
