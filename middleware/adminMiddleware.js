const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  res.status(403);
  return next(new Error('Not authorized as an admin'));
};

module.exports = { admin };
