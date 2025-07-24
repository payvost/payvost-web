import express, { Request, Response } from 'express';
const app = express();
app.get('/', (req: Request, res: Response) => res.send('Notification Service Running'));
app.listen(3007, () => console.log('Notification Service listening on port 3007'));
