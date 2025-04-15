import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import axios from 'axios';

// API endpoint configuration
const API_BASE_URL = 'https://pdf-merger-backend-nu.vercel.app';

// Configure axios defaults
axios.defaults.timeout = 60000; // 60 seconds timeout for large files
axios.defaults.headers.common['Accept'] = 'application/pdf';

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const theme = useTheme();

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const invalidFiles = selectedFiles.filter(file => !file.type.includes('pdf'));
    if (invalidFiles.length > 0) {
      setError('Please select only PDF files');
      return;
    }
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    setError('');
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    files.forEach(file => {
      formData.append('pdfs', file);
    });

    try {
      console.log('Sending request to:', `${API_BASE_URL}/api/merge-pdfs`);
      
      // First check if the API is accessible
      try {
        await fetch(`${API_BASE_URL}/api/test`, { method: 'GET' });
      } catch (checkError) {
        console.error('API check failed:', checkError);
        throw new Error('Unable to connect to the server. Please try again later.');
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/merge-pdfs`, formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout for large files
        validateStatus: status => status === 200,
        // Add withCredentials to handle CORS properly
        withCredentials: false,
      });

      console.log('Response received:', response.status);
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('Invalid content type:', contentType);
        throw new Error('Invalid response from server');
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('PDFs merged successfully!');
      setFiles([]);
    } catch (err) {
      console.error('Error merging PDFs:', err);
      
      // Enhanced error detection and user feedback
      if (err.message && err.message.includes('connect to the server')) {
        setError(err.message);
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. The files might be too large. Please try with smaller files (under 10MB total).');
      } else if (err.response) {
        // The request was made and the server responded with a non-2xx status
        if (err.response.status === 413) {
          setError('Files too large. Please upload smaller files (under 10MB total).');
        } else if (err.response.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result);
              setError(errorData.error || 'Error merging PDFs. Please try again.');
            } catch (e) {
              setError('Error merging PDFs. Please try again.');
            }
          };
          reader.readAsText(err.response.data);
        } else {
          setError(err.response.data.error || 'Error merging PDFs. Please try again.');
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. This may be due to server limitations with large files. Please try with fewer or smaller PDFs.');
      } else {
        setError(err.message || 'Error merging PDFs. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)} 30%, ${alpha(theme.palette.secondary.main, 0.05)} 90%)`,
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textAlign: 'center',
              mb: 1,
            }}
          >
            PDF Merger
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              maxWidth: '600px',
              mb: 2,
            }}
          >
            Select multiple PDF files to merge them into a single document
          </Typography>

          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: '800px',
              backgroundColor: 'background.paper',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: theme.palette.primary.main,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <input
                accept="application/pdf"
                style={{ display: 'none' }}
                id="raised-button-file"
                multiple
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="raised-button-file">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  size="large"
                  sx={{
                    py: 1.5,
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: theme.shadows[4],
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  Select PDF Files
                </Button>
              </label>

              {files.length > 0 && (
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {files.map((file, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        mb: 1,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveFile(index)}
                          sx={{
                            color: theme.palette.error.main,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <PdfIcon sx={{ color: theme.palette.primary.main }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                  }}
                >
                  {error}
                </Alert>
              )}

              {success && (
                <Alert
                  severity="success"
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                  }}
                >
                  {success}
                </Alert>
              )}

              <Button
                variant="contained"
                color="primary"
                onClick={handleMerge}
                disabled={files.length < 2 || loading}
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Merge PDFs'
                )}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default App;
