export default (err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: true, message: err.message || 'Server error' });
};
