import express, { Request, Response } from 'express';
const app = express();
app.get('/', (req: Request, res: Response) => res.send('Currency Service Running'));
app.listen(3005, () => console.log('Currency Service listening on port 3005'));
