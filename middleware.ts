import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 🔥 Configuración de usuario y contraseña
// Podés cambiarlos o usar variables de entorno
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

export function middleware(request: NextRequest) {
  // 1️⃣ SOLO proteger la ruta /admin
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next(); // ← Dejar pasar todo lo que no sea /admin
  }

  // 2️⃣ Obtener el header de autenticación
  const authHeader = request.headers.get('authorization');
  
  // 3️⃣ Si no hay header, pedir login
  if (!authHeader) {
    return new NextResponse('🔒 Acceso restringido', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Panel de Administración"',
      },
    });
  }

  // 4️⃣ Decodificar las credenciales
  const base64 = authHeader.split(' ')[1];
  const decoded = Buffer.from(base64, 'base64').toString();
  const [user, pass] = decoded.split(':');

  // 5️⃣ Verificar usuario y contraseña
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return NextResponse.next(); // ✅ Permiso concedido
  }

  // 6️⃣ Credenciales incorrectas
  return new NextResponse('🔒 Usuario o contraseña incorrectos', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Panel de Administración"',
    },
  });
}

// 🔥 Configuración: se ejecuta en TODAS las rutas que empiecen con /admin
export const config = {
  matcher: '/admin/:path*',
};