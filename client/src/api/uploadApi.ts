import api from './axiosInstance';

export const uploadApi = {
  uploadImage: async (file: File): Promise<{ url: string; publicId?: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
