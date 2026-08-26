import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    team: {
      type: String,
      required: true,
      default: 'Core Engineering',
    },
    environment: {
      type: String,
      enum: ['Production', 'Staging', 'Development'],
      default: 'Production',
    },
    criticality: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Healthy', 'Degraded', 'Unhealthy', 'Maintenance'],
      default: 'Healthy',
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
