import { Router } from 'express';
import { getTemplate, listTemplates, TEMPLATES } from '../../lib/templates';

const router = Router();

// List all templates
router.get('/', (req, res) => {
  const templates = listTemplates();
  res.json(templates);
});

// Get a specific template
router.get('/:id', (req, res) => {
  const template = getTemplate(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json(template);
});

// Get template schema (for building forms)
router.get('/:id/schema', (req, res) => {
  const template = getTemplate(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  // Return slot definitions as a schema for form building
  const schema = {
    id: template.id,
    name: template.name,
    description: template.description,
    slots: template.slots.map((slot) => ({
      id: slot.id,
      type: slot.type,
      required: slot.required ?? false,
      maxLength: slot.maxLength,
      minItems: slot.minItems,
      maxItems: slot.maxItems,
      prompt: slot.prompt,
      style: slot.style,
      staticContent: slot.staticContent,
    })),
  };

  res.json({ schema });
});

export default router;
