import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/app/lib/horarios-auth';
import { procesarExcel, ExcelInvalidoError } from '@/app/lib/horarios-importador';
import { guardarHorarios } from '@/app/lib/horarios-storage';
import { horariosConfig } from '@/app/lib/horarios-config';

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const archivo = formData.get('archivo_excel') as File;
    if (!archivo) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 });

    const extension = archivo.name.split('.').pop()?.toLowerCase() || '';
    if (!horariosConfig.ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: 'Debe ser Excel' }, { status: 400 });
    }

    const buffer = await archivo.arrayBuffer();
    let resultado;
    
    try {
      resultado = procesarExcel(buffer, archivo.name);
    } catch (error: unknown) { // ✅ Cambiado de any a unknown
      if (error instanceof ExcelInvalidoError) return NextResponse.json({ error: error.message }, { status: 400 });
      throw error;
    }

    await guardarHorarios(resultado.horarios, archivo.name);
    return NextResponse.json({ success: true, message: 'Horarios actualizados' });
    
  } catch (error: unknown) { // ✅ Acá también es buena práctica poner unknown
    console.error(error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}