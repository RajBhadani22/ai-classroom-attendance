import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getSession, getStudents, updateRecord, confirmSession } from '../api';
import './ManualReview.css';

function FaceBoxOverlay({ records, imageNaturalWidth, imageNaturalHeight, displayWidth, displayHeight }) {
  if (!displayWidth || !displayHeight || !imageNaturalWidth || !imageNaturalHeight) return null;
  const scaleX = displayWidth / imageNaturalWidth;
  const scaleY = displayHeight / imageNaturalHeight;

  const statusColors = { present: '#2e7d32', unknown: '#e65100', absent: '#c62828' };

  return (
    <>
      {records
        .filter((r) => r.bbox)
        .map((r, i) => {
          const [x, y, w, h] = r.bbox;
          const color = statusColors[r.status] || '#1976d2';
          return (
            <div
              key={i}
              className="face-box"
              style={{
                left: x * scaleX,
                top: y * scaleY,
                width: w * scaleX,
                height: h * scaleY,
                borderColor: color,
              }}
            >
              <span className="face-label" style={{ backgroundColor: color }}>
                {r.student_name || 'Unknown'} {r.confidence !== undefined ? `(${(r.confidence * 100).toFixed(0)}%)` : ''}
              </span>
            </div>
          );
        })}
    </>
  );
}

function ManualReview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [changes, setChanges] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [alert, setAlert] = useState(null);
  const [imgDimensions, setImgDimensions] = useState({ natural: {}, display: {} });

  const showAlert = (severity, message) => {
    setAlert({ severity, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionRes, studentsRes] = await Promise.all([
        getSession(sessionId),
        getStudents(),
      ]);
      setSession(sessionRes.data);
      setRecords(sessionRes.data.records || []);
      setStudents(studentsRes.data);
    } catch {
      showAlert('error', 'Failed to load session data.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignmentChange = (recordId, studentId) => {
    setChanges((prev) => ({ ...prev, [recordId]: studentId }));
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              student_id: studentId || null,
              student_name: studentId
                ? students.find((s) => s.id === studentId)?.name || 'Unknown'
                : 'Unknown',
              status: studentId ? 'present' : 'unknown',
            }
          : r
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(changes).map(([recordId, studentId]) =>
          updateRecord(sessionId, recordId, {
            student_id: studentId || null,
            status: studentId ? 'present' : 'unknown',
          })
        )
      );
      setChanges({});
      showAlert('success', 'Changes saved successfully.');
    } catch {
      showAlert('error', 'Failed to save some changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await confirmSession(sessionId);
      showAlert('success', 'Attendance confirmed!');
      setTimeout(() => navigate('/'), 1500);
    } catch {
      showAlert('error', 'Failed to confirm session.');
    } finally {
      setConfirming(false);
    }
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    setImgDimensions({
      natural: { width: img.naturalWidth, height: img.naturalHeight },
      display: { width: img.offsetWidth, height: img.offsetHeight },
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statusColors = { present: '#2e7d32', unknown: '#e65100', absent: '#c62828' };

  return (
    <div className="review-container">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
          Back
        </Button>
        <Typography variant="h4" fontWeight={700}>
          Manual Review – Session #{sessionId}
        </Typography>
      </Box>

      {alert && <Alert severity={alert.severity} sx={{ mb: 2 }}>{alert.message}</Alert>}

      {session?.image_url && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Classroom Image</Typography>
            <div className="image-wrapper">
              <img
                src={session.image_url}
                alt="classroom"
                className="classroom-image"
                onLoad={handleImageLoad}
              />
              <FaceBoxOverlay
                records={records}
                imageNaturalWidth={imgDimensions.natural.width}
                imageNaturalHeight={imgDimensions.natural.height}
                displayWidth={imgDimensions.display.width}
                displayHeight={imgDimensions.display.height}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Face Detections ({records.length})
          </Typography>
          {saving && <LinearProgress sx={{ mb: 1 }} />}
          <Paper>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Detected As</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assign To</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No detections found.</TableCell>
                  </TableRow>
                ) : (
                  records.map((r, i) => (
                    <TableRow key={r.id || i} hover>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{r.student_name || 'Unknown'}</TableCell>
                      <TableCell>
                        {r.confidence !== undefined ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={r.confidence * 100}
                              sx={{ width: 60, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption">{(r.confidence * 100).toFixed(1)}%</Typography>
                          </Box>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={r.status || 'unknown'}
                          size="small"
                          sx={{
                            bgcolor: statusColors[r.status] || '#757575',
                            color: 'white',
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <InputLabel>Student</InputLabel>
                          <Select
                            value={changes[r.id] !== undefined ? changes[r.id] : (r.student_id || '')}
                            label="Student"
                            onChange={(e) => handleAssignmentChange(r.id, e.target.value)}
                          >
                            <MenuItem value="">Unknown</MenuItem>
                            {students.map((s) => (
                              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </CardContent>
      </Card>

      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || Object.keys(changes).length === 0}
        >
          Save Changes ({Object.keys(changes).length})
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={confirming ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
          onClick={handleConfirm}
          disabled={confirming}
        >
          Confirm Attendance
        </Button>
      </Box>
    </div>
  );
}

export default ManualReview;
