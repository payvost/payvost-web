import express, { Request, Response } from 'express';
const app = express();
app.get('/', (req: Request, res: Response) => res.send('Fraud Service Running'));
app.listen(3006, () => console.log('Fraud Service listening on port 3006'));
