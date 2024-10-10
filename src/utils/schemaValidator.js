export const validateOutputSchema = (data, schema) => {
  const errors = [];

  Object.entries(schema).forEach(([key, expectedType]) => {
    if (!(key in data)) {
      errors.push(`Missing field: ${key}`);
    } else {
      const actualType = typeof data[key];
      if (actualType !== expectedType.toLowerCase()) {
        errors.push(`Type mismatch for ${key}: expected ${expectedType}, got ${actualType}`);
      }
    }
  });

  return errors;
};