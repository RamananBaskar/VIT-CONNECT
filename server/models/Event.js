const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    clubName: {
      type: String,
      required: [true, 'Club name is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    locationName: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    nodeId: {
      type: String,
      trim: true,
      default: '',
    },
    coordinates: {
      x: { type: Number, required: true },
      y: { type: Number, default: 0 },
      z: { type: Number, required: true },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    category: {
      type: String,
      trim: true,
      default: 'Technical',
    },
  },
  { timestamps: true }
);

eventSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('Event', eventSchema);
