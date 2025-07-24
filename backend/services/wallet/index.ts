import express, { Request, Response } from 'express';
const app = express();
app.get('/', (req: Request, res: Response) => res.send('Wallet Service Running'));
app.listen(3002, () => console.log('Wallet Service listening on port 3002'));
