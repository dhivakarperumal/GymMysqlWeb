const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

const members = [
  {
    name: "John Doe",
    phone: "9876543210",
    email: "john.doe@example.com",
    gender: "Male",
    height: 180,
    weight: 85,
    bmi: 26.2,
    plan: "Pro Plus",
    duration: 12,
    joinDate: "2026-03-16",
    expiryDate: "2027-03-16",
    status: "active",
    address: "123 Gym Street, Fitness City",
    notes: "Regular athlete, focused on strength training.",
    username: "john.doe"
  },
  {
    name: "Jane Smith",
    phone: "9876543211",
    email: "jane.smith@example.com",
    gender: "Female",
    height: 165,
    weight: 60,
    bmi: 22.0,
    plan: "Standard",
    duration: 6,
    joinDate: "2026-03-16",
    expiryDate: "2026-09-16",
    status: "active",
    address: "456 Wellness Ave, Health Town",
    notes: "Wants to improve flexibility and core strength.",
    username: "jane.smith"
  }
];

async function seed() {
  for (const member of members) {
    try {
      const res = await axios.post(`${API_BASE}/members`, member);
      console.log(`Added ${member.name}:`, res.data.member_id || res.data.id);
    } catch (err) {
      console.error(`Failed to add ${member.name}:`, err.response?.data || err.message);
    }
  }
}

seed();
