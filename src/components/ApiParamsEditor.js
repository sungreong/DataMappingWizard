import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Button, Paper, Grid, Switch, FormControlLabel, Select, MenuItem, Tabs, Tab } from '@mui/material';
import Editor from "@monaco-editor/react";

const ApiParamsEditor = ({ apiParams, onApiParamsChange }) => {
  const [url, setUrl] = useState(apiParams.url || 'https://api.example.com/v1/endpoint');
  const [apiKey, setApiKey] = useState(apiParams.api_key || '');
  const [useApiKey, setUseApiKey] = useState(!!apiParams.api_key);
  const [paramsJson, setParamsJson] = useState(JSON.stringify(apiParams.data || {}, null, 2));
  const [localParams, setLocalParams] = useState({});
  const [error, setError] = useState('');
  const [codeExampleTab, setCodeExampleTab] = useState(0);

  useEffect(() => {
    try {
      const parsedParams = JSON.parse(paramsJson);
      setLocalParams(parsedParams);
      setError('');
    } catch (e) {
      setError('유효하지 않은 JSON 형식입니다.');
    }
  }, [paramsJson]);

  const handleEditorChange = (value) => {
    setParamsJson(value);
  };

  const handleSave = () => {
    try {
      const parsedParams = JSON.parse(paramsJson);
      onApiParamsChange({
        url,
        api_key: useApiKey ? apiKey : '',
        data: parsedParams
      });
    } catch (e) {
      setError('유효하지 않은 JSON 형식입니다. 저장할 수 없습니다.');
    }
  };

  const generateCodeExamples = () => {
    const dataForExample = Object.entries(localParams).reduce((acc, [key, value]) => {
      if (value.type === 'file') {
        acc[key] = '<file>';
      } else {
        acc[key] = value.default;
      }
      return acc;
    }, {});

    const curlExample = `curl -X POST "${url}" \\
  ${useApiKey && apiKey ? `-H "Authorization: Bearer ${apiKey}" \\` : ''}
  ${Object.entries(dataForExample).map(([key, value]) => {
    if (value === '<file>') {
      return `-F "${key}=@/path/to/file" \\`;
    } else {
      return `-F "${key}=${value}" \\`;
    }
  }).join('\n  ')}
  -H "Content-Type: multipart/form-data"`;

    const javascriptExample = `const axios = require('axios');
const FormData = require('form-data');

const formData = new FormData();
${Object.entries(dataForExample).map(([key, value]) => {
  if (value === '<file>') {
    return `formData.append('${key}', /* file object */);`;
  } else {
    return `formData.append('${key}', '${value}');`;
  }
}).join('\n')}

axios.post('${url}', formData, {
  headers: {
    ...formData.getHeaders(),
    ${useApiKey && apiKey ? `'Authorization': 'Bearer ${apiKey}',` : ''}
  }
})
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));`;

    const pythonExample = `import requests

url = '${url}'
headers = {
    ${useApiKey && apiKey ? `'Authorization': 'Bearer ${apiKey}',` : ''}
}
files = {${Object.entries(dataForExample).map(([key, value]) => {
  if (value === '<file>') {
    return `'${key}': open('/path/to/file', 'rb')`;
  } else {
    return `'${key}': ('', '${value}')`;
  }
}).join(', ')}}

response = requests.post(url, files=files, headers=headers)
print(response.json())`;

    return { curlExample, javascriptExample, pythonExample };
  };

  const codeExamples = generateCodeExamples();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>API 설정</Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="API URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={useApiKey}
                onChange={(e) => setUseApiKey(e.target.checked)}
              />
            }
            label="API Key 사용"
          />
        </Grid>
        {useApiKey && (
          <Grid item xs={12}>
            <TextField
              label="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              fullWidth
              margin="normal"
              type="password"
            />
          </Grid>
        )}
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>파라미터 JSON</Typography>
      <Box sx={{ height: 400, border: '1px solid #ccc' }}>
        <Editor
          height="100%"
          defaultLanguage="json"
          defaultValue={paramsJson}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
          }}
        />
      </Box>
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      <Button variant="contained" color="primary" onClick={handleSave} sx={{ mt: 2 }}>
        저장
      </Button>

      <Paper elevation={3} sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>코드 예제</Typography>
        <Tabs value={codeExampleTab} onChange={(e, newValue) => setCodeExampleTab(newValue)}>
          <Tab label="CURL" />
          <Tab label="JavaScript" />
          <Tab label="Python" />
        </Tabs>
        <Box sx={{ mt: 2 }}>
          {codeExampleTab === 0 && (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {codeExamples.curlExample}
            </pre>
          )}
          {codeExampleTab === 1 && (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {codeExamples.javascriptExample}
            </pre>
          )}
          {codeExampleTab === 2 && (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {codeExamples.pythonExample}
            </pre>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ApiParamsEditor;