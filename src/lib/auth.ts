import { redirect } from 'next/navigation'
import { backendFetch } from '@/lib/backend'

export type CurrentUser = {
  id: string
  loginId: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  active: boolean
  mustChangePw: boolean
  student?: { id: string; studentCode: string; fullName: string; classId: string }
  teacher?: { id: string; fullName: string }
  admin?: { id: string; fullName: string }
}

export async function currentUser(): Promise<CurrentUser | null> {
  try {
    const response = await backendFetch('/api/v1/auth/me')
    if (!response.ok) return null
    return await response.json() as CurrentUser
  } catch {
    return null
  }
}

export async function guard(...roles: CurrentUser['role'][]) {
  const user = await currentUser()
  if (!user || !roles.includes(user.role)) redirect('/login')
  return user
}
