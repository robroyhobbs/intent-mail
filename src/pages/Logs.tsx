import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  alpha,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  History as HistoryIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Fingerprint as IdIcon,
  Subject as SubjectIcon,
  Palette as BrandIcon,
  Psychology as IntentIcon,
} from '@mui/icons-material';
import { gradients } from '../theme';

interface EmailLog {
  id: string;
  brand: string;
  intent: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  sentAt: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Email Logs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track sent emails and delivery status
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="sent">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SuccessIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  Sent
                </Box>
              </MenuItem>
              <MenuItem value="failed">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  Failed
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          <Chip
            label={`${logs.length} logs`}
            sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}
          />
        </Box>
      </Box>

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
            background: gradients.purple,
          },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha('#6366f1', 0.1),
                color: '#6366f1',
                mx: 'auto',
                mb: 2,
              }}
            >
              <HistoryIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography color="text.secondary">
              No email logs found
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Logs will appear here after you send test emails
            </Typography>
          </CardContent>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Recipient</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Brand</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Intent</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow
                      key={log.id}
                      hover
                      sx={{
                        bgcolor: index % 2 === 0 ? 'transparent' : alpha('#f8fafc', 0.5),
                        '&:hover': {
                          bgcolor: alpha('#6366f1', 0.04),
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{formatDate(log.sentAt)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#6366f1' }}>
                          {log.to}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.brand}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            bgcolor: alpha('#ec4899', 0.1),
                            color: '#ec4899',
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.intent}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            bgcolor: alpha('#3b82f6', 0.1),
                            color: '#3b82f6',
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={log.status === 'sent' ? <SuccessIcon sx={{ fontSize: 14 }} /> : <ErrorIcon sx={{ fontSize: 14 }} />}
                          label={log.status}
                          size="small"
                          sx={{
                            bgcolor: log.status === 'sent' ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                            color: log.status === 'sent' ? '#10b981' : '#ef4444',
                            fontWeight: 600,
                            '& .MuiChip-icon': {
                              color: 'inherit',
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedLog(log)}
                            sx={{
                              bgcolor: alpha('#6366f1', 0.1),
                              '&:hover': { bgcolor: alpha('#6366f1', 0.2) },
                            }}
                          >
                            <ViewIcon fontSize="small" sx={{ color: '#6366f1' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontWeight: 500,
                    },
                    '& .Mui-selected': {
                      bgcolor: '#6366f1 !important',
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="sm" fullWidth>
        {selectedLog && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: selectedLog.status === 'sent' ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                      color: selectedLog.status === 'sent' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {selectedLog.status === 'sent' ? <SuccessIcon /> : <ErrorIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Email Details
                    </Typography>
                    <Chip
                      label={selectedLog.status}
                      size="small"
                      sx={{
                        mt: 0.5,
                        bgcolor: selectedLog.status === 'sent' ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                        color: selectedLog.status === 'sent' ? '#10b981' : '#ef4444',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>
                <IconButton onClick={() => setSelectedLog(null)} sx={{ mt: -1, mr: -1 }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <List disablePadding>
                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: alpha('#6366f1', 0.04),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <EmailIcon sx={{ color: '#6366f1' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="caption" color="text.secondary">Recipient</Typography>}
                    secondary={<Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedLog.to}</Typography>}
                  />
                </ListItem>

                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: alpha('#6366f1', 0.04),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SubjectIcon sx={{ color: '#6366f1' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="caption" color="text.secondary">Subject</Typography>}
                    secondary={<Typography variant="body2">{selectedLog.subject}</Typography>}
                  />
                </ListItem>

                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: alpha('#6366f1', 0.04),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <BrandIcon sx={{ color: '#ec4899' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="caption" color="text.secondary">Brand / Intent</Typography>}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip label={selectedLog.brand} size="small" sx={{ bgcolor: alpha('#ec4899', 0.1), color: '#ec4899' }} />
                        <Chip label={selectedLog.intent} size="small" sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }} />
                      </Box>
                    }
                  />
                </ListItem>

                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: alpha('#6366f1', 0.04),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ScheduleIcon sx={{ color: '#6366f1' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="caption" color="text.secondary">Sent At</Typography>}
                    secondary={<Typography variant="body2">{formatDate(selectedLog.sentAt)}</Typography>}
                  />
                </ListItem>

                {selectedLog.messageId && (
                  <ListItem
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: alpha('#10b981', 0.04),
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <IdIcon sx={{ color: '#10b981' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="caption" color="text.secondary">Message ID</Typography>}
                      secondary={<Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{selectedLog.messageId}</Typography>}
                    />
                  </ListItem>
                )}

                {selectedLog.error && (
                  <ListItem
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha('#ef4444', 0.08),
                      border: '1px solid',
                      borderColor: alpha('#ef4444', 0.2),
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ErrorIcon sx={{ color: '#ef4444' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="caption" sx={{ color: '#ef4444' }}>Error</Typography>}
                      secondary={<Typography variant="body2" sx={{ color: '#ef4444' }}>{selectedLog.error}</Typography>}
                    />
                  </ListItem>
                )}
              </List>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
