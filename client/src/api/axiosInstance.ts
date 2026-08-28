import axios from 'axios';

// withCredentials: true is REQUIRED for the httpOnly cookie auth flow
// we built on the backend — without it, the browser won't send the
// "token" cookie along with requests, and every protected route would
// 401 even for a logged-in user.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export default api;
