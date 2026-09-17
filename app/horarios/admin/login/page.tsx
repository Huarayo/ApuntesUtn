"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginAdmin() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/horarios/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    
    if (res.ok) router.push("/horarios/admin");
    else alert("Contraseña incorrecta");
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Panel de administración</h1>
        <p className="sub">Ingresá la contraseña para actualizar los horarios.</p>
        
        <form onSubmit={handleLogin}>
          <label className="field-label" htmlFor="password">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            autoFocus 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn-primary">Ingresar</button>
        </form>
        
        <Link href="/horarios" className="back-link">&larr; Volver al tablero de horarios</Link>
      </div>
    </div>
  );
}