import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/app/lib/horarios-auth';         // ✅
import { procesarExcel, ExcelInvalidoError } from '@/app/lib/horarios-importador';  // ✅
import { reemplazarHorarios } from '@/app/lib/horarios-storage';        // ✅
import { horariosConfig } from '@/app/lib/horarios-config';             // ✅
export async function POST(request: NextRequest) {
  // ✅ CORREGIDO: await
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: 'No autorizado. Iniciá sesión primero.' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const archivo = formData.get('archivo_excel') as File;
    
    if (!archivo) {
      return NextResponse.json(
        { error: 'No seleccionaste ningún archivo.' },
        { status: 400 }
      );
    }
    
    const extension = archivo.name.split('.').pop()?.toLowerCase() || '';
    if (!horariosConfig.ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: 'El archivo debe ser un Excel (.xlsx o .xls).' },
        { status: 400 }
      );
    }
    
    if (archivo.size > horariosConfig.MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 10 MB.' },
        { status: 400 }
      );
    }
    
    const buffer = await archivo.arrayBuffer();
    let resultado;
    
    try {
      resultado = procesarExcel(buffer, archivo.name);
    } catch (error) {
      if (error instanceof ExcelInvalidoError) {
        return NextResponse.json(
          { 
            error: error.message,
            carga: {
              nombreArchivo: archivo.name,
              filasImportadas: 0,
              exito: false,
              mensaje: error.message
            }
          },
          { status: 400 }
        );
      }
      throw error;
    }
    
    const data = await reemplazarHorarios(resultado.horarios, archivo.name);
    
    return NextResponse.json({
      success: true,
      message: `¡Horarios actualizados correctamente! Se importaron ${resultado.filasImportadas} filas.`,
      data,
      carga: {
        nombreArchivo: archivo.name,
        filasImportadas: resultado.filasImportadas,
        exito: true,
        mensaje: 'Importación exitosa'
      }
    });
    
  } catch (error) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { error: 'Error al procesar el archivo' },
      { status: 500 }
    );
  }
}