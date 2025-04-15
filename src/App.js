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
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { PDFDocument } from 'pdf-lib';

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
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
    
    // Limit total size to avoid browser memory issues
    const totalSize = [...files, ...selectedFiles].reduce((sum, file) => sum + file.size, 0);
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    if (totalSize > maxSize) {
      setError('Total file size exceeds 100MB. Please select smaller files.');
      return;
    }
    
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    setError('');
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const mergePDFs = async (pdfFiles) => {
    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Set initial progress
      setProgress(0);
      
      // Process each PDF file
      for (let i = 0; i < pdfFiles.length; i++) {
        // Update progress
        setProgress((i / pdfFiles.length) * 100);
        
        // Get file data
        const file = pdfFiles[i];
        const fileData = await readFileAsArrayBuffer(file);
        
        // Load the PDF document
        const pdfDoc = await PDFDocument.load(fileData);
        
        // Copy all pages from the current document to the merged document
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      
      // Convert to Blob and return
      setProgress(100);
      return new Blob([mergedPdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error merging PDFs:', error);
      throw new Error(`Failed to merge PDFs: ${error.message}`);
    }
  };
  
  // Helper function to read file as ArrayBuffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Starting client-side PDF merge');
      
      // Merge PDFs client-side
      const mergedPdfBlob = await mergePDFs(files);
      
      // Create download link
      const url = URL.createObjectURL(mergedPdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('PDFs merged successfully!');
      setFiles([]);
    } catch (err) {
      console.error('Error in client-side PDF merging:', err);
      setError(`Error merging PDFs: ${err.message}. Try with fewer or smaller files.`);
    } finally {
      setLoading(false);
      setProgress(0);
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

          <Alert 
            severity="info" 
            icon={<InfoIcon />}
            sx={{ width: '100%', maxWidth: '800px', mb: 2 }}
          >
            This tool merges PDFs directly in your browser. No files are uploaded to any server.
          </Alert>

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

              {loading && (
                <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Processing... {Math.round(progress)}%
                  </Typography>
                </Box>
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
