require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const API_BASE = 'https://api.infermedica.com/v3';

const apiHeaders = {
  'App-Id': '561bb1e6',
  'App-Key': 'b0435ed80b037385ea476e75a00feedd',
  'Content-Type': 'application/json',
  'Dev-Mode': 'true'
};

app.get('/', (req, res) => res.send('Infermedica v3 Proxy Running ✅'));

app.post('/api/diagnosis', async (req, res) => {
  try {
    const r = await fetch(`${API_BASE}/diagnosis`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Diagnosis request failed', details: err.message });
  }
});

app.get('/api/search-symptoms', async (req, res) => {
  const query = req.query.q;
  const sex = req.query.sex || 'male';
  const age = req.query.age || 30;

  const infermedicaUrl = `${API_BASE}/search?symptoms=true&phrase=${encodeURIComponent(query)}&sex=${sex}&age.value=${age}`;

  try {
    const r = await fetch(infermedicaUrl, {
      method: 'GET',
      headers: apiHeaders
    });
    const data = await r.json();
    res.json(data);
  } catch (error) {
    console.error('🔴 Search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});


app.listen(5000, () => console.log('✅ Backend running at http://localhost:5000'));
