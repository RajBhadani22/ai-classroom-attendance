import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { STATUS_COLORS } from '../constants';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SendIcon from '@mui/icons-material/Send';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { getClasses, createAttendanceSession } from '../api';
import { format } from 'date-fns';
import './MarkAttendance.css';

function MarkAttendance() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);

  useEffect(() => {
    getClasses()
      .then((r) => setClasses(r.data))
      .catch(() => {});
  }, []);

  const showAlert = (severity, message) => {
    setAlert({ severity, message });
    setTimeout(() => setAlert(null), 6000);
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setCameraOpen(false);
      stopCamera();
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOpen(true);
    } catch {
      showAlert('error', 'Camera access denied or not available.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      stopCamera();
    }, 'image/jpeg');
  };

  const handleSubmit = async () => {
    if (!selectedClass || !imageFile) {
      showAlert('error', 'Please select a class and provide an image.');
      return;
    }
    setLoading(true);
    setSessionResult(null);
    try {
      const formData = new FormData();
      formData.append('class_id', selectedClass);
      formData.append('date', date);
      formData.append('image', imageFile);
      const res = await createAttendanceSession(formData);
      setSessionResult(res.data);
      showAlert('success', 'Attendance processed successfully!');
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Failed to process attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-container">
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Mark Attendance
      </Typography>

      {alert && <Alert severity={alert.severity} sx={{ mb: 2 }}>{alert.message}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass}
                label="Select Class"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Typography variant="subtitle1" gutterBottom fontWeight={600}>
            Upload or Capture Classroom Image
          </Typography>

          {!cameraOpen ? (
            <>
              <div {...getRootProps()} className={`dropzone-area${isDragActive ? ' active' : ''}`}>
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography>
                  {isDragActive ? 'Drop image here…' : 'Drag & drop classroom image, or click to select'}
                </Typography>
              </div>
              <Button
                startIcon={<CameraAltIcon />}
                onClick={startCamera}
                sx={{ mt: 2 }}
                variant="outlined"
              >
                Use Camera
              </Button>
            </>
          ) : (
            <Box sx={{ mt: 1 }}>
              <video ref={videoRef} autoPlay playsInline className="camera-preview" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={capturePhoto} startIcon={<CameraAltIcon />}>
                  Capture
                </Button>
                <Button variant="outlined" onClick={stopCamera}>Cancel</Button>
              </Box>
            </Box>
          )}

          {imagePreview && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Preview:</Typography>
              <img src={imagePreview} alt="preview" className="image-preview" />
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              onClick={handleSubmit}
              disabled={loading || !selectedClass || !imageFile}
            >
              {loading ? 'Processing…' : 'Submit Attendance'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {sessionResult && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Results – Session #{sessionResult.id}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={`✓ Present: ${sessionResult.present_count ?? 0}`} sx={{ bgcolor: STATUS_COLORS.present, color: 'white' }} />
              <Chip label={`✗ Absent: ${sessionResult.absent_count ?? 0}`} sx={{ bgcolor: STATUS_COLORS.absent, color: 'white' }} />
              <Chip label={`? Unknown: ${sessionResult.unknown_count ?? 0}`} sx={{ bgcolor: STATUS_COLORS.unknown, color: 'white' }} />
            </Box>

            <Paper>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(sessionResult.records || []).map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{r.student_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Chip
                          label={r.status}
                          size="small"
                          sx={{
                            bgcolor: STATUS_COLORS[r.status] || STATUS_COLORS.unknown,
                            color: 'white',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {r.confidence !== undefined ? `${(r.confidence * 100).toFixed(1)}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Divider sx={{ my: 2 }} />
            <Button
              variant="outlined"
              startIcon={<RateReviewIcon />}
              onClick={() => navigate(`/review/${sessionResult.id}`)}
            >
              Manual Review
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MarkAttendance;
