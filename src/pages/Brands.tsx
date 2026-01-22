import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  CircularProgress,
  Avatar,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Palette as PaletteIcon,
  Language as WebIcon,
  FormatQuote as QuoteIcon,
} from '@mui/icons-material';
import type { BrandConfig } from '@lib/types';
import { gradients } from '../theme';

export default function Brands() {
  const [brands, setBrands] = useState<BrandConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const res = await fetch('/api/brands');
      if (res.ok) {
        const data = await res.json();
        setBrands(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(brand: Partial<BrandConfig>) {
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      });

      if (res.ok) {
        setDialogOpen(false);
        setEditingBrand(null);
        fetchBrands();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save brand');
      }
    } catch (err) {
      setError('Failed to save brand');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBrands();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete brand');
      }
    } catch (err) {
      setError('Failed to delete brand');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Brands
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage brand configurations for your emails
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingBrand(null);
            setDialogOpen(true);
          }}
        >
          Add Brand
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {brands.map((brand) => (
          <Grid item xs={12} md={6} lg={4} key={brand.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {/* Color banner */}
              <Box
                sx={{
                  height: 8,
                  borderRadius: '16px 16px 0 0',
                  background: `linear-gradient(135deg, ${brand.colors.primary} 0%, ${brand.colors.secondary} 100%)`,
                }}
              />

              <CardContent sx={{ flex: 1, pt: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: alpha(brand.colors.primary, 0.1),
                        color: brand.colors.primary,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}
                    >
                      {brand.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {brand.name}
                      </Typography>
                      {brand.tagline && (
                        <Typography variant="caption" color="text.secondary">
                          {brand.tagline}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {brand.isCustom && (
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingBrand(brand);
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(brand.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                {/* Color palette */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <PaletteIcon sx={{ fontSize: 14 }} /> Color Palette
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {[
                      { color: brand.colors.primary, label: 'Primary' },
                      { color: brand.colors.secondary, label: 'Secondary' },
                      { color: brand.colors.success, label: 'Success' },
                      { color: brand.colors.warning, label: 'Warning' },
                      { color: brand.colors.error, label: 'Error' },
                    ].map((c) => (
                      <Tooltip key={c.label} title={`${c.label}: ${c.color}`}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            bgcolor: c.color,
                            boxShadow: `0 2px 8px ${alpha(c.color, 0.4)}`,
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.15)',
                            },
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>

                {/* Voice tone */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <QuoteIcon sx={{ fontSize: 14 }} /> Voice & Tone
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    "{brand.voice.tone}"
                  </Typography>
                </Box>

                {/* Footer */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={brand.id}
                    size="small"
                    sx={{
                      bgcolor: alpha(brand.colors.primary, 0.1),
                      color: brand.colors.primary,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                    }}
                  />
                  {brand.isCustom ? (
                    <Chip label="Custom" size="small" color="primary" />
                  ) : (
                    <Chip label="Built-in" size="small" variant="outlined" />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <BrandDialog
        open={dialogOpen}
        brand={editingBrand}
        onClose={() => {
          setDialogOpen(false);
          setEditingBrand(null);
        }}
        onSave={handleSave}
      />
    </Box>
  );
}

interface BrandDialogProps {
  open: boolean;
  brand: BrandConfig | null;
  onClose: () => void;
  onSave: (brand: Partial<BrandConfig>) => void;
}

function BrandDialog({ open, brand, onClose, onSave }: BrandDialogProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    tagline: '',
    primaryColor: '#7c3aed',
    secondaryColor: '#4598fa',
    tone: '',
  });

  useEffect(() => {
    if (brand) {
      setFormData({
        id: brand.id,
        name: brand.name,
        tagline: brand.tagline || '',
        primaryColor: brand.colors.primary,
        secondaryColor: brand.colors.secondary,
        tone: brand.voice.tone,
      });
    } else {
      setFormData({
        id: '',
        name: '',
        tagline: '',
        primaryColor: '#7c3aed',
        secondaryColor: '#4598fa',
        tone: '',
      });
    }
  }, [brand]);

  function handleSubmit() {
    onSave({
      id: formData.id,
      name: formData.name,
      tagline: formData.tagline,
      colors: {
        primary: formData.primaryColor,
        secondary: formData.secondaryColor,
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#1e293b',
        textMuted: '#64748b',
        border: '#e2e8f0',
      },
      typography: {
        headings: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
      },
      voice: {
        tone: formData.tone,
        doSay: [],
        dontSay: [],
      },
      links: {
        home: '',
      },
    });
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{brand ? 'Edit Brand' : 'Create New Brand'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField
            label="Brand ID"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            disabled={!!brand}
            required
            helperText="Unique identifier (e.g., my-brand)"
          />
          <TextField
            label="Brand Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            label="Tagline"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            placeholder="A short description of your brand"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Primary Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: formData.primaryColor,
                    border: '2px solid',
                    borderColor: 'divider',
                  }}
                />
                <TextField
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  sx={{ flex: 1, '& input': { height: 40, cursor: 'pointer' } }}
                />
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Secondary Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: formData.secondaryColor,
                    border: '2px solid',
                    borderColor: 'divider',
                  }}
                />
                <TextField
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  sx={{ flex: 1, '& input': { height: 40, cursor: 'pointer' } }}
                />
              </Box>
            </Box>
          </Box>

          <TextField
            label="Voice & Tone"
            value={formData.tone}
            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
            multiline
            rows={2}
            placeholder="e.g., Professional, friendly, and helpful"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.id || !formData.name}>
          {brand ? 'Save Changes' : 'Create Brand'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
