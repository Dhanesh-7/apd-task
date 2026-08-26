import mongoose from 'mongoose';

const dependencySchema = new mongoose.Schema(
  {
    sourceService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    targetService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    relationType: {
      type: String,
      enum: ['depends_on', 'calls', 'publishes_to', 'reads_from'],
      default: 'depends_on',
    },
    criticality: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
  },
  { timestamps: true }
);

// Prevent duplicate relationship between same source and target
dependencySchema.index({ sourceService: 1, targetService: 1 }, { unique: true });

export const Dependency = mongoose.model('Dependency', dependencySchema);
