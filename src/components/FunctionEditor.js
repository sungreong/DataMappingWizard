import React from 'react';
import MonacoEditor from '@monaco-editor/react';

const FunctionEditor = ({ value, onChange, apiFields, uiField, apiSchema, uiSchema }) => {
  const generateDefaultFunction = () => {
    const apiFieldsWithTypes = apiFields.map(field => `${field}: ${apiSchema[field]}`).join(', ');
    const uiFieldType = uiSchema[uiField];
    return `// 이 함수를 편집하여 복잡한 매핑을 처리하세요
// 입력: ${apiFieldsWithTypes}
// 출력: ${uiField}: ${uiFieldType}
function transform(${apiFields.join(', ')}) {
  // ${uiField}에 대한 변환 로직을 작성하세요
  return ${apiFields[0]}; // 기본값으로 첫 번째 필드를 반환
}`;
  };

  return (
    <div className="function-editor">
      <h2>변환 함수 편집기 - {uiField}</h2>
      <MonacoEditor
        height="300px"
        language="javascript"
        theme="vs-dark"
        value={value || generateDefaultFunction()}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};

export default FunctionEditor;