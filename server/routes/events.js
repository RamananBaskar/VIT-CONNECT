const express = require('express');
const Event = require('../models/Event');
const { protect, requireApprovedPoster } = require('../middleware/auth');

const router = express.Router();

// GET /api/events - Public; returns live and upcoming events (endTime >= now)
router.get('/', async (_req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({ endTime: { $gte: now } })
      .populate('createdBy', 'name email clubName role')
      .sort({ startTime: 1 });

    const live = [];
    const upcoming = [];

    for (const ev of events) {
      const start = new Date(ev.startTime);
      const end = new Date(ev.endTime);
      if (start <= now && now <= end) {
        live.push(ev);
      } else if (start > now) {
        upcoming.push(ev);
      }
    }

    return res.json({
      events,
      live,
      upcoming,
      serverTime: now.toISOString(),
    });
  } catch (err) {
    console.error('Get events error:', err);
    return res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// POST /api/events - Protected; requires admin or approved club member
router.post('/', protect, requireApprovedPoster, async (req, res) => {
  try {
    const {
      title,
      description,
      clubName,
      locationName,
      nodeId,
      coordinates,
      startTime,
      endTime,
      category,
    } = req.body;

    if (!title || !locationName || !startTime || !endTime || !coordinates) {
      return res.status(400).json({
        message: 'title, locationName, coordinates, startTime, and endTime are required',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid startTime or endTime' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'endTime must be after startTime' });
    }

    const x = Number(coordinates.x);
    const y = Number(coordinates.y ?? 0);
    const z = Number(coordinates.z);
    if (!Number.isFinite(x) || !Number.isFinite(z)) {
      return res.status(400).json({ message: 'Valid numeric x and z coordinates are required' });
    }

    const event = await Event.create({
      title: title.trim(),
      description: (description || '').trim(),
      clubName: (clubName || req.user.clubName || 'VIT Campus Club').trim(),
      createdBy: req.user._id,
      locationName: locationName.trim(),
      nodeId: (nodeId || '').trim(),
      coordinates: {
        x,
        y: Number.isFinite(y) ? y : 0,
        z,
        lat: coordinates.lat !== undefined && coordinates.lat !== null ? Number(coordinates.lat) : null,
        lng: coordinates.lng !== undefined && coordinates.lng !== null ? Number(coordinates.lng) : null,
      },
      startTime: start,
      endTime: end,
      category: (category || 'Technical').trim(),
    });

    const populated = await event.populate('createdBy', 'name email clubName role');
    return res.status(201).json({ event: populated });
  } catch (err) {
    console.error('Create event error:', err);
    return res.status(500).json({ message: 'Failed to create event' });
  }
});

// DELETE /api/events/:id - Protected; owner or Admin
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isOwner = String(event.createdBy) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    return res.json({ message: 'Event deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Delete event error:', err);
    return res.status(500).json({ message: 'Failed to delete event' });
  }
});

module.exports = router;
