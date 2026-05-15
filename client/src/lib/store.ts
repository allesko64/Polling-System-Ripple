import {create} from "zustand"

interface AuthState{
    accessToken : string | null,
    user : {id : string , name: string , email : string} | null,
    authHydrated : boolean,
    setAccessToken : (token : string) => void,
    setUser : (user : AuthState['user']) => void,
    setAuthHydrated : (hydrated : boolean) => void,
    logout : () => void
}



export const useAuthStore = create<AuthState>((set)=> ({
    accessToken : null,
    user : null,
    authHydrated : false,
    setAccessToken : (token) => set({accessToken : token}),
    setUser : (user) => set({user}),
    setAuthHydrated : (authHydrated) => set({authHydrated}),
    logout : () => set({accessToken : null , user : null})

}))