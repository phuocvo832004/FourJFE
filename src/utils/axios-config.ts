import axios from 'axios';

// Cấu hình global cho axios để hỗ trợ yêu cầu CSRF
axios.defaults.withCredentials = true;

// Thêm hỗ trợ để tự động gửi XSRF-TOKEN trong header nếu có
axios.interceptors.request.use(
  config => {
    // Lấy XSRF-TOKEN từ cookie nếu có
    let xsrfToken = null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'XSRF-TOKEN') {
        xsrfToken = value;
        break;
      }
    }

    // Nếu có token và không phải là GET request, thêm vào header
    if (xsrfToken && config.method !== 'get') {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
    }
    
    return config;
  },
  error => Promise.reject(error)
);

export default axios; 