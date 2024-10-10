import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const PreviewData = ({ previewData, generatePreviewData, sampleApiData }) => {
  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>실시간 미리보기</Typography>
      <Button variant="contained" color="primary" onClick={generatePreviewData} style={{ marginBottom: '10px' }}>
        미리보기 생성
      </Button>
      <Typography variant="subtitle1" gutterBottom>샘플 API 데이터:</Typography>
      <pre>{JSON.stringify(sampleApiData, null, 2)}</pre>
      <Typography variant="subtitle1" gutterBottom>변환 결과:</Typography>
      {previewData.error ? (
        <Typography color="error">에러: {previewData.error}</Typography>
      ) : (
        <pre>{JSON.stringify(previewData, null, 2)}</pre>
      )}
    </Box>
  );
};

export default PreviewData;