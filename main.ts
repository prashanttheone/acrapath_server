import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db/connect.js';
import apiRoutes from './src/controllers/routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());
app.use('/api', apiRoutes);

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
