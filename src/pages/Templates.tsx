import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Avatar,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  TextFields as TextIcon,
  FormatListBulleted as ListIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  TouchApp as CTAIcon,
  ViewQuilt as TemplateIcon,
  CheckCircle as RequiredIcon,
} from '@mui/icons-material';
import { gradients } from '../theme';

interface TemplateSlot {
  id: string;
  type: string;
  prompt?: string;
  required?: boolean;
  maxLength?: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  slots: TemplateSlot[];
}

const slotTypeConfig: Record<string, { icon: typeof TextIcon; color: string; label: string }> = {
  greeting: { icon: TextIcon, color: '#3b82f6', label: 'Greeting' },
  paragraph: { icon: TextIcon, color: '#64748b', label: 'Paragraph' },
  'bullet-list': { icon: ListIcon, color: '#8b5cf6', label: 'Bullet List' },
  'info-box': { icon: InfoIcon, color: '#3b82f6', label: 'Info Box' },
  'warning-box': { icon: WarningIcon, color: '#f59e0b', label: 'Warning Box' },
  'highlight-box': { icon: InfoIcon, color: '#10b981', label: 'Highlight Box' },
  'security-alert': { icon: SecurityIcon, color: '#ef4444', label: 'Security Alert' },
  'receipt-details': { icon: ListIcon, color: '#6366f1', label: 'Receipt Details' },
  'cta-button': { icon: CTAIcon, color: '#ec4899', label: 'CTA Button' },
  signature: { icon: TextIcon, color: '#64748b', label: 'Signature' },
};

const templateColors: Record<string, string> = {
  simple: '#3b82f6',
  'with-info-box': '#6366f1',
  'with-warning': '#f59e0b',
  'with-bullets': '#8b5cf6',
  transactional: '#10b981',
  security: '#ef4444',
};

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Email Templates
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pre-defined HTML structures with slots for AI-generated content
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {templates.map((template) => {
          const color = templateColors[template.id] || '#7c3aed';
          const requiredSlots = template.slots.filter(s => s.required).length;

          return (
            <Grid item xs={12} sm={6} lg={4} key={template.id}>
              <Card
                onClick={() => setSelectedTemplate(template)}
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  position: 'relative',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    borderRadius: '16px 16px 0 0',
                    background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.6)} 100%)`,
                  },
                  '&:hover': {
                    borderColor: color,
                    '& .template-icon': {
                      transform: 'scale(1.1)',
                    },
                  },
                }}
              >
                <CardContent sx={{ pt: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar
                      className="template-icon"
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha(color, 0.1),
                        color: color,
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <TemplateIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Slot preview */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Template Slots
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {template.slots.slice(0, 4).map((slot) => {
                        const config = slotTypeConfig[slot.type] || { icon: TextIcon, color: '#64748b', label: slot.type };
                        return (
                          <Tooltip key={slot.id} title={`${slot.id} (${config.label})`}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: alpha(config.color, 0.1),
                                color: config.color,
                              }}
                            >
                              <config.icon sx={{ fontSize: 14 }} />
                            </Avatar>
                          </Tooltip>
                        );
                      })}
                      {template.slots.length > 4 && (
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: alpha('#64748b', 0.1),
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          +{template.slots.length - 4}
                        </Avatar>
                      )}
                    </Box>
                  </Box>

                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={template.id}
                      size="small"
                      sx={{
                        fontFamily: 'monospace',
                        bgcolor: alpha(color, 0.1),
                        color: color,
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={`${template.slots.length} slots`}
                      size="small"
                      variant="outlined"
                    />
                    {requiredSlots > 0 && (
                      <Chip
                        icon={<RequiredIcon sx={{ fontSize: 14 }} />}
                        label={`${requiredSlots} required`}
                        size="small"
                        sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Template Detail Dialog */}
      <Dialog
        open={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedTemplate && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: alpha(templateColors[selectedTemplate.id] || '#7c3aed', 0.1),
                      color: templateColors[selectedTemplate.id] || '#7c3aed',
                    }}
                  >
                    <TemplateIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {selectedTemplate.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedTemplate.description}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setSelectedTemplate(null)} sx={{ mt: -1, mr: -1 }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="subtitle2" sx={{ mb: 2, mt: 1 }}>
                Slot Configuration
              </Typography>
              <List disablePadding>
                {selectedTemplate.slots.map((slot) => {
                  const config = slotTypeConfig[slot.type] || { icon: TextIcon, color: '#64748b', label: slot.type };
                  return (
                    <ListItem
                      key={slot.id}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: alpha(config.color, 0.04),
                        border: '1px solid',
                        borderColor: alpha(config.color, 0.1),
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 44 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: alpha(config.color, 0.15),
                            color: config.color,
                          }}
                        >
                          <config.icon sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {slot.id}
                            </Typography>
                            <Chip label={config.label} size="small" sx={{ height: 20, fontSize: '0.6875rem' }} />
                            {slot.required && (
                              <Chip
                                label="Required"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.6875rem',
                                  bgcolor: alpha('#ef4444', 0.1),
                                  color: '#ef4444',
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {slot.prompt || 'No prompt defined'}
                            {slot.maxLength && ` (max ${slot.maxLength} chars)`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
