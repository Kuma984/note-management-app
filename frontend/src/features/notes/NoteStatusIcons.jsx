export default function NoteStatusIcons({ note }) {
  const icons = [
    [note.is_pinned, 'bi-pin-angle-fill', 'Đã ghim'],
    [note.is_locked, 'bi-lock-fill', 'Đã khóa'],
    [note.is_shared, 'bi-people-fill', 'Đã chia sẻ'],
  ];
  return <span className="d-inline-flex gap-2 note-status-icons">
    {icons.filter(([visible]) => visible).map(([, icon, label]) =>
      <span key={label} role="img" aria-label={label} title={label}><i className={`bi ${icon}`} aria-hidden="true" /></span>)}
  </span>;
}
