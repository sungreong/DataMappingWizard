import React from 'react';

const SchemaViewer = ({ title, schema }) => {
  const renderSchema = (obj, indent = 0) => {
    return Object.entries(obj).map(([key, value]) => (
      <div key={key} style={{ marginLeft: `${indent * 20}px` }}>
        {typeof value === 'object' ? (
          <>
            <span>{key}: {'{'}</span>
            {renderSchema(value, indent + 1)}
            <span>{'}'}</span>
          </>
        ) : (
          <span>{key}: {value}</span>
        )}
      </div>
    ));
  };

  return (
    <div className="schema-viewer">
      <h2>{title}</h2>
      <div className="schema-content">
        {renderSchema(schema)}
      </div>
    </div>
  );
};

export default SchemaViewer;