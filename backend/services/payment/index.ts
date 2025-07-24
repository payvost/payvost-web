import express, { Request, Response } from 'express';
const app = express();
app.get('/', (req: Request, res: Response) => res.send('Payment Service Running'));
app.listen(3003, () => console.log('Payment Service listening on port 3003'));
