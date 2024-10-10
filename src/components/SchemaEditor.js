import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import MonacoEditor from '@monaco-editor/react';

const SchemaEditor = ({ schema, onSchemaChange }) => {
  const [editorContent, setEditorContent] = useState(JSON.stringify(schema, null, 2));

  const handleEditorChange = (value) => {
    setEditorContent(value);
  };

  const handleSave = () => {
    try {
      const newSchema = JSON.parse(editorContent);
      onSchemaChange(newSchema);
    } catch (error) {
      alert('Invalid JSON format. Please check your input.');
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>API 응답 스키마 편집</Typography>
      <MonacoEditor
        height="300px"
        language="json"
        theme="vs-dark"
        value={editorContent}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSave}
        sx={{ marginTop: 2 }}
      >
        저장
      </Button>
    </Box>
  );
};

export default SchemaEditor;