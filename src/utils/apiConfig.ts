export const API_URL = 'http://localhost:5000/api';
export let globalToken: string | null = null;
export const setGlobalToken = (token: string | null) => { globalToken = token; };
