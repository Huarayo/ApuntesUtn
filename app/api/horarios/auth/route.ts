import { NextRequest, NextResponse } from 'next/server';
import { iniciarSesionAdmin } from '@/app/lib/horarios-auth';
import { horariosConfig } from '@/app/lib/horarios-config';

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (body.password === horariosConfig.ADMIN_PASSWORD) {
    return iniciarSesionAdmin(NextResponse.json({ success: true }));
  }
  return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
}