import { createContext, ReactNode, useEffect, useState } from 'react'

import {
  storageAuthTokenSave,
  storageAuthTokenGet,
  storageAuthTokenRemove,
} from '@storage/storageAuthToken'
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
  updateUserProfile: (userUpdated: UserDTO) => Promise<void>
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

  async function userAndTokenUpdate(userData: UserDTO, token: string) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`

    setUser(userData)
  }

  async function storageUserAndTokenSave(
    userData: UserDTO,
    token: string,
    refresh_token: string,
  ) {
    setIsLoadingUserStorageData(true)

    await storageUserSave(userData)
    await storageAuthTokenSave({ token, refresh_token })

    setIsLoadingUserStorageData(false)
  }

  async function singIn(email: string, password: string) {
    const { data } = await api.post('/sessions', { email, password })

    if (data.user && data.token && data.refresh_token) {
      await storageUserAndTokenSave(data.user, data.token, data.refresh_token)
      userAndTokenUpdate(data.user, data.token)
    }
  }

  async function signOut() {
    setIsLoadingUserStorageData(true)

    setUser({} as UserDTO)
    await storageUserRemove()
    await storageAuthTokenRemove()

    setIsLoadingUserStorageData(false)
  }

  async function updateUserProfile(userUpdated: UserDTO) {
    setUser(userUpdated)
    await storageUserSave(userUpdated)
  }

  async function loadUserData() {
    setIsLoadingUserStorageData(true)

    const userLogged = await storageUserGet()
    const { token } = await storageAuthTokenGet()

    if (token && userLogged) {
      userAndTokenUpdate(userLogged, token)
    }

    setIsLoadingUserStorageData(false)
  }

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    const subscribe = api.registerInterceptTokenManager(signOut)

    return () => {
      subscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        singIn,
        signOut,
        updateUserProfile,
        isLoadingUserStorageData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
