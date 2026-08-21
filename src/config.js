// Configuración de conexión al backend (Apps Script).
// 🌟 PEGA TU URL REAL DE GOOGLE EN LA SIGUIENTE LÍNEA:
const URL_UNIFICADA = 'https://script.google.com/macros/s/AKfycbyvWlRM2EC50bEEqAZ-ONjQZn8BMdQwxPSk3Kgym9OHU-x_BRrbbdn-6vBqIBCYkOMZ/exec';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || URL_UNIFICADA;

// Apuntamos la variable de roles a la misma URL para que use el backend moderno
export const BACKEND_URL_ROLES = URL_UNIFICADA;

export const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'JorgeManuel22';

// Nombre de la clave en localStorage
export const STORAGE_KEY_USER = 'sheets-remote:user';
