const express = require('express');
const { requireNoteAuth } = require('../notes/access');
const { positiveId, text, NoteError } = require('../notes/validation');

function createLabelsRouter() {
  const router = express.Router();
  router.use(requireNoteAuth);
  router.get('/', async (req, res) => {
    const [items] = await req.app.locals.notesPool.execute('SELECT id, name FROM labels WHERE user_id = ? ORDER BY name, id', [req.noteUserId]);
    res.json({ data: { items } });
  });
  router.post('/', async (req, res) => {
    const name = text(req.body.name, 'Tên nhãn', 50).trim();
    const [result] = await req.app.locals.notesPool.execute('INSERT INTO labels (user_id, name) VALUES (?, ?)', [req.noteUserId, name]);
    res.status(201).json({ data: { label: { id: result.insertId, name } } });
  });
  router.patch('/:id', async (req, res) => {
    const id = positiveId(req.params.id);
    const name = text(req.body.name, 'Tên nhãn', 50).trim();
    const [result] = await req.app.locals.notesPool.execute('UPDATE labels SET name = ? WHERE id = ? AND user_id = ?', [name, id, req.noteUserId]);
    if (!result.affectedRows) throw new NoteError(404, 'NOT_FOUND', 'Không tìm thấy nhãn.');
    res.json({ data: { label: { id, name } } });
  });
  router.delete('/:id', async (req, res) => {
    const [result] = await req.app.locals.notesPool.execute('DELETE FROM labels WHERE id = ? AND user_id = ?', [positiveId(req.params.id), req.noteUserId]);
    if (!result.affectedRows) throw new NoteError(404, 'NOT_FOUND', 'Không tìm thấy nhãn.');
    res.status(204).end();
  });
  return router;
}

module.exports = { createLabelsRouter };
