export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7007/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:7007';
export const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?img=1';
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const AUTH_TOKEN_NAME = 'userToken';