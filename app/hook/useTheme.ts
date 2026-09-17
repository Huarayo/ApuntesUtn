"use client";
import { useState, useEffect } from "react";

export function useTheme() {
  // 1. Calculamos el tema inicial al declarar el estado
  const [theme, setTheme] = useState(() => {
    // Si estamos en el servidor (Next.js SSR), devolvemos 'light' por defecto
    if (typeof window === "undefined") return "light";
    
    // Si estamos en el cliente, leemos localStorage o el sistema
    return localStorage.getItem("theme") || 
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  // 2. El useEffect ahora solo sincroniza el DOM cuando 'theme' cambia
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme };
}