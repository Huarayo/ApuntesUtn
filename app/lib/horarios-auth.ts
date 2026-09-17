import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';


export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('is_admin_horarios')?.value === 'true';
}

export function iniciarSesionAdmin(response: NextResponse) {
  response.cookies.set('is_admin_horarios', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  });
  return response;
}