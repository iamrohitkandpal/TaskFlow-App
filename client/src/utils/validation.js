/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates that a password meets minimum requirements
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validates login credentials
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - Email
 * @param {string} credentials.password - Password
 * @returns {Object} - Validation result
 */
export const validateLoginCredentials = (credentials) => {
  const errors = {};
  
  if (!credentials.email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(credentials.email)) {
    errors.email = "Invalid email format";
  }
  
  if (!credentials.password) {
    errors.password = "Password is required";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
