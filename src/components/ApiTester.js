import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';

const ApiTester = ({ apiParams, onApiTest }) => {
  const [files, setFiles] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [selectedParams, setSelectedParams] = useState({});

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

  const callApi = async () => {
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

    try {
      const response = await axios.post(
        apiParams.url,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${apiParams.api_key}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setTestResult(response.data);
      onApiTest(response.data);
    } catch (error) {
      console.error('API 호출 중 오류 발생:', error);
      const errorResult = { error: error.response ? error.response.data : error.message };
      setTestResult(errorResult);
      onApiTest(errorResult);
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
          <Button variant="contained" color="primary" onClick={callApi} sx={{ mt: 2 }}>
            API 호출
          </Button>
        </Grid>
      </Grid>
      {testResult && (
        <Paper elevation={3} sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>테스트 결과</Typography>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
          <Button variant="outlined" color="primary" onClick={handleCopy} sx={{ mt: 2 }}>
            결과 복사
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default ApiTester;