import mongoose from 'mongoose';

const auditEventSchema = new mongoose.Schema(
  {
    simulation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Simulation',
      default: null,
    },
    action: {
      type: String,
      required: true,
    },
    actor: {
      type: String,
      default: 'system',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const AuditEvent = mongoose.model('AuditEvent', auditEventSchema);
