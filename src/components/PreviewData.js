import React, { useState } from 'react';
import { Box, Button, Typography, Grid, Paper, IconButton, Snackbar } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MuiAlert from '@mui/material/Alert';

const PreviewData = ({ previewData, generatePreviewData, sampleApiData }) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleGeneratePreview = () => {
    generatePreviewData();
    if (!previewData.error) {
      setSnackbar({ open: true, message: '미리보기가 성공적으로 생성되었습니다.', severity: 'success' });
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>실시간 미리보기</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={5}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>샘플 API 데이터:</Typography>
            <pre style={{ maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(sampleApiData, null, 2)}
            </pre>
          </Paper>
        </Grid>
        <Grid item xs={2} container justifyContent="center">
          <IconButton 
            color="primary" 
            onClick={handleGeneratePreview}
            sx={{ 
              width: '60px', 
              height: '60px', 
              border: '2px solid', 
              borderColor: 'primary.main' 
            }}
          >
            <ArrowForwardIcon fontSize="large" />
          </IconButton>
        </Grid>
        <Grid item xs={5}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>변환 결과:</Typography>
            {previewData.error ? (
              <Typography color="error">에러: {previewData.error}</Typography>
            ) : (
              <pre style={{ maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(previewData, null, 2)}
              </pre>
            )}
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert elevation={6} variant="filled" onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default PreviewData;