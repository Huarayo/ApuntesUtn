import { NextResponse } from 'next/server';
import { obtenerHorarios } from '@/app/lib/horarios-storage';

export async function GET() {
  const data = await obtenerHorarios();
  return NextResponse.json(data || { horarios: [] });
}