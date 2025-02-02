import { createContext, ReactNode, useEffect, useState } from 'react'

import { storageAuthTokenSave } from '@storage/storageAuthToken'
import {
  storageUserGet,
  storageUserRemove,
  storageUserSave,
} from '@storage/storageUser'

import { api } from '@services/api'
import { UserDTO } from '@dtos/UserDTO'

export type AuthContextDataProps = {
  user: UserDTO
  singIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isLoadingUserStorageData: boolean
}

type AuthContextProviderProps = {
  children: ReactNode
}

export const AuthContext = createContext<AuthContextDataProps>(
  {} as AuthContextDataProps,
)

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<UserDTO>({} as UserDTO)
  const [isLoadingUserStorageData, setIsLoadingUserStorageData] = useState(true)

  async function storageUserAndToken(userData: UserDTO, token: string) {
    setIsLoadingUserStorageData(true)

    api.defaults.headers.common.Authorization = `Bearer ${token}`

    await storageUserSave(userData)
    await storageAuthTokenSave(token)
    setUser(userData)

    setIsLoadingUserStorageData(false)
  }

  async function singIn(email: string, password: string) {
    const { data } = await api.post('/sessions', { email, password })

    if (data.user && data.token) {
      storageUserAndToken(data.user, data.token)
    }
  }

  async function signOut() {
    setIsLoadingUserStorageData(true)

    setUser({} as UserDTO)
    await storageUserRemove()

    setIsLoadingUserStorageData(false)
  }

  async function loadUserData() {
    const userLogged = await storageUserGet()

    if (userLogged) {
      setUser(userLogged)
    }

    setIsLoadingUserStorageData(false)
  }

  useEffect(() => {
    loadUserData()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, singIn, signOut, isLoadingUserStorageData }}
    >
      {children}
    </AuthContext.Provider>
  )
}
