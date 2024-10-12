import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';

const ApiTester = ({ apiParams }) => {
  const [files, setFiles] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [selectedParams, setSelectedParams] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (key, event) => {
    setFiles(prev => ({ ...prev, [key]: event.target.files[0] }));
  };

  const handleParamChange = (key, value) => {
    setSelectedParams(prev => ({ ...prev, [key]: value }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(testResult, null, 2))
      .then(() => alert('결과가 클립보드에 복사되었습니다.'))
      .catch(err => console.error('복사 실패:', err));
  };

  const handleApiCall = async () => {
    const formData = new FormData();
    
    Object.entries(apiParams.data).forEach(([key, param]) => {
      if (param.type === 'file') {
        if (files[key]) {
          formData.append(key, files[key]);
        } else {
          alert(`${key} 파일을 선택해주세요.`);
          return;
        }
      } else {
        formData.append(key, selectedParams[key] || param.default);
      }
    });
  
    setIsLoading(true);
    try {
      const response = await fetch(apiParams.url, {
        method: 'POST',
        headers: {
          ...(apiParams.api_key && { 'Authorization': `Bearer ${apiParams.api_key}` }),
        },
        body: formData,
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error('API 호출 오류:', error);
      setTestResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>API 테스트</Typography>
      <Grid container spacing={2}>
        {Object.entries(apiParams.data).map(([key, param]) => (
          <Grid item xs={12} key={key}>
            {param.type === 'file' ? (
              <Box>
                <Typography variant="subtitle1" gutterBottom>{key}</Typography>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(key, e)}
                  accept={param.accept || '*'}
                />
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>{key}</InputLabel>
                <Select
                  value={selectedParams[key] || param.default}
                  onChange={(e) => handleParamChange(key, e.target.value)}
                  label={key}
                >
                  {param.type === 'array' ? (
                    param.items.enum.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))
                  ) : param.type === 'boolean' ? (
                    [true, false].map((option) => (
                      <MenuItem key={option.toString()} value={option}>{option.toString()}</MenuItem>
                    ))
                  ) : param.enum ? (
                    param.enum.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))
                  ) : (
                    <MenuItem value={param.default}>{param.default}</MenuItem>
                  )}
                </Select>
              </FormControl>
            )}
          </Grid>
        ))}
        <Grid item xs={12}>
          <Box display="flex" alignItems="center">
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleApiCall} 
              disabled={isLoading}
              sx={{ mt: 2, mr: 2 }}
            >
              API 호출
            </Button>
            {isLoading && <CircularProgress size={24} />}
          </Box>
        </Grid>
      </Grid>
      {testResult && (
        <Paper elevation={3} sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>테스트 결과</Typography>
          <Box 
            sx={{ 
              maxWidth: '100%', 
              maxHeight: '300px', 
              overflow: 'auto', 
              backgroundColor: '#f5f5f5',
              padding: 2,
              borderRadius: 1
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </Box>
          <Button variant="outlined" color="primary" onClick={handleCopy} sx={{ mt: 2 }}>
            결과 복사
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default ApiTester;
