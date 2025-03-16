// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); //enable the body parser middleware to parse the req.body into json format

//PostgreSQL Connection Pool
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

//PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Use a CA certificate in production
  },
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to database', err);
  } else {
    console.log('Connected to PostgreSQL database at:', res.rows[0].now);
  }
});

// API Routes
// GET all jobs
// app.get('/api/jobs', async (req, res) => {
//   try {
//     const { rows } = await pool.query('SELECT * FROM jobs');
//     res.json(rows);
//   } catch (error) {
//     console.error('Error fetching jobs', error);
//     res.status(500).json({ error: 'Error fetching jobs' });
//   }
// });
app.get('/api/jobs', async (req, res) => {
  try {
    console.log("Received GET request to /api/jobs");
    const result = await pool.query('SELECT * FROM jobs'); // Retrieve all jobs
    console.log("Query result:", result);
    res.status(200).json(result.rows); // Send the jobs as JSON
  } catch (error) {
    console.error("Error getting jobs:", error);
    res.status(500).json({ error: 'Error getting jobs' });
  }
});
// POST a new job
app.post('/api/jobs', async (req, res) => {
  try {
    const { jobTitle, companyName, location, jobType, salaryRange, jobDescription, requirements, responsibilities, applicationDeadline } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO jobs (jobTitle, companyName, location, jobType, salaryRange, jobDescription, requirements, responsibilities, applicationDeadline) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [jobTitle, companyName, location, jobType, salaryRange, jobDescription, requirements, responsibilities, applicationDeadline]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating job', error);
    res.status(500).json({ error: 'Error creating job' });
  }
});

// GET a single job by ID
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching job', error);
    res.status(500).json({ error: 'Error fetching job' });
  }
});
// PUT (update) a job
app.put('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { jobTitle, companyName, location, jobType, salaryRange, jobDescription, requirements, responsibilities, applicationDeadline } = req.body;

    const { rows } = await pool.query(
      'UPDATE jobs SET jobTitle = $1, companyName = $2, location = $3, jobType = $4, salaryRange = $5, jobDescription = $6, requirements = $7, responsibilities = $8, applicationDeadline = $9 WHERE id = $10 RETURNING *',
      [jobTitle, companyName, location, jobType, salaryRange, jobDescription, requirements, responsibilities, applicationDeadline, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating job', error);
    res.status(500).json({ error: 'Error updating job' });
  }
});

// DELETE a job
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job', error);
    res.status(500).json({ error: 'Error deleting job' });
  }
});
// Example route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

