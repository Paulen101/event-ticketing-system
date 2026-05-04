const notFound = (req, res, next) => {
  res.status(404);

  if (req.accepts('html')) {
    return res.send('<h1>404 Not Found</h1>');
  }

  if (req.accepts('json')) {
    return res.json({ error: '404 Not Found' });
  }

  return res.type('txt').send('404 Not Found');
};

module.exports = { notFound };
