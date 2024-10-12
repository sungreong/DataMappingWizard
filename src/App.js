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
import ApiParamsEditor from './components/ApiParamsEditor';
import ApiTester from './components/ApiTester';
import { Box, Container, Grid, Paper, Typography, Snackbar, Button, Tabs, Tab, AppBar, Toolbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { validateOutputSchema } from './utils/schemaValidator';

const upstage_schema = {
  "api": "string",
  "model": "string",
  "content": {
    "text": "string",
    "html": "string",
    "markdown": "string"
  },
  "elements": [
    {
      "id": "number",
      "category": "string",
      "page": "number",
      "content": {
        "text": "string",
        "html": "string",
        "markdown": "string"
      },
      "coordinates": [
        {
          "x": "number",
          "y": "number"
        }
      ],
      "base64_encoding": "string"
    }
  ],
  "usage": {
    "pages": "number"
  }
}
const ui_schema = {
  "elements": [
    {
      "id": "string",
      "x": "float",
      "y": "float",
      "width": "float",
      "height": "float",
      "text": "string",
      "bbox": [
        {
          "x0": "float",
          "y0": "float",
          "x1": "float",
          "y1": "float"
        }
      ],
      "page": "integer"
    }
  ]
}


const test_schema = {
  "id": "string",
  "name": "string",
  "email": "string",
  "address": {
    "street": "string",
    "city": "string",
    "country": "string"
  }
}
const parser_schema = {
  "id": "string",
  "filename": "string",
  "num_pages": "number",
  "coordinate_system": "string",
  "table_parsing_kwargs": "object",
  "last_modified_date": "string",
  "last_accessed_date": "string",
  "creation_date": "string",
  "file_size": "number",
  "elements": [
    {
      "id": "string",
      "x": "number",
      "y": "number",
      "width": "number",
      "height": "number",
      "text": "string",
      "bbox": [
        {
          "x0": "number",
          "y0": "number",
          "x1": "number",
          "y1": "number"
        }
      ],
      "page": "number",
      "variant": [
        "string"
      ],
      "tokens": "number"
    }
  ]
}
const parser_data_params = {
  "file": {
    "type": "file",
    "description": "The file to be parsed."
  }
}
const parser_url = "http://localhost:8000/parse";
const default_schema = parser_schema;
const default_api_key = ""
const default_url = parser_url;
const default_data_params = parser_data_params;

const element_upstage_function = function transform(elements) {
  return elements.map(element => {
    // bbox 좌표 계산
    const bbox = element.coordinates;
    const x0 = bbox[0].x;
    const y0 = bbox[0].y;
    const x1 = bbox[2].x;
    const y1 = bbox[2].y;

    // width와 height 계산
    const width = x1 - x0;
    const height = y1 - y0;

    // 변환된 요소 반환
    return {
      id: String(element.id),  // 문자열로 변환 (숫자도 안전하게 변환)
      x: parseFloat(x0),
      y: parseFloat(y0),
      width: parseFloat(width),
      height: parseFloat(height),
      text: element.content.html || "",  // 텍스트가 없을 경우 빈 문자열
      bbox: [
        {
          x0: parseFloat(x0),
          y0: parseFloat(y0),
          x1: parseFloat(x1),
          y1: parseFloat(y1)
        }
      ],
      page: parseInt(element.page, 10)  // 10진수로 파싱
    };
  });
}

const element_parser_function = function transformElements(elements) {
  return elements.map(element => ({
    id: element.id,
    x: parseFloat(element.x),
    y: parseFloat(element.y),
    width: parseFloat(element.width),
    height: parseFloat(element.height),
    text: element.text,
    bbox: element.bbox.map(box => ({
      x0: parseFloat(box.x0),
      y0: parseFloat(box.y0),
      x1: parseFloat(box.x1),
      y1: parseFloat(box.y1)
    })),
    page: parseInt(element.page, 10)
  }));
}

const upstage_api_params_info = {
  "output_formats": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["text", "html", "markdown"]
    },
    "default": "html",
    "description": "Indicates in which format each layout element output is formatted."
  },
  "ocr": {
    "type": "string",
    "enum": ["auto", "force"],
    "default": "auto",
    "description": "Indicates whether to use OCR or not."
  },
  "coordinates": {
    "type": "boolean",
    "default": true,
    "description": "Indicates whether to return coordinates of bounding boxes of each layout element."
  },
  "model": {
    "type": "string",
    "default": "",
    "description": "Indicates which model is used for inference. The API uses the latest version of model unless user specify certain model version."
  },
  "base64_encoding": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["table", "image", "text", "title", "list"]
    },
    "default": [],
    "description": "Indicates which layout category should be provided as base64 encoded string."
  }
}
// let ui_schema = {
//   "id": "string",
//   "name": "string",
//   "email": "string",
//   "address" : {
//     "street": "string",
//     "city": "string",
//     "country": "string"
//   }
// }
function App() {

  const [apiSchema, setApiSchema] = useState(default_schema);
  const [uiSchema, setUiSchema] = useState(ui_schema);
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

  const [apiParams, setApiParams] = useState({
    url: default_url,
    api_key: default_api_key,
    data: default_data_params,
  });

  const [apiTestResult, setApiTestResult] = useState(null);

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
      
      // 함수 이름에서 띄어쓰기 제거 및 camelCase 변환
      const sanitizedUiField = uiField.replace(/\s+(.)/g, (match, group1) => group1.toUpperCase());
      
      if (currentCustomFunctions[uiField]) {
        // 사용자 정의 함수가 있는 경우
        const funcBody = currentCustomFunctions[uiField]
          .replace(/^function\s+\w+\s*\([^)]*\)\s*{/, '')
          .replace(/}$/, '')
          .trim();
        transformFunctions[sanitizedUiField] = `function(${apiFields.join(', ')}) { ${funcBody} }`;
      } else if (apiFields.length === 1) {
        // 단일 필드 매핑
        transformFunctions[sanitizedUiField] = `function(${apiFields[0]}) { return ${apiFields[0]}; }`;
      } else if (apiFields.length > 1) {
        // 다중 필드 매핑 (기본 함수 사용)
        transformFunctions[sanitizedUiField] = `function(${apiFields.join(', ')}) { return ${apiFields[0]}; }`;
      }

      acc += `${functionComment}\n  ${sanitizedUiField}: transformFunctions.${sanitizedUiField}(${apiFields.map(f => `data.${f}`).join(', ')}),\n\n`;
      return acc;
    }, '');

    // 마지막 쉼표 제거 및 빈 객체 처리
    const trimmedFunctionBody = functionBody.trim().replace(/,\s*$/, '') || '  // No mappings defined';

    const transformFunctionsString = Object.entries(transformFunctions)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join(',\n');

    return `const transformFunctions = {
${transformFunctionsString}
};

function convertData(data) {
  return {
${trimmedFunctionBody}
  };
}`.trim(); // 전체 문자열의 앞뒤 공백 제거
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

  const handleApiParamsChange = (newParams) => {
    setApiParams(newParams);
    setSnackbar({ open: true, message: 'API 파라미터가 업데이트되었습니다.', severity: 'info' });
  };

  // const handleApiTest = async (testData) => {
  //   try {
  //     const response = await fetch(apiParams.url, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         ...(apiParams.api_key && { 'Authorization': `Bearer ${apiParams.api_key}` }),
  //       },
  //       body: JSON.stringify(testData),
  //     });
  //     const result = await response.json();
  //     setApiTestResult(result);
  //   } catch (error) {
  //     setApiTestResult({ error: error.message });
  //   }
  // };

  useEffect(() => {
    const newFunction = generateFinalConversionFunction();
    setFinalConversionFunction(newFunction);
  }, [mapping, customFunctions]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            API 데이터 매핑 도구
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto">
                <Tab label="API 응답 스키마" />
                <Tab label="UI 요구사항" />
                <Tab label="API 설정" />
                <Tab label="API 테스트" />
                <Tab label="샘플 데이터" />
              </Tabs>
              <Box sx={{ mt: 2 }}>
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
                          sx={{ mt: 2 }}
                        >
                          스키마 편집
                        </Button>
                      </>
                    )}
                  </>
                )}
                {activeTab === 1 && (
                  <SchemaViewer title="UI 요구사항" schema={uiSchema} />
                )}
                {activeTab === 2 && (
                  <ApiParamsEditor
                    apiParams={apiParams}
                    onApiParamsChange={handleApiParamsChange}
                  />
                )}
                {activeTab === 3 && (
                  <ApiTester
                    apiParams={apiParams}
                  />
                )}
                {activeTab === 4 && (
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
                          sx={{ mt: 2 }}
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
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>데이터 매핑 다이어그램</Typography>
              <FlowDiagram
                apiSchema={apiSchema}
                uiSchema={uiSchema}
                mapping={mapping}
                onMappingChange={handleMappingChange}
                onNodeClick={handleNodeClick}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>매핑 목록</Typography>
              <MappingList
                mapping={mapping}
                transformFunctions={transformFunctions}
                customFunctions={customFunctions}
                onCustomFunctionChange={handleCustomFunctionChange}
                apiSchema={apiSchema}
                uiSchema={uiSchema}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>변환 함수</Typography>
              <FunctionViewer
                uiField="최종 변환 함수"
                function={finalConversionFunction}
                onChange={() => {}}
                apiFields={Object.keys(apiSchema)}
                apiSchema={apiSchema}
                uiSchema={uiSchema}
              />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <PreviewData 
                previewData={previewData} 
                generatePreviewData={generatePreviewData}
                sampleApiData={sampleApiData}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert elevation={6} variant="filled" onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}

export default App;