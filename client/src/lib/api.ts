import axios from 'axios';
import { useAuthStore } from './store';
const api = axios.create({
    baseURL : import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    headers : {
        'Content-Type' : 'application/json'
    },
    withCredentials : true
})
//interceptor
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})
api.interceptors.response.use((response) => response,
    async (error) => {
        const original = error.config
        if(error.response?.status === 401 && !original._retry){
            const hadToken = !!useAuthStore.getState().accessToken
            original._retry = true;
            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
                const { data } = await axios.post(
                    `${baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                )
                useAuthStore.getState().setAccessToken(data.accessToken)
                if (data.user) useAuthStore.getState().setUser(data.user)
                original.headers.Authorization = `Bearer ${data.accessToken}`
                return api(original)
            } catch {
                if (hadToken) useAuthStore.getState().logout()
            }
                
        }
        return Promise.reject(error)
    })






export default api;