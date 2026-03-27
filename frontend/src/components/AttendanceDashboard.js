import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  Collapse,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { getClasses, getSessions, exportAttendance } from '../api';
import { format } from 'date-fns';
import './AttendanceDashboard.css';

function StatusChip({ status }) {
  const colors = { present: '#2e7d32', absent: '#c62828', unknown: '#e65100' };
  return (
    <Chip
      label={status}
      size="small"
      sx={{ bgcolor: colors[status] || '#757575', color: 'white', textTransform: 'capitalize' }}
    />
  );
}

function SessionRow({ session }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <TableRow hover className="session-row" onClick={() => setOpen((o) => !o)}>
        <TableCell>
          <IconButton size="small">{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
        </TableCell>
        <TableCell>{session.id}</TableCell>
        <TableCell>{session.class_name || session.class_id}</TableCell>
        <TableCell>{session.date}</TableCell>
        <TableCell>
          <Chip label={session.total_students ?? '—'} size="small" variant="outlined" />
        </TableCell>
        <TableCell>
          <Chip label={session.present_count ?? 0} size="small" sx={{ bgcolor: '#2e7d32', color: 'white' }} />
        </TableCell>
        <TableCell>
          <Chip label={session.absent_count ?? 0} size="small" sx={{ bgcolor: '#c62828', color: 'white' }} />
        </TableCell>
        <TableCell>
          <Tooltip title="Manual Review">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); navigate(`/review/${session.id}`); }}
            >
              <RateReviewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} sx={{ p: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ m: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Per-Student Attendance</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Roll Number</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(session.records || []).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.student_name || '—'}</TableCell>
                      <TableCell>{r.roll_number || '—'}</TableCell>
                      <TableCell><StatusChip status={r.status} /></TableCell>
                      <TableCell>
                        {r.confidence !== undefined ? `${(r.confidence * 100).toFixed(1)}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!session.records || session.records.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No records available. Click Review to load details.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function AttendanceDashboard() {
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    getClasses().then((r) => setClasses(r.data)).catch(() => {});
  }, []);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClass) params.class_id = selectedClass;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await getSessions(params);
      setSessions(res.data);
    } catch {
      setAlert({ severity: 'error', message: 'Failed to load sessions.' });
    } finally {
      setLoading(false);
    }
  }, [selectedClass, startDate, endDate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleExport = async () => {
    try {
      const params = {};
      if (selectedClass) params.class_id = selectedClass;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await exportAttendance(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${format(new Date(), 'yyyyMMdd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setAlert({ severity: 'error', message: 'Export failed.' });
    }
  };

  return (
    <div className="dashboard-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Attendance Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </Box>

      {alert && <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert(null)}>{alert.message}</Alert>}

      <div className="filter-bar">
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Class</InputLabel>
          <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
            <MenuItem value="">All Classes</MenuItem>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={fetchSessions}>
          Apply Filters
        </Button>
      </div>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Session ID</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Present</TableCell>
                <TableCell>Absent</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    No sessions found. Mark attendance to get started.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s) => <SessionRow key={s.id} session={s} />)
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </div>
  );
}

export default AttendanceDashboard;
