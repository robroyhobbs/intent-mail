import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  IconButton,
  Button,
  Avatar,
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Palette as BrandIcon,
  Psychology as IntentIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalEmails: number;
  successfulEmails: number;
  failedEmails: number;
  brands: number;
  intents: number;
}

interface RecentEmail {
  id: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed';
  sentAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, logsRes, brandsRes, intentsRes] = await Promise.all([
          fetch('/api/logs/stats'),
          fetch('/api/logs?limit=5'),
          fetch('/api/brands'),
          fetch('/api/intents'),
        ]);

        let statsData: Stats = {
          totalEmails: 0,
          successfulEmails: 0,
          failedEmails: 0,
          brands: 0,
          intents: 0,
        };

        if (statsRes.ok) {
          const data = await statsRes.json();
          statsData = { ...statsData, ...data };
        }

        if (brandsRes.ok) {
          const brands = await brandsRes.json();
          statsData.brands = Array.isArray(brands) ? brands.length : 0;
        }

        if (intentsRes.ok) {
          const intents = await intentsRes.json();
          statsData.intents = Array.isArray(intents) ? intents.length : 0;
        }

        setStats(statsData);

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setRecentEmails(logsData.logs || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  const successRate =
    stats && stats.totalEmails > 0
      ? Math.round((stats.successfulEmails / stats.totalEmails) * 100)
      : 100;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your email system performance
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Emails', value: stats?.totalEmails || 0, icon: EmailIcon, color: 'primary.main' },
          { label: 'Delivered', value: stats?.successfulEmails || 0, icon: SuccessIcon, color: 'success.main' },
          { label: 'Failed', value: stats?.failedEmails || 0, icon: ErrorIcon, color: 'error.main' },
          { label: 'Brands', value: stats?.brands || 0, icon: BrandIcon, color: 'secondary.main' },
          { label: 'Intents', value: stats?.intents || 0, icon: IntentIcon, color: 'primary.main' },
        ].map((stat) => (
          <Grid item xs={6} sm={4} md={2.4} key={stat.label}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: `${stat.color}15`,
                      color: stat.color,
                    }}
                  >
                    <stat.icon fontSize="small" />
                  </Avatar>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stat.value.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Delivery Rate */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Delivery Rate
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={140}
                    thickness={4}
                    sx={{ color: 'divider' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={successRate}
                    size={140}
                    thickness={4}
                    sx={{
                      color: 'success.main',
                      position: 'absolute',
                      left: 0,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {successRate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Success
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: 'success.main' }}>
                    {stats?.successfulEmails || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Delivered
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: 'error.main' }}>
                    {stats?.failedEmails || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Failed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Activity</Typography>
                <IconButton size="small" onClick={() => navigate('/logs')}>
                  <ArrowIcon />
                </IconButton>
              </Box>

              {recentEmails.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: 'primary.main',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <EmailIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="body1" gutterBottom>
                    No emails sent yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Send your first test email to get started
                  </Typography>
                  <Button variant="contained" onClick={() => navigate('/test')}>
                    Send Test Email
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {recentEmails.map((email) => (
                    <ListItem
                      key={email.id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {email.status === 'sent' ? (
                          <SuccessIcon color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={email.subject}
                        secondary={`To: ${email.to}`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      <Chip
                        label={email.status}
                        size="small"
                        color={email.status === 'sent' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Send Test Email', path: '/test', icon: EmailIcon },
                  { label: 'Manage Brands', path: '/brands', icon: BrandIcon },
                  { label: 'Browse Intents', path: '/intents', icon: IntentIcon },
                ].map((action) => (
                  <Grid item xs={12} sm={4} key={action.path}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<action.icon />}
                      onClick={() => navigate(action.path)}
                      sx={{
                        py: 1.5,
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                      }}
                    >
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
