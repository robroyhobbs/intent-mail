import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  alpha,
  Chip,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  Preview as PreviewIcon,
  Palette as BrandIcon,
  Psychology as IntentIcon,
  Code as CodeIcon,
  Email as EmailIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { gradients } from '../theme';

interface Brand {
  id: string;
  name: string;
}

interface Intent {
  id: string;
  name: string;
  brand: string;
  variables?: string[];
  description?: string;
  template?: string;
}

export default function TestEmail() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedIntent, setSelectedIntent] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});

  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [brandsRes, intentsRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/intents'),
      ]);

      let loadedBrands: Brand[] = [];
      let loadedIntents: Intent[] = [];

      if (brandsRes.ok) {
        const data = await brandsRes.json();
        // Filter out 'default' brand as it has no intents
        loadedBrands = Array.isArray(data) ? data.filter((b: Brand) => b.id !== 'default') : [];
        setBrands(loadedBrands);
      }

      if (intentsRes.ok) {
        const data = await intentsRes.json();
        loadedIntents = Array.isArray(data) ? data : [];
        setIntents(loadedIntents);
      }

      // Set initial brand to one that has intents
      if (loadedBrands.length > 0 && loadedIntents.length > 0) {
        const firstBrandWithIntents = loadedBrands.find(b =>
          loadedIntents.some(i => i.brand === b.id)
        );
        if (firstBrandWithIntents) {
          setSelectedBrand(firstBrandWithIntents.id);
          // Also set initial intent
          const firstIntent = loadedIntents.find(i => i.brand === firstBrandWithIntents.id);
          if (firstIntent) {
            setSelectedIntent(firstIntent.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredIntents = intents.filter((i) => i.brand === selectedBrand);
  const selectedIntentData = intents.find(
    (i) => i.brand === selectedBrand && i.id === selectedIntent
  );

  // When brand changes, auto-select first intent for that brand
  useEffect(() => {
    if (selectedBrand && intents.length > 0) {
      const brandIntents = intents.filter(i => i.brand === selectedBrand);
      if (brandIntents.length > 0) {
        // Check if current selection is valid for this brand
        const currentValid = brandIntents.some(i => i.id === selectedIntent);
        if (!currentValid) {
          setSelectedIntent(brandIntents[0].id);
        }
      } else {
        setSelectedIntent('');
      }
    }
  }, [selectedBrand, intents]);

  useEffect(() => {
    // Reset variables when intent changes
    if (selectedIntentData?.variables) {
      const newVars: Record<string, string> = {};
      selectedIntentData.variables.forEach((v) => {
        newVars[v] = variables[v] || '';
      });
      setVariables(newVars);
    }
  }, [selectedIntent]);

  async function handlePreview() {
    setPreviewing(true);
    setResult(null);
    setPreview(null);

    try {
      const res = await fetch('/api/send/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: selectedBrand,
          intent: selectedIntent,
          data: variables,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPreview(data.html);
        setTab(1);
      } else {
        setResult({ success: false, message: data.error || 'Preview failed' });
      }
    } catch (err) {
      setResult({ success: false, message: 'Preview request failed' });
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSend() {
    if (!recipientEmail) {
      setResult({ success: false, message: 'Recipient email is required' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: selectedBrand,
          intent: selectedIntent,
          to: recipientEmail,
          data: variables,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: `Email sent successfully! Message ID: ${data.messageId}` });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' });
      }
    } catch (err) {
      setResult({ success: false, message: 'Send request failed' });
    } finally {
      setSending(false);
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
          Test Email
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Preview and send test emails with your configured templates
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
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
                background: gradients.warning,
              },
            }}
          >
            <CardContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: alpha('#f59e0b', 0.1),
                    color: '#f59e0b',
                  }}
                >
                  <SendIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Email Configuration
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Select brand, intent, and recipient
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <FormControl fullWidth>
                  <InputLabel>Brand</InputLabel>
                  <Select
                    value={selectedBrand}
                    label="Brand"
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      setSelectedIntent('');
                    }}
                  >
                    {brands.map((brand) => (
                      <MenuItem key={brand.id} value={brand.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BrandIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          {brand.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Intent</InputLabel>
                  <Select
                    value={selectedIntent}
                    label="Intent"
                    onChange={(e) => setSelectedIntent(e.target.value)}
                    disabled={filteredIntents.length === 0}
                    displayEmpty
                    renderValue={(value) => {
                      if (!value) return <em>Select an intent</em>;
                      const intent = filteredIntents.find(i => i.id === value);
                      return intent?.name || value;
                    }}
                  >
                    {filteredIntents.length === 0 ? (
                      <MenuItem disabled>
                        <em>No intents available for this product</em>
                      </MenuItem>
                    ) : (
                      filteredIntents.map((intent) => (
                        <MenuItem key={intent.id} value={intent.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IntentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="body2">{intent.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                {intent.id}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {filteredIntents.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {filteredIntents.length} intent{filteredIntents.length !== 1 ? 's' : ''} available
                    </Typography>
                  )}
                </FormControl>

                <TextField
                  label="Recipient Email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="test@example.com"
                  InputProps={{
                    startAdornment: (
                      <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    ),
                  }}
                />

                {selectedIntentData?.variables && selectedIntentData.variables.length > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha('#7c3aed', 0.04),
                      border: '1px solid',
                      borderColor: alpha('#7c3aed', 0.1),
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#7c3aed' }}>
                      Template Variables
                    </Typography>
                    {selectedIntentData.variables.map((varName) => (
                      <TextField
                        key={varName}
                        label={varName}
                        value={variables[varName] || ''}
                        onChange={(e) =>
                          setVariables({ ...variables, [varName]: e.target.value })
                        }
                        fullWidth
                        size="small"
                        sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}
                        placeholder={`Enter ${varName}`}
                      />
                    ))}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={previewing ? <CircularProgress size={20} /> : <PreviewIcon />}
                    onClick={handlePreview}
                    disabled={!selectedBrand || !selectedIntent || previewing}
                    sx={{ flex: 1 }}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    onClick={handleSend}
                    disabled={!selectedBrand || !selectedIntent || !recipientEmail || sending}
                    sx={{
                      flex: 1,
                      background: gradients.warning,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #ea8d00 0%, #f5a823 100%)',
                      },
                    }}
                  >
                    Send Test
                  </Button>
                </Box>

                {result && (
                  <Alert
                    severity={result.success ? 'success' : 'error'}
                    icon={result.success ? <SuccessIcon /> : undefined}
                    sx={{
                      borderRadius: 2,
                      ...(result.success && {
                        bgcolor: alpha('#10b981', 0.1),
                        color: '#059669',
                        '& .MuiAlert-icon': { color: '#10b981' },
                      }),
                    }}
                  >
                    {result.message}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview Panel */}
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              height: '100%',
              minHeight: 500,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontWeight: 600,
                  textTransform: 'none',
                },
                '& .Mui-selected': {
                  color: '#7c3aed',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#7c3aed',
                },
              }}
            >
              <Tab label="Intent Details" />
              <Tab label="Email Preview" disabled={!preview} />
            </Tabs>

            {tab === 0 && (
              <CardContent sx={{ flex: 1 }}>
                {selectedIntentData ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: alpha('#3b82f6', 0.1),
                          color: '#3b82f6',
                        }}
                      >
                        <IntentIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {selectedIntentData.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            icon={<CodeIcon sx={{ fontSize: 14 }} />}
                            label={selectedIntentData.id}
                            size="small"
                            sx={{
                              fontFamily: 'monospace',
                              bgcolor: alpha('#64748b', 0.1),
                            }}
                          />
                          {selectedIntentData.template && (
                            <Chip
                              label={selectedIntentData.template}
                              size="small"
                              sx={{
                                bgcolor: alpha('#7c3aed', 0.1),
                                color: '#7c3aed',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {selectedIntentData.description && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Description
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedIntentData.description}
                        </Typography>
                      </Box>
                    )}

                    {selectedIntentData.variables && selectedIntentData.variables.length > 0 && (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha('#3b82f6', 0.04),
                          border: '1px solid',
                          borderColor: alpha('#3b82f6', 0.1),
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#3b82f6' }}>
                          Required Variables
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {selectedIntentData.variables.map((v) => (
                            <Chip
                              key={v}
                              label={`{{${v}}}`}
                              size="small"
                              sx={{
                                fontFamily: 'monospace',
                                bgcolor: alpha('#3b82f6', 0.1),
                                color: '#3b82f6',
                                fontWeight: 500,
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 6,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: alpha('#7c3aed', 0.1),
                        color: 'primary.main',
                        mb: 2,
                      }}
                    >
                      <IntentIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography color="text.secondary" align="center">
                      Select a brand and intent to see details
                    </Typography>
                  </Box>
                )}
              </CardContent>
            )}

            {tab === 1 && preview && (
              <Box sx={{ flex: 1, height: 'calc(100% - 48px)' }}>
                <iframe
                  srcDoc={preview}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Email Preview"
                />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
