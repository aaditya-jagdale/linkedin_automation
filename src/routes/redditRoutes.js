import { Router } from 'express';
import redditController from '../controllers/redditController.js';
import formatReddit from '../middleware/formatReddit.js';

const router = Router();

router.post('/post', formatReddit, redditController.getPostByUrl);

export default router;
