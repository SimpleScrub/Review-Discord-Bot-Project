import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/reviews
// Query params: category, authorId, search, page, limit
router.get('/', async (req: Request, res: Response) => {
  const { category, authorId, search, page = '1', limit = '20' } = req.query as Record<string, string>;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(category && { category }),
    ...(authorId && { authorId }),
    ...(search && { subject: { contains: search } }),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.review.count({ where }),
  ]);

  res.json({ reviews, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/reviews/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  res.json(review);
});

// GET /api/reviews/categories/list
router.get('/categories/list', async (_req: Request, res: Response) => {
  const categories = await prisma.review.findMany({
    select: { category: true },
    distinct: ['category'],
  });
  res.json(categories.map((c) => c.category));
});

export default router;
