import { Router } from 'express';
import { getBrand, listBrands, saveBrand, deleteBrand } from '../../lib/brands';

const router = Router();

// List all brands
router.get('/', (req, res) => {
  const brands = listBrands();
  res.json(brands);
});

// Get a specific brand
router.get('/:id', (req, res) => {
  const brand = getBrand(req.params.id);
  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }
  res.json({ brand });
});

// Create or update a brand
router.post('/', async (req, res) => {
  try {
    const brand = await saveBrand(req.body);
    res.json({ brand, message: 'Brand saved successfully' });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to save brand' });
  }
});

// Update a brand
router.put('/:id', async (req, res) => {
  try {
    const brand = await saveBrand({ ...req.body, id: req.params.id });
    res.json({ brand, message: 'Brand updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update brand' });
  }
});

// Delete a brand
router.delete('/:id', async (req, res) => {
  try {
    await deleteBrand(req.params.id);
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to delete brand' });
  }
});

export default router;
