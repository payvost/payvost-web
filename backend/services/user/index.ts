import express from 'express';
import userRoutes from './routes/userRoutes';

const app = express();
app.use(express.json());
app.use('/user', userRoutes);

app.get('/', (req, res) => res.send('User Service Running'));
app.listen(3001, () => console.log('User Service listening on port 3001'));
