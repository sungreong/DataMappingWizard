import React from 'react';
import { Box, Typography } from '@mui/material';
import MonacoEditor from '@monaco-editor/react';

const FunctionViewer = ({ uiField, function: transformFunction, onChange, apiFields, apiSchema, uiSchema }) => {
  const generateDefaultFunction = () => {
    const apiFieldsWithTypes = apiFields.map(field => `${field}: ${apiSchema[field]}`).join(', ');
    const uiFieldType = uiSchema[uiField];
    return `function transform(${apiFields.join(', ')}) {
  /* Input: ${apiFieldsWithTypes}
     Output: ${uiField}: ${uiFieldType} */
  return ${apiFields[0]}; // 기본값으로 첫 번째 필드를 반환
}`;
  };

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>{uiField}</Typography>
      <MonacoEditor
        height="600px"
        language="javascript"
        theme="vs-dark"
        value={transformFunction || generateDefaultFunction()}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
    </Box>
  );
};

export default FunctionViewer;