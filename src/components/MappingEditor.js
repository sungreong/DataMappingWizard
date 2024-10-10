import React from 'react';

const MappingEditor = ({ apiSchema, uiSchema, mapping, setMapping }) => {
  const handleMapping = (uiField, apiField) => {
    setMapping(prevMapping => ({
      ...prevMapping,
      [uiField]: apiField
    }));
  };

  const renderApiOptions = (obj, prefix = '') => {
    return Object.entries(obj).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object') {
        return renderApiOptions(value, fullKey);
      }
      return <option key={fullKey} value={fullKey}>{fullKey}</option>;
    });
  };

  return (
    <div className="mapping-editor">
      <h2>필드 매핑</h2>
      {Object.entries(uiSchema).map(([uiField, uiType]) => (
        <div key={uiField} className="mapping-row">
          <span>{uiField} ({uiType}): </span>
          <select
            value={mapping[uiField] || ''}
            onChange={(e) => handleMapping(uiField, e.target.value)}
          >
            <option value="">선택하세요</option>
            {renderApiOptions(apiSchema)}
          </select>
        </div>
      ))}
    </div>
  );
};

export default MappingEditor;