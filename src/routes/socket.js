import express from 'express';

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ status: 'Socket server running' });
});

export { router as socketRouter };