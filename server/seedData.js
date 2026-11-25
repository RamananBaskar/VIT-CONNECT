const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');

async function seedDatabase({ reset = false } = {}) {
  if (reset) {
    await Event.deleteMany({});
    await User.deleteMany({});
  } else {
    const existingUsers = await User.countDocuments();
    const existingEvents = await Event.countDocuments();
    if (existingUsers > 0 && existingEvents > 0) {
      return { skipped: true };
    }
  }

  const adminHash = await bcrypt.hash('Admin@123', 10);
  const clubHash = await bcrypt.hash('Club@123', 10);
  const pendingHash = await bcrypt.hash('Pending@123', 10);

  const admin = await User.create({
    name: 'Campus Admin',
    email: 'admin@vit.ac.in',
    passwordHash: adminHash,
    role: 'admin',
    clubName: 'VIT Student Welfare',
    isApproved: true,
  });

  const clubMember = await User.create({
    name: 'Aarav Sharma',
    email: 'club@vit.ac.in',
    passwordHash: clubHash,
    role: 'club_member',
    clubName: 'IEEE Computer Society VITC',
    isApproved: true,
  });

  await User.create({
    name: 'Diya Nair',
    email: 'pending@vit.ac.in',
    passwordHash: pendingHash,
    role: 'club_member',
    clubName: 'Robotics & AI Club',
    isApproved: false,
  });

  const now = Date.now();
  const hour = 60 * 60 * 1000;

  const sampleEvents = [
    {
      title: 'VITC HackSprint 2026: Live Finals',
      description:
        '24-hour flagship campus hackathon demoing AI, Web3, and Smart Campus prototypes at Kamaraj Auditorium.',
      clubName: 'IEEE Computer Society VITC',
      createdBy: clubMember._id,
      locationName: 'Academic Block 3 (Kamaraj Auditorium)',
      nodeId: 'Building001',
      coordinates: {
        x: 38.366,
        y: 2,
        z: -110.207,
        lat: 12.84351842,
        lng: 80.15462572,
      },
      startTime: new Date(now - 1 * hour),
      endTime: new Date(now + 3 * hour),
      category: 'Hackathon',
    },
    {
      title: 'Open Mic & Acoustic Jam',
      description:
        'Live student performances, indie covers, and beatboxing in the North Square courtyard.',
      clubName: 'VIT Music & Cultural Club',
      createdBy: admin._id,
      locationName: 'North Square',
      nodeId: 'Building012',
      coordinates: {
        x: -38.897,
        y: 2,
        z: -171.967,
        lat: 12.84407668,
        lng: 80.15391396,
      },
      startTime: new Date(now - 0.5 * hour),
      endTime: new Date(now + 2 * hour),
      category: 'Cultural',
    },
    {
      title: 'EV & Autonomous Rover Showcase',
      description:
        'Live demonstration of student-built electric powertrain and ROS autonomous rovers outside AB1.',
      clubName: 'SAE & Robotics Club',
      createdBy: clubMember._id,
      locationName: 'Academic Block 1',
      nodeId: 'Building007',
      coordinates: {
        x: -92.441,
        y: 2,
        z: -117.2,
        lat: 12.84358163,
        lng: 80.15342071,
      },
      startTime: new Date(now + 2 * hour),
      endTime: new Date(now + 5 * hour),
      category: 'Technical',
    },
    {
      title: 'Inter-Hostel Badminton & Table Tennis',
      description:
        'Knockout matches for the VITC President Cup inside GymKhaana Indoor Arena.',
      clubName: 'VIT Sports Council',
      createdBy: admin._id,
      locationName: 'GymKhaana',
      nodeId: 'Building010',
      coordinates: {
        x: -180.088,
        y: 2,
        z: -128.577,
        lat: 12.84368448,
        lng: 80.15261329,
      },
      startTime: new Date(now + 4 * hour),
      endTime: new Date(now + 7 * hour),
      category: 'Sports',
    },
    {
      title: 'Cloud Native & Kubernetes Workshop',
      description:
        'Hands-on deployment session with Docker, Kubernetes, and observability stacks at AB2.',
      clubName: 'Google Developer Groups on Campus',
      createdBy: clubMember._id,
      locationName: 'Academic Block 2',
      nodeId: 'Building006',
      coordinates: {
        x: 231.82,
        y: 2,
        z: -47.828,
        lat: 12.84295457,
        lng: 80.15640784,
      },
      startTime: new Date(now + 20 * hour),
      endTime: new Date(now + 23 * hour),
      category: 'Workshop',
    },
  ];

  await Event.insertMany(sampleEvents);

  return {
    skipped: false,
    usersCreated: 3,
    eventsCreated: sampleEvents.length,
  };
}

module.exports = { seedDatabase };
