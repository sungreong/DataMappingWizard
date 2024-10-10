import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

function SampleDataEditor({ sampleData, onSampleDataChange }) {
  const [editedData, setEditedData] = useState(JSON.stringify(sampleData, null, 2));

  const handleSave = () => {
    try {
      const parsedData = JSON.parse(editedData);
      onSampleDataChange(parsedData);
    } catch (error) {
      alert('잘못된 JSON 형식입니다. 다시 확인해주세요.');
    }
  };

  return (
    <Box>
      <TextField
        multiline
        fullWidth
        rows={10}
        value={editedData}
        onChange={(e) => setEditedData(e.target.value)}
        variant="outlined"
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
}

export default SampleDataEditor;