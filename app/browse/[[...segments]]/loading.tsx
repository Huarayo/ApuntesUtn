// app/browse/[[...]]/loading.tsx
export default function Loading() {
  return (
    <div className="mini" style={{ padding: '24px' }}>
      {/* Imitamos el botón de volver y las migas de pan */}
      <div className="skeleton-box" style={{ width: '80px', height: '20px', marginBottom: '20px' }}></div>
      
      <div style={{ marginBottom: '30px' }}>
        <div className="skeleton-box" style={{ width: '40%', height: '35px' }}></div>
      </div>
      <div className="miniList">
        {/* Generamos 8 filas de carga para rellenar la pantalla */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-box skeleton-icon"></div>
            <div className="skeleton-box skeleton-text"></div>
          </div>
        ))}
      </div>
    </div>
  );
}