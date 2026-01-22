import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  Avatar,
  alpha,
  Grid,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  Code as ConsoleIcon,
  Send as ResendIcon,
  Storage as SmtpIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Dns as HostIcon,
  VpnKey as KeyIcon,
  CheckCircle as SuccessIcon,
  Psychology as AIIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import { gradients } from '../theme';

interface Settings {
  provider: 'console' | 'resend' | 'smtp';
  ai?: {
    enabled: boolean;
    provider: string;
  };
  resend?: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromEmail: string;
    fromName: string;
  };
}

const providerConfig = {
  console: {
    icon: ConsoleIcon,
    color: '#64748b',
    label: 'Console (Development)',
    description: 'Logs emails to server console. Perfect for development and testing.',
  },
  resend: {
    icon: ResendIcon,
    color: '#3b82f6',
    label: 'Resend',
    description: 'Modern email API with excellent deliverability.',
  },
  smtp: {
    icon: SmtpIcon,
    color: '#8b5cf6',
    label: 'SMTP',
    description: 'Traditional SMTP server connection.',
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    provider: 'console',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setResult(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setResult({ success: true, message: 'Settings saved successfully' });
      } else {
        const data = await res.json();
        setResult({ success: false, message: data.error || 'Failed to save settings' });
      }
    } catch (err) {
      setResult({ success: false, message: 'Save request failed' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentProvider = providerConfig[settings.provider];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your email provider and delivery settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Provider Selection */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              height: '100%',
              position: 'relative',
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
                background: gradients.primary,
              },
            }}
          >
            <CardContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: alpha('#7c3aed', 0.1),
                    color: '#7c3aed',
                  }}
                >
                  <SettingsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Email Provider
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Choose how emails are sent
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {(Object.keys(providerConfig) as Array<keyof typeof providerConfig>).map((key) => {
                  const config = providerConfig[key];
                  const isSelected = settings.provider === key;

                  return (
                    <Box
                      key={key}
                      onClick={() => setSettings({ ...settings, provider: key })}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: isSelected ? config.color : 'divider',
                        bgcolor: isSelected ? alpha(config.color, 0.04) : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: config.color,
                          bgcolor: alpha(config.color, 0.04),
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: alpha(config.color, 0.1),
                            color: config.color,
                          }}
                        >
                          <config.icon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {config.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {config.description}
                          </Typography>
                        </Box>
                        {isSelected && (
                          <Chip
                            label="Active"
                            size="small"
                            sx={{
                              bgcolor: alpha(config.color, 0.1),
                              color: config.color,
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Provider Configuration */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              position: 'relative',
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
                background: `linear-gradient(135deg, ${currentProvider.color} 0%, ${alpha(currentProvider.color, 0.6)} 100%)`,
              },
            }}
          >
            <CardContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: alpha(currentProvider.color, 0.1),
                    color: currentProvider.color,
                  }}
                >
                  <currentProvider.icon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {currentProvider.label} Configuration
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentProvider.description}
                  </Typography>
                </Box>
              </Box>

              {settings.provider === 'console' && (
                <Alert
                  severity="info"
                  icon={<ConsoleIcon />}
                  sx={{
                    borderRadius: 2,
                    bgcolor: alpha('#3b82f6', 0.08),
                    '& .MuiAlert-icon': { color: '#3b82f6' },
                  }}
                >
                  <Typography variant="body2">
                    Console mode is active. Emails will be logged to the server console instead of being sent.
                    This is useful for development and testing without using real email credits.
                  </Typography>
                </Alert>
              )}

              {settings.provider === 'resend' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="API Key"
                    type="password"
                    value={settings.resend?.apiKey || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        resend: { ...settings.resend, apiKey: e.target.value } as Settings['resend'],
                      })
                    }
                    placeholder="re_xxxxx"
                    InputProps={{
                      startAdornment: <KeyIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                    }}
                  />
                  <TextField
                    label="From Email"
                    value={settings.resend?.fromEmail || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        resend: { ...settings.resend, fromEmail: e.target.value } as Settings['resend'],
                      })
                    }
                    placeholder="noreply@yourdomain.com"
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                    }}
                  />
                  <TextField
                    label="From Name"
                    value={settings.resend?.fromName || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        resend: { ...settings.resend, fromName: e.target.value } as Settings['resend'],
                      })
                    }
                    placeholder="Your App Name"
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                    }}
                  />
                </Box>
              )}

              {settings.provider === 'smtp' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ color: '#8b5cf6', fontWeight: 600, mt: 1 }}>
                    Server Settings
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Host"
                        value={settings.smtp?.host || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtp: { ...settings.smtp, host: e.target.value } as Settings['smtp'],
                          })
                        }
                        placeholder="smtp.example.com"
                        InputProps={{
                          startAdornment: <HostIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Port"
                        type="number"
                        value={settings.smtp?.port || 587}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtp: { ...settings.smtp, port: parseInt(e.target.value) } as Settings['smtp'],
                          })
                        }
                      />
                    </Grid>
                  </Grid>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha('#8b5cf6', 0.04),
                      border: '1px solid',
                      borderColor: alpha('#8b5cf6', 0.1),
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.smtp?.secure || false}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              smtp: { ...settings.smtp, secure: e.target.checked } as Settings['smtp'],
                            })
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#8b5cf6',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#8b5cf6',
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LockIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Use TLS/SSL
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Username"
                        value={settings.smtp?.user || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtp: { ...settings.smtp, user: e.target.value } as Settings['smtp'],
                          })
                        }
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={settings.smtp?.password || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtp: { ...settings.smtp, password: e.target.value } as Settings['smtp'],
                          })
                        }
                        InputProps={{
                          startAdornment: <KeyIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                    Sender Settings
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="From Email"
                        value={settings.smtp?.fromEmail || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtp: { ...settings.smtp, fromEmail: e.target.value } as Settings['smtp'],
                          })
                        }
                        placeholder="noreply@yourdomain.com"
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="From Name"
                        value={settings.smtp?.fromName || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            smtp: { ...settings.smtp, fromName: e.target.value } as Settings['smtp'],
                          })
                        }
                        placeholder="Your App Name"
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Save Button */}
              <Box sx={{ mt: 4 }}>
                {result && (
                  <Alert
                    severity={result.success ? 'success' : 'error'}
                    icon={result.success ? <SuccessIcon /> : undefined}
                    sx={{
                      mb: 2,
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

                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{
                    px: 4,
                    py: 1.5,
                    background: gradients.primary,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #6b2dd1 0%, #3580e6 100%)',
                    },
                  }}
                >
                  Save Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Content Generation */}
        <Grid item xs={12}>
          <Card
            sx={{
              position: 'relative',
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
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              },
            }}
          >
            <CardContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: alpha('#8b5cf6', 0.1),
                    color: '#8b5cf6',
                  }}
                >
                  <AIIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    AI Content Generation
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Use AI to generate high-quality email copy from your intent prompts
                  </Typography>
                </Box>
                <Chip
                  icon={<SparkleIcon sx={{ fontSize: 16 }} />}
                  label={settings.ai?.enabled ? 'Enabled' : 'Disabled'}
                  size="small"
                  sx={{
                    bgcolor: settings.ai?.enabled ? alpha('#10b981', 0.1) : alpha('#64748b', 0.1),
                    color: settings.ai?.enabled ? '#10b981' : '#64748b',
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: settings.ai?.enabled ? alpha('#10b981', 0.04) : alpha('#64748b', 0.04),
                      border: '1px solid',
                      borderColor: settings.ai?.enabled ? alpha('#10b981', 0.2) : 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      {settings.ai?.enabled ? (
                        <SuccessIcon sx={{ color: '#10b981', fontSize: 20 }} />
                      ) : (
                        <KeyIcon sx={{ color: '#64748b', fontSize: 20 }} />
                      )}
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {settings.ai?.enabled ? 'AI Service Active' : 'API Key Required'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {settings.ai?.enabled
                        ? `Using ${settings.ai.provider === 'anthropic' ? 'Claude (Anthropic)' : settings.ai.provider} for AI-powered email content generation.`
                        : 'Set the ANTHROPIC_API_KEY environment variable to enable AI-powered email generation.'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: alpha('#3b82f6', 0.04),
                      border: '1px solid',
                      borderColor: alpha('#3b82f6', 0.1),
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      How AI Generation Works
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      When enabled, the system uses your intent prompts and brand voice guidelines to generate
                      personalized, action-appropriate email copy. Fallback to template interpolation when AI
                      is unavailable.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {!settings.ai?.enabled && (
                <Alert
                  severity="info"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#3b82f6', 0.08),
                    '& .MuiAlert-icon': { color: '#3b82f6' },
                  }}
                >
                  <Typography variant="body2">
                    <strong>To enable AI:</strong> Add <code>ANTHROPIC_API_KEY=sk-ant-...</code> to your
                    environment variables or <code>.env</code> file, then restart the server.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
