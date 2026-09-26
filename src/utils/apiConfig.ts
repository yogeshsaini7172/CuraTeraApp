export const API_URL = 'http://10.120.224.102:5000/api';
export let globalToken: string | null = null;
export const setGlobalToken = (token: string | null) => { globalToken = token; };
