const { createNotesRouter, notesErrorHandler } = require('./routes');
const { createLabelsRouter } = require('../labels/routes');

function installNotes(app, pool) {
  app.locals.notesPool = pool;
  app.use(['/api/notes', '/api/labels'], (req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    next();
  });
  app.use('/api/notes', createNotesRouter());
  app.use('/api/labels', createLabelsRouter());
  app.use(notesErrorHandler);
}

module.exports = { installNotes };
