import React from 'react';
import { Box, Typography } from '@mui/material';
import MonacoEditor from '@monaco-editor/react';

const FinalConversionViewer = ({ function: conversionFunction }) => {
  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>최종 변환 함수</Typography>
      <MonacoEditor
        height="200px"
        language="javascript"
        theme="vs-dark"
        value={conversionFunction}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
    </Box>
  );
};

export default FinalConversionViewer;