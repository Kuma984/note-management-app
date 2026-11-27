export function validDraft(draft) {
  return Boolean(draft.title.trim() && draft.content.trim() && [...draft.title].length <= 200 && [...draft.content].length <= 20000);
}

export class AutosaveSession {
  constructor({ note, api, onChange, onSaved, onAccessLost, delay = 700 }) {
    Object.assign(this, { api, onChange, onSaved, onAccessLost, delay });
    this.note = note || null;
    this.draft = { title: note?.title || '', content: note?.content || '' };
    this.generation = 0;
    this.savedGeneration = 0;
    this.status = note ? 'saved' : 'empty';
    this.message = '';
    this.createId = crypto.randomUUID();
    this.disposed = false;
  }

  snapshot() {
    return { ...this.draft, note: this.note, dirty: this.generation !== this.savedGeneration,
      status: this.status, message: this.message, remote: this.remote || null };
  }

  emit() { if (!this.disposed) this.onChange?.(this.snapshot()); }

  change(field, value) {
    if (this.disposed || this.draft[field] === value) return;
    this.draft = { ...this.draft, [field]: value };
    this.generation += 1;
    if (!this.remote) this.status = validDraft(this.draft) ? 'dirty' : 'invalid';
    this.message = '';
    clearTimeout(this.timer);
    if (validDraft(this.draft) && !this.remote && this.status !== 'error') this.schedule();
    this.emit();
  }

  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.save(); }, this.delay);
  }

  async save() {
    clearTimeout(this.timer);
    if (this.disposed || this.remote || !validDraft(this.draft) || this.generation === this.savedGeneration) return false;
    if (this.inFlight) return this.inFlight;
    // A retry keeps exactly the same operation ID AND body until it is acknowledged.
    const operation = this.pending || {
      id: this.note?.id,
      generation: this.generation,
      body: { ...this.draft, operation_id: this.note ? crypto.randomUUID() : this.createId,
        ...(this.note ? { base_version: this.note.version } : {}) },
    };
    this.pending = operation;
    this.status = 'saving';
    this.message = '';
    this.emit();
    this.inFlight = (async () => {
      try {
        const result = operation.id ? await this.api.update(operation.id, operation.body) : await this.api.create(operation.body);
        if (this.disposed) return false;
        const current = result.note;
        this.note = current;
        this.savedGeneration = operation.generation;
        this.pending = null;
        // A replay can acknowledge an old save while returning a newer server version.
        if (result.mutation?.replayed && current.version > result.mutation.applied_version) {
          this.remote = current;
          this.status = 'conflict';
        } else if (!this.remote) {
          this.status = this.generation === this.savedGeneration ? 'saved' : validDraft(this.draft) ? 'dirty' : 'invalid';
        }
        this.onSaved?.(current);
        return current;
      } catch (error) {
        if (this.disposed) return false;
        this.message = error.message;
        if (error.code === 'VERSION_CONFLICT' && operation.id) {
          try { this.remote = await this.api.get(operation.id); this.status = 'conflict'; }
          catch (fetchError) {
            this.status = 'error'; this.message = fetchError.message;
            if ([401, 403, 404, 423].includes(fetchError.status)) this.onAccessLost?.(fetchError);
          }
        } else {
          this.status = 'error';
        }
        if ([400, 422].includes(error.status)) this.pending = null;
        if ([401, 403, 404, 423].includes(error.status)) this.onAccessLost?.(error);
        return false;
      } finally {
        this.inFlight = null;
        if (!this.disposed) {
          this.emit();
          if (!this.remote && this.status === 'dirty') this.schedule();
        }
      }
    })();
    return this.inFlight;
  }

  async flush() {
    clearTimeout(this.timer);
    while (!this.disposed && this.generation !== this.savedGeneration) {
      if (!validDraft(this.draft) || this.remote) return false;
      const result = await this.save();
      if (!result || this.status === 'conflict') return false;
    }
    return this.note || (!this.draft.title && !this.draft.content);
  }

  accept(note) {
    this.note = note;
    this.draft = { title: note.title, content: note.content };
    this.savedGeneration = this.generation;
    this.pending = null;
    this.remote = null;
    this.status = 'saved';
    this.message = '';
    this.emit();
  }

  receiveRemote(note, operationId) {
    if (operationId && operationId === this.pending?.body.operation_id) return;
    if (!this.note || note.version <= this.note.version) return;
    if (this.generation !== this.savedGeneration || this.inFlight) {
      clearTimeout(this.timer);
      this.remote = note;
      this.status = 'conflict';
      this.emit();
    } else this.accept(note);
  }

  resolve(choice) {
    if (!this.remote || this.inFlight) return;
    if (choice === 'server') return this.accept(this.remote);
    this.note = this.remote;
    this.remote = null;
    this.pending = null;
    this.generation += 1;
    this.status = 'dirty';
    this.emit();
    this.schedule();
  }

  dispose() { this.disposed = true; clearTimeout(this.timer); }
}
