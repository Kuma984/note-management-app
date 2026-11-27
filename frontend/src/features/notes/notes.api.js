import api from '../../services/api';

export function makeNotesApi(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  async function call(method, url, data, config = {}) {
    try {
      const response = await api.request({ method, url, data, ...config, headers: { ...headers, ...config.headers } });
      return response.data?.data;
    } catch (original) {
      const error = new Error(original.response?.data?.error?.message || (original.code === 'ERR_CANCELED' ? 'Đã hủy yêu cầu.' : 'Không thể kết nối máy chủ. Bản đang nhập vẫn được giữ trên màn hình.'));
      error.status = original.response?.status;
      error.code = original.response?.data?.error?.code || original.code;
      error.details = original.response?.data?.error?.details;
      throw error;
    }
  }
  return {
    list: (params, signal) => call('get', '/notes', undefined, { params, signal }),
    get: id => call('get', `/notes/${id}`).then(data => data.note),
    create: body => call('post', '/notes', body),
    update: (id, body) => call('patch', `/notes/${id}`, body),
    remove: (id, body) => call('delete', `/notes/${id}`, body),
    pin: (id, body) => call('put', `/notes/${id}/pin`, body),
    setLabels: (id, body) => call('put', `/notes/${id}/labels`, body),
    labels: () => call('get', '/labels').then(data => data.items),
    addLabel: name => call('post', '/labels', { name }),
    renameLabel: (id, name) => call('patch', `/labels/${id}`, { name }),
    deleteLabel: id => call('delete', `/labels/${id}`),
    upload: (id, body) => call('post', `/notes/${id}/attachments`, body),
    removeFile: (noteId, fileId, body) => call('delete', `/notes/${noteId}/attachments/${fileId}`, body),
    async file(noteId, fileId, signal) {
      try {
        const response = await api.get(`/notes/${noteId}/attachments/${fileId}/content`, { headers, responseType: 'blob', signal });
        return response.data;
      } catch (error) {
        const failure = new Error('Không thể tải tệp. Quyền truy cập hoặc trạng thái khóa có thể đã thay đổi.');
        failure.status = error.response?.status;
        throw failure;
      }
    },
  };
}

export const notesApi = makeNotesApi();
