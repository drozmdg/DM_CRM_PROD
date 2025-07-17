// Simple test server to verify the app loads
const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

// Mock API endpoints
app.get('/api/customers', (req, res) => {
  res.json([
    { id: '1', name: 'Test Customer 1', phase: 'Active', active: true },
    { id: '2', name: 'Test Customer 2', phase: 'Planning', active: true }
  ]);
});

app.get('/api/dashboard/metrics', (req, res) => {
  res.json({
    totalCustomers: 2,
    activeProcesses: 5,
    totalServices: 3,
    recentActivity: []
  });
});

app.get('/api/processes', (req, res) => {
  res.json([]);
});

app.get('/api/teams', (req, res) => {
  res.json([]);
});

app.get('/api/services', (req, res) => {
  res.json([]);
});

// Serve static files from client dist
app.use(express.static(path.join(__dirname, 'client/dist')));

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});