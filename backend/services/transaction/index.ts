import express, { Request, Response } from 'express';
const app = express();
app.get('/', (req: Request, res: Response) => res.send('Transaction Service Running'));
app.listen(3004, () => console.log('Transaction Service listening on port 3004'));
