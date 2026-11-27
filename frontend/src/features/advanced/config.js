// Route of Member 2's note editor (the SAME screen is used to add and to edit notes).
// Change this single line if the route is different.
export const NOTE_EDIT_ROUTE = (id) => `/notes/${id}`;

// Screen used by people a note was shared with (this module provides it).
export const SHARED_NOTE_ROUTE = (id) => `/shared/${id}`;

// Notes created while offline have temporary ids like "local-ab12"; only numeric ids exist on the server.
export const isServerId = (id) => /^\d+$/.test(String(id ?? ''));
