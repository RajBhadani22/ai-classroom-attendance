import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { getStudents, createStudent, uploadStudentPhotos } from '../api';
import './EnrollStudent.css';

function EnrollStudent() {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [createdStudent, setCreatedStudent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alert, setAlert] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await getStudents();
      setStudents(res.data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const showAlert = (severity, message) => {
    setAlert({ severity, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!name.trim() || !rollNumber.trim()) {
      showAlert('error', 'Name and Roll Number are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await createStudent({ name: name.trim(), roll_number: rollNumber.trim() });
      setCreatedStudent(res.data);
      showAlert('success', `Student "${res.data.name}" created! Now upload 3–5 face photos.`);
      setName('');
      setRollNumber('');
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Failed to create student.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    setPhotos((prev) => [...prev, ...acceptedFiles].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 5,
    disabled: !createdStudent,
  });

  const handleUpload = async () => {
    if (!createdStudent || photos.length < 3) {
      showAlert('warning', 'Please select at least 3 photos.');
      return;
    }
    setLoading(true);
    setUploadProgress(10);
    try {
      await uploadStudentPhotos(createdStudent.id, photos);
      setUploadProgress(100);
      showAlert('success', `Photos uploaded for ${createdStudent.name}!`);
      setPhotos([]);
      setCreatedStudent(null);
      fetchStudents();
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Photo upload failed.');
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <div className="enroll-container">
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Enroll Student
      </Typography>

      {alert && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Step 1: Create Student Record
          </Typography>
          <Box component="form" onSubmit={handleCreateStudent} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Student Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              sx={{ flex: 1, minWidth: 200 }}
              disabled={!!createdStudent}
            />
            <TextField
              label="Roll Number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
              sx={{ flex: 1, minWidth: 160 }}
              disabled={!!createdStudent}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}
              disabled={loading || !!createdStudent}
              sx={{ height: 56 }}
            >
              Create Student
            </Button>
          </Box>
        </CardContent>
      </Card>

      {createdStudent && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Step 2: Upload Face Photos for <strong>{createdStudent.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload 3–5 clear face photos. Ensure good lighting and different angles.
            </Typography>

            <div
              {...getRootProps()}
              className={`dropzone-area${isDragActive ? ' active' : ''}`}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography>
                {isDragActive ? 'Drop photos here…' : 'Drag & drop photos, or click to select'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({photos.length}/5 selected)
              </Typography>
            </div>

            {photos.length > 0 && (
              <div className="photo-preview-grid">
                {photos.map((f, i) => (
                  <img
                    key={i}
                    src={URL.createObjectURL(f)}
                    alt={`preview-${i}`}
                    className="photo-thumb"
                  />
                ))}
              </div>
            )}

            {uploadProgress > 0 && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2 }} />}

            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={loading || photos.length < 3}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
              >
                Upload Photos
              </Button>
              <Button variant="outlined" onClick={() => { setCreatedStudent(null); setPhotos([]); }}>
                Cancel
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Enrolled Students ({students.length})
      </Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Roll Number</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">No students enrolled yet.</TableCell>
              </TableRow>
            ) : (
              students.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.roll_number}</TableCell>
                  <TableCell>
                    <Chip
                      label={s.photos_count > 0 ? 'Enrolled' : 'Pending Photos'}
                      color={s.photos_count > 0 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
}

export default EnrollStudent;
