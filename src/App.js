import React, { useState, useEffect } from 'react';
import './App.css';
import SchemaViewer from './components/SchemaViewer';
import SchemaEditor from './components/SchemaEditor';
import FlowDiagram from './components/FlowDiagram';
import FinalConversionViewer from './components/FinalConversionViewer';
import PreviewData from './components/PreviewData';
import MappingList from './components/MappingList';
import FunctionViewer from './components/FunctionViewer';
import SampleDataEditor from './components/SampleDataEditor';
import { Box, Container, Grid, Paper, Typography, Snackbar, Button, Tabs, Tab } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { validateOutputSchema } from './utils/schemaValidator';

function App() {
  const [apiSchema, setApiSchema] = useState({
    id: 'number',
    name: 'string',
    email: 'string',
    address: {
      street: 'string',
      city: 'string',
      country: 'string'
    }
  });

  const [uiSchema, setUiSchema] = useState({
    userId: 'number',
    fullName: 'string',
    contactEmail: 'string',
    location: 'string'
  });

  const [mapping, setMapping] = useState({});
  const [previewData, setPreviewData] = useState({});
  const [selectedUiField, setSelectedUiField] = useState(null);
  const [transformFunctions, setTransformFunctions] = useState({});
  const [finalConversionFunction, setFinalConversionFunction] = useState('');
  const [sampleApiData, setSampleApiData] = useState({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    address: {
      street: "123 Main St",
      city: "New York",
      country: "USA"
    }
  });

  const [customFunctions, setCustomFunctions] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isEditingSchema, setIsEditingSchema] = useState(false);

  const [activeTab, setActiveTab] = useState(0);

  const [isEditingSampleData, setIsEditingSampleData] = useState(false);

  const handleMappingChange = (uiField, apiField) => {
    setMapping(prevMapping => {
      const newMapping = { ...prevMapping };
      if (uiField in newMapping) {
        if (newMapping[uiField].includes(apiField)) {
          newMapping[uiField] = newMapping[uiField].filter(field => field !== apiField);
        } else {
          newMapping[uiField] = [...newMapping[uiField], apiField];
        }
      } else {
        newMapping[uiField] = [apiField];
      }
      if (newMapping[uiField].length === 0) {
        delete newMapping[uiField];
        // 매핑이 완전히 제거되면 해당 변환 함수도 초기화
        setTransformFunctions(prev => {
          const updated = { ...prev };
          delete updated[uiField];
          return updated;
        });
        setCustomFunctions(prev => {
          const updated = { ...prev };
          delete updated[uiField];
          return updated;
        });
      }
      return newMapping;
    });
    setSelectedUiField(uiField);
  };

  const handleFunctionChange = (uiField, newFunction) => {
    console.log(`Updating function for ${uiField}:`, newFunction);
    setTransformFunctions(prev => {
      const updated = {
        ...prev,
        [uiField]: newFunction
      };
      console.log('Updated transform functions:', updated);
      return updated;
    });
  };

  const handleCustomFunctionChange = (uiField, newFunction) => {
    setCustomFunctions(prev => {
      const updated = {
        ...prev,
        [uiField]: newFunction
      };
      // customFunctions가 업데이트될 때 finalConversionFunction도 업데이트
      const newFinalFunction = generateFinalConversionFunction(mapping, updated);
      setFinalConversionFunction(newFinalFunction);
      return updated;
    });
    setSnackbar({ open: true, message: '함수가 성공적으로 저장되었습니다.', severity: 'success' });
  };

  const generateFinalConversionFunction = (currentMapping = mapping, currentCustomFunctions = customFunctions) => {
    console.log('Current mapping:', currentMapping);
    console.log('Current custom functions:', currentCustomFunctions);
    
    const transformFunctions = {};
    const functionBody = Object.entries(currentMapping).reduce((acc, [uiField, apiFields]) => {
      const functionComment = `// Input: ${apiFields.map(field => `${field}: ${apiSchema[field]}`).join(', ')}\n  // Output: ${uiField}: ${uiSchema[uiField]}`;
      
      if (currentCustomFunctions[uiField]) {
        // 사용자 정의 함수가 있는 경우
        const funcBody = currentCustomFunctions[uiField].replace(/^function\s+\w+\s*\([^)]*\)\s*{/, '').replace(/}$/, '').trim();
        transformFunctions[uiField] = `function(${apiFields.join(', ')}) { ${funcBody} }`;
      } else if (apiFields.length === 1) {
        // 단일 필드 매핑
        transformFunctions[uiField] = `function(${apiFields[0]}) { return ${apiFields[0]}; }`;
      } else if (apiFields.length > 1) {
        // 다중 필드 매핑 (기본 함수 사용)
        transformFunctions[uiField] = `function(${apiFields.join(', ')}) { return ${apiFields[0]}; }`;
      }

      acc += `${functionComment}\n  ${uiField}: transformFunctions.${uiField}(${apiFields.map(f => `data.${f}`).join(', ')}),\n\n`;
      return acc;
    }, '');

    // 마지막 쉼표 제거 및 빈 객체 처리
    const trimmedFunctionBody = functionBody.trim().replace(/,\s*$/, '') || '  // No mappings defined';

    const transformFunctionsString = Object.entries(transformFunctions)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join(',\n');

    return `
const transformFunctions = {
${transformFunctionsString}
};

function convertData(data) {
  return {
${trimmedFunctionBody}
  };
}`;
  };

  const generatePreviewData = () => {
    // 모든 UI 스키마 필드가 매핑되었는지 확인
    const unmappedFields = Object.keys(uiSchema).filter(field => !mapping[field] || mapping[field].length === 0);
    if (unmappedFields.length > 0) {
      const errorMessage = `다음 필드가 매핑되지 않았습니다: ${unmappedFields.join(', ')}`;
      setPreviewData({ error: errorMessage });
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      return;
    }

    const finalFunction = generateFinalConversionFunction();
    setFinalConversionFunction(finalFunction);

    try {
      // eslint-disable-next-line no-new-func
      const convertFunction = new Function('data', `
        ${finalFunction}
        return convertData(data);
      `);
      const result = convertFunction(sampleApiData);
      
      // Output schema 검증
      const validationErrors = validateOutputSchema(result, uiSchema);
      if (validationErrors.length > 0) {
        throw new Error(`Output schema validation failed: ${validationErrors.join(', ')}`);
      }

      setPreviewData(result);
    } catch (error) {
      console.error('Error in conversion function:', error);
      setPreviewData({ error: error.message });
      setSnackbar({ open: true, message: `변환 중 오류 발생: ${error.message}`, severity: 'error' });
    }
  };

  const handleNodeClick = (uiField) => {
    setSelectedUiField(uiField);
  };

  // 자동 업데이트 useEffect 제거

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleApiSchemaChange = (newSchema) => {
    setApiSchema(newSchema);
    setIsEditingSchema(false);
    // 매핑 초기화
    setMapping({});
    // 변환 함수 초기화
    setTransformFunctions({});
    setCustomFunctions({});
    // 미리보기 데이터 초기화
    setPreviewData({});
    setSnackbar({ open: true, message: 'API 응답 스키마가 업데이트되었습니다. 매핑을 다시 설정해주세요.', severity: 'info' });
  };

  const handleSampleDataChange = (newSampleData) => {
    setSampleApiData(newSampleData);
    setIsEditingSampleData(false);
    setSnackbar({ open: true, message: '샘플 API 데이터가 업데이트되었습니다.', severity: 'info' });
  };

  useEffect(() => {
    const newFunction = generateFinalConversionFunction();
    setFinalConversionFunction(newFunction);
  }, [mapping, customFunctions]);

  return (
    <Container maxWidth="xl" className="App">
      <Typography variant="h4" component="h1" gutterBottom>
        데이터 매핑 에디터
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="API 스키마" />
              <Tab label="UI 스키마" />
              <Tab label="샘플 데이터" />
            </Tabs>
            <Box p={2}>
              {activeTab === 0 && (
                <>
                  {isEditingSchema ? (
                    <SchemaEditor 
                      schema={apiSchema} 
                      onSchemaChange={handleApiSchemaChange} 
                    />
                  ) : (
                    <>
                      <SchemaViewer title="API 응답 스키마" schema={apiSchema} />
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => setIsEditingSchema(true)}
                        sx={{ marginTop: 2 }}
                      >
                        스키마 편집
                      </Button>
                    </>
                  )}
                </>
              )}
              {activeTab === 1 && (
                <SchemaViewer title="UI 요구 스키마" schema={uiSchema} />
              )}
              {activeTab === 2 && (
                <>
                  {isEditingSampleData ? (
                    <SampleDataEditor 
                      sampleData={sampleApiData} 
                      onSampleDataChange={handleSampleDataChange} 
                    />
                  ) : (
                    <>
                      <SchemaViewer title="샘플 API 데이터" schema={sampleApiData} />
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => setIsEditingSampleData(true)}
                        sx={{ marginTop: 2 }}
                      >
                        샘플 데이터 편집
                      </Button>
                    </>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={3}>
            <FlowDiagram
              apiSchema={apiSchema}
              uiSchema={uiSchema}
              mapping={mapping}
              onMappingChange={handleMappingChange}
              onNodeClick={handleNodeClick}
            />
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={3} sx={{ marginTop: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="매핑 목록" />
              <Tab label="변환 함수" />
            </Tabs>
            <Box p={2}>
              {activeTab === 0 && (
                <MappingList
                  mapping={mapping}
                  transformFunctions={transformFunctions}
                  customFunctions={customFunctions}
                  onCustomFunctionChange={handleCustomFunctionChange}
                  apiSchema={apiSchema}
                  uiSchema={uiSchema}
                />
              )}
              {activeTab === 1 && (
                <FunctionViewer
                  uiField="최종 변환 함수"
                  function={finalConversionFunction}
                  onChange={() => {}} // 읽기 전용으로 설정
                  apiFields={Object.keys(apiSchema)}
                  apiSchema={apiSchema}
                  uiSchema={uiSchema}
                />
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3}>
            <PreviewData 
              previewData={previewData} 
              generatePreviewData={generatePreviewData}
              sampleApiData={sampleApiData}
            />
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert elevation={6} variant="filled" onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
}

export default App;