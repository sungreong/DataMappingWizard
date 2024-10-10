import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemText, Collapse, Button, Box } from '@mui/material';
import FunctionViewer from './FunctionViewer';

const MappingList = ({ mapping, customFunctions, onCustomFunctionChange, apiSchema, uiSchema }) => {
  const [openItem, setOpenItem] = useState(null);
  const [tempFunctions, setTempFunctions] = useState({});

  useEffect(() => {
    setTempFunctions(customFunctions);
  }, [customFunctions]);

  const handleToggle = (uiField) => {
    setOpenItem(openItem === uiField ? null : uiField);
  };

  const handleFunctionChange = (uiField, newFunction) => {
    setTempFunctions(prev => ({
      ...prev,
      [uiField]: newFunction
    }));
  };

  const handleSave = (uiField) => {
    onCustomFunctionChange(uiField, tempFunctions[uiField]);
  };

  const getBackgroundColor = (uiField) => {
    if (mapping[uiField] && mapping[uiField].length > 0) {
      return '#e8f5e9'; // 연한 초록색 (매핑됨)
    }
    return '#ffcdd2'; // 연한 빨간색 (매핑되지 않음)
  };

  return (
    <List>
      {Object.entries(uiSchema).map(([uiField, uiType]) => (
        <React.Fragment key={uiField}>
          <ListItem 
            button 
            onClick={() => handleToggle(uiField)}
            style={{ backgroundColor: getBackgroundColor(uiField) }}
          >
            <ListItemText 
              primary={`${uiField} (${uiType})`} 
              secondary={mapping[uiField] && mapping[uiField].length > 0 ? `Mapped to: ${mapping[uiField].join(', ')}` : 'Not mapped'}
            />
          </ListItem>
          <Collapse in={openItem === uiField} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <FunctionViewer
                uiField={uiField}
                function={tempFunctions[uiField] || ''}
                onChange={(newFunction) => handleFunctionChange(uiField, newFunction)}
                apiFields={mapping[uiField] || []}
                apiSchema={apiSchema}
                uiSchema={uiSchema}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleSave(uiField)}
                sx={{ marginTop: 2 }}
              >
                저장
              </Button>
            </Box>
          </Collapse>
        </React.Fragment>
      ))}
    </List>
  );
};

export default MappingList;