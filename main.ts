import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db/connect.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
