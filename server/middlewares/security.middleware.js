import csrf from 'csurf';

// Configure CSRF protection middleware
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  } 
});

// Middleware to attach CSRF token to response
const attachCsrfToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  // Add this to send token in response headers
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
  next();
};

export { csrfProtection, attachCsrfToken };