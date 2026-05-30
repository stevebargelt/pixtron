import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export interface AuthenticatedUser {
  id: string
  email?: string
  role?: string
}

export interface AuthResult {
  authenticated: boolean
  user?: AuthenticatedUser
  error?: string
}

export async function verifyAuth(req: NextApiRequest): Promise<AuthResult> {
  if (!supabaseUrl || !serviceKey) {
    return {
      authenticated: false,
      error: 'Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY',
    }
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Missing or invalid Authorization header',
    }
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return {
      authenticated: false,
      error: 'Missing Authorization token',
    }
  }

  try {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const {
      data: { user },
      error: userErr,
    } = await admin.auth.getUser(token)

    if (userErr || !user) {
      return {
        authenticated: false,
        error: 'Invalid auth token',
      }
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return {
      authenticated: false,
      error: 'Authentication verification failed',
    }
  }
}

export function withAuth(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    user: AuthenticatedUser
  ) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authResult = await verifyAuth(req)

    if (!authResult.authenticated) {
      return res.status(401).json({ error: authResult.error })
    }

    return handler(req, res, authResult.user!)
  }
}

export function getAdminClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Server misconfigured: missing Supabase credentials')
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
