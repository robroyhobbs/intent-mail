import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  alpha,
  Tooltip,
  InputAdornment,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  ViewQuilt as TemplateIcon,
  Code as CodeIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Tune as CustomizeIcon,
  Restore as ResetIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import type { EmailIntent } from '@lib/types';
import { gradients } from '../theme';

// Product colors matching ArcBlock brand
const productColors: Record<string, { color: string; name: string }> = {
  'aigne-hub': { color: '#7c3aed', name: 'AIGNE Hub' },
  myvibe: { color: '#8b5cf6', name: 'MyVibe' },
  arcsphere: { color: '#4598fa', name: 'ArcSphere' },
  arcblock: { color: '#00b8db', name: 'ArcBlock' },
  default: { color: '#64748b', name: 'Default' },
};

interface Template {
  id: string;
  name: string;
}

export default function Intents() {
  const [intents, setIntents] = useState<EmailIntent[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<EmailIntent | null>(null);
  const [intentMeta, setIntentMeta] = useState<Record<string, { isBuiltIn: boolean; hasOverride: boolean }>>({});

  // Snackbar for feedback
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [intentsRes, brandsRes, templatesRes] = await Promise.all([
        fetch('/api/intents'),
        fetch('/api/brands'),
        fetch('/api/templates'),
      ]);

      let intentList: EmailIntent[] = [];

      if (intentsRes.ok) {
        const data = await intentsRes.json();
        intentList = Array.isArray(data) ? data : [];
        setIntents(intentList);
      }

      if (brandsRes.ok) {
        const data = await brandsRes.json();
        const brandList = Array.isArray(data) ? data.map((b: any) => ({ id: b.id, name: b.name })) : [];
        setBrands(brandList);
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(Array.isArray(data) ? data : []);
      }

      // Fetch metadata for each intent (built-in status, override status)
      const metaMap: Record<string, { isBuiltIn: boolean; hasOverride: boolean }> = {};
      await Promise.all(
        intentList.map(async (intent) => {
          try {
            const res = await fetch(`/api/intents/${intent.brand}/${intent.id}`);
            if (res.ok) {
              const data = await res.json();
              const key = `${intent.brand}:${intent.id}`;
              metaMap[key] = {
                isBuiltIn: data.meta?.isBuiltIn ?? false,
                hasOverride: data.meta?.hasOverride ?? false,
              };
            }
          } catch {
            // Ignore individual fetch failures
          }
        })
      );
      setIntentMeta(metaMap);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(brand: string, id: string) {
    if (!confirm('Are you sure you want to delete this intent?')) return;

    try {
      const res = await fetch(`/api/intents/${brand}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete intent');
      }
    } catch (err) {
      setError('Failed to delete intent');
    }
  }

  async function handleResetOverride(brand: string, id: string) {
    if (!confirm('Reset this intent to its default values? Your customizations will be lost.')) return;

    try {
      const res = await fetch(`/api/intents/${brand}/${id}/override`, { method: 'DELETE' });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Intent reset to default', severity: 'success' });
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reset intent');
      }
    } catch (err) {
      setError('Failed to reset intent');
    }
  }

  function getIntentMeta(brand: string, id: string) {
    return intentMeta[`${brand}:${id}`] || { isBuiltIn: false, hasOverride: false };
  }

  // Filter intents
  const filteredIntents = intents.filter((intent) => {
    const matchesProduct = selectedProduct === 'all' || intent.brand === selectedProduct;
    const matchesSearch = !searchQuery ||
      intent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProduct && matchesSearch;
  });

  // Group by product
  const intentsByProduct = filteredIntents.reduce((acc, intent) => {
    const product = intent.brand || 'unknown';
    if (!acc[product]) acc[product] = [];
    acc[product].push(intent);
    return acc;
  }, {} as Record<string, EmailIntent[]>);

  // Get unique products from intents
  const products = [...new Set(intents.map(i => i.brand).filter(Boolean))] as string[];

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Email Intents
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pre-defined email purposes with content structure by product
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ background: gradients.primary }}
        >
          Create Intent
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, '&:hover': { transform: 'none' } }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search intents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by Product</InputLabel>
              <Select
                value={selectedProduct}
                label="Filter by Product"
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <MenuItem value="all">All Products</MenuItem>
                {products.map((product) => {
                  const config = productColors[product] || productColors.default;
                  return (
                    <MenuItem key={product} value={product}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: config.color }} />
                        {config.name}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <Chip
              label={`${filteredIntents.length} intents`}
              sx={{ bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed' }}
            />
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Intent Tables by Product */}
      {Object.entries(intentsByProduct).map(([product, productIntents]) => {
        const config = productColors[product] || productColors.default;

        return (
          <Card
            key={product}
            sx={{
              mb: 3,
              overflow: 'visible',
              '&:hover': { transform: 'none' },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                borderRadius: '16px 16px 0 0',
                background: `linear-gradient(135deg, ${config.color} 0%, ${alpha(config.color, 0.6)} 100%)`,
              },
              position: 'relative',
            }}
          >
            {/* Product Header */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: alpha(config.color, 0.1),
                    color: config.color,
                    fontWeight: 700,
                  }}
                >
                  {config.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {config.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {productIntents.length} email intents
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Intent Table */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: '25%' }}>Intent</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '30%' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '15%' }}>Template</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '15%' }}>Variables</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, width: '15%' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productIntents.map((intent, index) => {
                    const meta = getIntentMeta(intent.brand || '', intent.id);
                    return (
                      <TableRow
                        key={`${intent.brand}-${intent.id}`}
                        hover
                        sx={{
                          bgcolor: index % 2 === 0 ? 'transparent' : 'action.hover',
                          '&:hover': { bgcolor: alpha(config.color, 0.04) },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {intent.name}
                                </Typography>
                                {meta.hasOverride && (
                                  <Tooltip title="Customized (has override)">
                                    <Chip
                                      icon={<CustomizeIcon sx={{ fontSize: 12 }} />}
                                      label="Customized"
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        bgcolor: alpha('#10b981', 0.1),
                                        color: '#10b981',
                                        '& .MuiChip-icon': { color: '#10b981' },
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'monospace',
                                  color: 'text.secondary',
                                  bgcolor: alpha(config.color, 0.1),
                                  px: 0.5,
                                  borderRadius: 0.5,
                                }}
                              >
                                {intent.id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                            {typeof intent.subject === 'string' ? intent.subject : intent.subject?.default}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={intent.template}
                            size="small"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              bgcolor: alpha(config.color, 0.1),
                              color: config.color,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {intent.variables?.length || 0} vars
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedIntent(intent);
                                  setViewDialogOpen(true);
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {meta.isBuiltIn && (
                              <Tooltip title="Customize">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedIntent(intent);
                                    setEditDialogOpen(true);
                                  }}
                                  sx={{ color: config.color }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {meta.hasOverride && (
                              <Tooltip title="Reset to Default">
                                <IconButton
                                  size="small"
                                  onClick={() => handleResetOverride(intent.brand!, intent.id)}
                                  sx={{ color: '#f59e0b' }}
                                >
                                  <ResetIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Copy ID">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${intent.brand}:${intent.id}`);
                                }}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {intent.isCustom && (
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(intent.brand!, intent.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        );
      })}

      {filteredIntents.length === 0 && (
        <Card sx={{ '&:hover': { transform: 'none' } }}>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha('#7c3aed', 0.1),
                color: 'primary.main',
                mx: 'auto',
                mb: 2,
              }}
            >
              <EmailIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography color="text.secondary">
              No intents found matching your filters
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* View Intent Dialog */}
      <IntentViewDialog
        open={viewDialogOpen}
        intent={selectedIntent}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedIntent(null);
        }}
      />

      {/* Create Intent Dialog */}
      <IntentCreateDialog
        open={createDialogOpen}
        brands={brands}
        templates={templates}
        onClose={() => setCreateDialogOpen(false)}
        onSave={async (intent) => {
          try {
            const res = await fetch('/api/intents', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(intent),
            });
            if (res.ok) {
              setCreateDialogOpen(false);
              fetchData();
            } else {
              const data = await res.json();
              setError(data.error || 'Failed to create intent');
            }
          } catch (err) {
            setError('Failed to create intent');
          }
        }}
      />

      {/* Edit Intent Dialog (for customizing built-in intents) */}
      <IntentEditDialog
        open={editDialogOpen}
        intent={selectedIntent}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedIntent(null);
        }}
        onSave={async (override) => {
          try {
            const res = await fetch(`/api/intents/${selectedIntent?.brand}/${selectedIntent?.id}/override`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(override),
            });
            if (res.ok) {
              setEditDialogOpen(false);
              setSelectedIntent(null);
              setSnackbar({ open: true, message: 'Intent customized successfully', severity: 'success' });
              fetchData();
            } else {
              const data = await res.json();
              setError(data.error || 'Failed to save customization');
            }
          } catch (err) {
            setError('Failed to save customization');
          }
        }}
      />

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// View Intent Dialog
interface IntentViewDialogProps {
  open: boolean;
  intent: EmailIntent | null;
  onClose: () => void;
}

function IntentViewDialog({ open, intent, onClose }: IntentViewDialogProps) {
  if (!intent) return null;

  const config = productColors[intent.brand || ''] || productColors.default;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(config.color, 0.1),
                color: config.color,
              }}
            >
              <EmailIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {intent.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label={intent.id}
                  size="small"
                  sx={{ fontFamily: 'monospace', bgcolor: alpha(config.color, 0.1), color: config.color }}
                />
                <Chip label={config.name} size="small" variant="outlined" />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ mt: -1, mr: -1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary">Description</Typography>
          <Typography variant="body2">{intent.description}</Typography>
        </Box>

        <Box sx={{ mb: 3, p: 2, bgcolor: alpha(config.color, 0.04), borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">Subject Line</Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {typeof intent.subject === 'string' ? intent.subject : intent.subject?.default}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary">Template</Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip icon={<TemplateIcon />} label={intent.template} />
          </Box>
        </Box>

        {intent.variables && intent.variables.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Variables ({intent.variables.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {intent.variables.map((v) => (
                <Chip
                  key={v}
                  label={`{{${v}}}`}
                  size="small"
                  sx={{ fontFamily: 'monospace', bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {intent.slots && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Content Slots ({Object.keys(intent.slots).length})
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Slot</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Prompt / Content</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(intent.slots).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {key}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {typeof value === 'object' && value !== null
                          ? (value as any).prompt || (value as any).text || JSON.stringify(value)
                          : String(value)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Create Intent Dialog
interface IntentCreateDialogProps {
  open: boolean;
  brands: { id: string; name: string }[];
  templates: { id: string; name: string }[];
  onClose: () => void;
  onSave: (intent: any) => void;
}

function IntentCreateDialog({ open, brands, templates, onClose, onSave }: IntentCreateDialogProps) {
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    id: '',
    brand: '',
    name: '',
    description: '',
    template: '',
    subject: '',
    variables: '',
    slots: {} as Record<string, { prompt?: string; text?: string }>,
  });

  // Selected template slots
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  useEffect(() => {
    if (formData.template) {
      // Fetch template details to get slots
      fetch(`/api/templates/${formData.template}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setSelectedTemplate(data);
            // Initialize empty slots
            const slots: Record<string, { prompt: string }> = {};
            data.slots?.forEach((s: any) => {
              slots[s.id] = { prompt: '' };
            });
            setFormData(prev => ({ ...prev, slots }));
          }
        });
    }
  }, [formData.template]);

  function handleSubmit() {
    const variables = formData.variables
      .split(',')
      .map(v => v.trim())
      .filter(v => v);

    onSave({
      id: formData.id,
      brand: formData.brand,
      name: formData.name,
      description: formData.description,
      template: formData.template,
      subject: formData.subject,
      variables,
      slots: formData.slots,
    });
  }

  function resetForm() {
    setFormData({
      id: '',
      brand: '',
      name: '',
      description: '',
      template: '',
      subject: '',
      variables: '',
      slots: {},
    });
    setTab(0);
    setSelectedTemplate(null);
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed' }}>
            <AddIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Create Email Intent</Typography>
            <Typography variant="caption" color="text.secondary">
              Define a new email purpose with content slots
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Basic Info" />
        <Tab label="Content Slots" disabled={!formData.template} />
      </Tabs>

      <DialogContent>
        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  value={formData.brand}
                  label="Product"
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                >
                  {brands.filter(b => b.id !== 'default').map((brand) => (
                    <MenuItem key={brand.id} value={brand.id}>{brand.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Intent ID"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="e.g., welcome-email"
                helperText="Unique identifier (lowercase, hyphens)"
              />
            </Box>

            <TextField
              fullWidth
              label="Intent Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Welcome Email"
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this email for?"
              multiline
              rows={2}
            />

            <FormControl fullWidth>
              <InputLabel>Template</InputLabel>
              <Select
                value={formData.template}
                label="Template"
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              >
                {templates.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Subject Line"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Welcome to {{productName}}, {{userName}}!"
              helperText="Use {{variableName}} for dynamic values"
            />

            <TextField
              fullWidth
              label="Variables"
              value={formData.variables}
              onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
              placeholder="userName, productName, dashboardUrl"
              helperText="Comma-separated list of variable names"
            />
          </Box>
        )}

        {tab === 1 && selectedTemplate && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Configure prompts for each slot. These tell the AI what content to generate.
            </Alert>

            {selectedTemplate.slots?.map((slot: any) => (
              <Box key={slot.id} sx={{ p: 2, bgcolor: alpha('#7c3aed', 0.04), borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {slot.id}
                  </Typography>
                  <Chip label={slot.type} size="small" />
                  {slot.required && <Chip label="Required" size="small" color="error" />}
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={`Prompt for ${slot.id}...`}
                  value={formData.slots[slot.id]?.prompt || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slots: {
                        ...formData.slots,
                        [slot.id]: { prompt: e.target.value },
                      },
                    })
                  }
                  multiline
                  rows={2}
                />
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={() => {
            resetForm();
            onClose();
          }}
          variant="outlined"
        >
          Cancel
        </Button>
        {tab === 0 && formData.template && (
          <Button onClick={() => setTab(1)} variant="outlined">
            Next: Configure Slots
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.id || !formData.brand || !formData.name || !formData.template || !formData.subject}
          sx={{ background: gradients.primary }}
        >
          Create Intent
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Edit Intent Dialog (for customizing built-in intents)
interface IntentEditDialogProps {
  open: boolean;
  intent: EmailIntent | null;
  onClose: () => void;
  onSave: (override: {
    subject?: string;
    slots?: Record<string, { prompt?: string; text?: string; url?: string }>;
    notes?: string;
  }) => void;
}

function IntentEditDialog({ open, intent, onClose, onSave }: IntentEditDialogProps) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [baseIntent, setBaseIntent] = useState<any>(null);
  const [existingOverride, setExistingOverride] = useState<any>(null);
  const [formData, setFormData] = useState({
    subject: '',
    slots: {} as Record<string, { prompt?: string; text?: string; url?: string }>,
    notes: '',
  });

  // Fetch base intent and existing override when dialog opens
  useEffect(() => {
    if (open && intent) {
      setLoading(true);
      Promise.all([
        fetch(`/api/intents/${intent.brand}/${intent.id}/base`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/intents/${intent.brand}/${intent.id}/override`).then((r) => (r.ok ? r.json() : null)),
      ])
        .then(([baseData, overrideData]) => {
          const base = baseData?.intent || intent;
          setBaseIntent(base);
          setExistingOverride(overrideData?.override);

          // Initialize form with override values or base values
          const override = overrideData?.override;
          setFormData({
            subject: override?.subject || '',
            slots: override?.slots || {},
            notes: override?.notes || '',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [open, intent]);

  function handleSave() {
    // Only include fields that have been customized
    const override: any = {};
    if (formData.subject && formData.subject !== baseIntent?.subject) {
      override.subject = formData.subject;
    }
    if (Object.keys(formData.slots).length > 0) {
      override.slots = formData.slots;
    }
    if (formData.notes) {
      override.notes = formData.notes;
    }
    onSave(override);
  }

  function resetForm() {
    setFormData({ subject: '', slots: {}, notes: '' });
    setTab(0);
    setBaseIntent(null);
    setExistingOverride(null);
  }

  if (!intent) return null;

  const config = productColors[intent.brand || ''] || productColors.default;
  const slots = intent.slots ? Object.entries(intent.slots) : [];

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(config.color, 0.1),
                color: config.color,
              }}
            >
              <CustomizeIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Customize: {intent.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label={intent.id}
                  size="small"
                  sx={{ fontFamily: 'monospace', bgcolor: alpha(config.color, 0.1), color: config.color }}
                />
                <Chip label={config.name} size="small" variant="outlined" />
                {existingOverride && (
                  <Chip
                    icon={<CheckIcon sx={{ fontSize: 14 }} />}
                    label="Has Override"
                    size="small"
                    sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}
                  />
                )}
              </Box>
            </Box>
          </Box>
          <IconButton onClick={() => { resetForm(); onClose(); }} sx={{ mt: -1, mr: -1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Subject & Notes" />
        <Tab label="Slot Prompts" disabled={slots.length === 0} />
        <Tab label="CTA Content" />
      </Tabs>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {tab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Customize the subject line and add notes. Leave fields empty to use the default values.
                </Alert>

                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Default Subject
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {typeof baseIntent?.subject === 'string' ? baseIntent.subject : baseIntent?.subject?.default || intent.subject}
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  label="Custom Subject Line"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Leave empty to use default"
                  helperText="Use {{variableName}} for dynamic values (e.g., {{userName}}, {{productName}})"
                />

                <TextField
                  fullWidth
                  label="Notes (internal)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes about this customization (not shown in emails)"
                  multiline
                  rows={2}
                />
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Customize the AI prompts for each content slot. This guides how the AI generates content.
                </Alert>

                {slots.map(([slotId, slotValue]) => {
                  const defaultPrompt = typeof slotValue === 'object' && slotValue !== null
                    ? (slotValue as any).prompt || ''
                    : '';
                  const slotType = typeof slotValue === 'object' && slotValue !== null
                    ? (slotValue as any).type || 'text'
                    : 'text';

                  return (
                    <Box key={slotId} sx={{ p: 2, bgcolor: alpha(config.color, 0.04), borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {slotId}
                        </Typography>
                        <Chip label={slotType} size="small" />
                      </Box>

                      {defaultPrompt && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Default: {defaultPrompt}
                        </Typography>
                      )}

                      <TextField
                        fullWidth
                        size="small"
                        placeholder={`Custom prompt for ${slotId}...`}
                        value={formData.slots[slotId]?.prompt || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            slots: {
                              ...formData.slots,
                              [slotId]: { ...formData.slots[slotId], prompt: e.target.value },
                            },
                          })
                        }
                        multiline
                        rows={2}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}

            {tab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Customize the CTA button text and URL. This overrides the AI-generated or default CTA.
                </Alert>

                <Box sx={{ p: 2, bgcolor: alpha(config.color, 0.04), borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Call-to-Action Button
                  </Typography>

                  {(intent.slots as any)?.cta && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Default CTA
                      </Typography>
                      <Typography variant="body2">
                        Text: {(intent.slots as any).cta?.text || 'AI Generated'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        URL: {(intent.slots as any).cta?.url || 'Dynamic'}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="CTA Button Text"
                      value={formData.slots.cta?.text || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slots: {
                            ...formData.slots,
                            cta: { ...formData.slots.cta, text: e.target.value },
                          },
                        })
                      }
                      placeholder="e.g., Get Started Now"
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="CTA Button URL"
                      value={formData.slots.cta?.url || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slots: {
                            ...formData.slots,
                            cta: { ...formData.slots.cta, url: e.target.value },
                          },
                        })
                      }
                      placeholder="e.g., {{dashboardUrl}} or https://..."
                      helperText="Use {{variableName}} for dynamic URLs"
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={() => {
            resetForm();
            onClose();
          }}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{ background: gradients.primary }}
          disabled={loading}
        >
          Save Customization
        </Button>
      </DialogActions>
    </Dialog>
  );
}
