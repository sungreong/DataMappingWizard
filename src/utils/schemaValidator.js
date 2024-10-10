export const validateOutputSchema = (data, schema) => {
  const errors = [];

  const validateValue = (value, expectedType, path) => {
    if (Array.isArray(expectedType)) {
      if (!Array.isArray(value)) {
        errors.push(`${path}의 타입 불일치: 배열 예상, ${typeof value} 받음`);
      } else if (expectedType.length > 0) {
        value.forEach((item, index) => {
          validateValue(item, expectedType[0], `${path}[${index}]`);
        });
      }
    } else if (typeof expectedType === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push(`${path}의 타입 불일치: 객체 예상, ${typeof value} 받음`);
      } else {
        validateObject(value, expectedType, path);
      }
    } else {
      const actualType = typeof value;
      const expectedTypeStr = expectedType.toLowerCase();
      if (actualType !== 'number' && actualType !== expectedTypeStr) {
        if (expectedTypeStr === 'number' || expectedTypeStr === 'float' || expectedTypeStr === 'integer') {
          if (isNaN(parseFloat(value))) {
            errors.push(`${path}의 타입 불일치: ${expectedType} 예상, ${actualType} 받음`);
          }
        } else {
          errors.push(`${path}의 타입 불일치: ${expectedType} 예상, ${actualType} 받음`);
        }
      } else if (expectedTypeStr === 'integer' && !Number.isInteger(value)) {
        errors.push(`${path}의 타입 불일치: 정수 예상, 소수 받음`);
      }
    }
  };

  const validateObject = (obj, schemaObj, path = '') => {
    if (path === 'elements') {
      if (!Array.isArray(obj)) {
        errors.push(`${path}의 타입 불일치: 배열 예상, ${typeof obj} 받음`);
        return;
      }
      obj.forEach((item, index) => {
        validateObject(item, schemaObj[0], `${path}[${index}]`);
      });
      return;
    }

    Object.entries(schemaObj).forEach(([key, expectedType]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj)) {
        errors.push(`누락된 필드: ${currentPath}`);
      } else {
        const value = obj[key];
        validateValue(value, expectedType, currentPath);
      }
    });
  };

  validateObject(data, schema);
  return errors;
};