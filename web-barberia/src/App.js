import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDrArjAqFvm6-Vznu-_nCS6YRtBCIirGFM",
  authDomain: "gestion-barber-pelu.firebaseapp.com",
  projectId: "gestion-barber-pelu",
  storageBucket: "gestion-barber-pelu.firebasestorage.app",
  messagingSenderId: "238101772726",
  appId: "1:238101772726:web:75e68b0bac289e48eca917"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [turnosRegistrados, setTurnosRegistrados] = useState([]);
  const [productos, setProductos] = useState([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [nuevoProdNombre, setNuevoProdNombre] = useState('');
  const [nuevoProdCantidad, setNuevoProdCantidad] = useState('');
  const [nuevoProdCategoria, setNuevoProdCategoria] = useState('Insumos');

  const servicios = [
    { id: 'c1', nombre: 'Corte Clásico Urbano', precio: '$1.500' },
    { id: 'c2', nombre: 'Corte + Perfilado de Barba', precio: '$2.200' },
    { id: 'c3', nombre: 'Diseño de Cejas / Líneas', precio: '$1.000' }
  ];

  const barberos = ['Franco', 'Mateo', 'Lucas'];
  const horarios = ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'];

  // Escucha cambios de la base de datos en tiempo real
  useEffect(() => {
    const unsubscribeTurnos = onSnapshot(collection(db, 'turnos'), (snapshot) => {
      const listaTurnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTurnosRegistrados(listaTurnos.sort((a, b) => b.timestamp - a.timestamp));
    });

    const unsubscribeStock = onSnapshot(collection(db, 'productos'), (snapshot) => {
      const listaProd = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(listaProd);
    });

    return () => {
      unsubscribeTurnos();
      unsubscribeStock();
    };
  }, []);

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  const cambiarMes = (direccion) => {
    const nuevoMes = new Date(currentDate.setMonth(currentDate.getMonth() + direccion));
    setCurrentDate(new Date(nuevoMes));
  };

  const generarDiasCalendario = () => {
    const año = currentDate.getFullYear();
    const mes = currentDate.getMonth();
    const primerDiaIndex = new Date(año, mes, 1).getDay();
    const totalDias = new Date(año, mes + 1, 0).getDate();
    const dias = [];

    for (let i = 0; i < (primerDiaIndex === 0 ? 6 : primerDiaIndex - 1); i++) {
      dias.push(<div key={`empty-${i}`} style={styles.calendarDayEmpty}></div>);
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      const fechaDia = new Date(año, mes, dia);
      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      const esPasado = fechaDia < hoy;

      const esSeleccionado = selectedDate && 
        selectedDate.getDate() === dia && 
        selectedDate.getMonth() === mes && 
        selectedDate.getFullYear() === año;

      dias.push(
        <button
          key={`dia-${dia}`}
          disabled={esPasado}
          type="button"
          onClick={() => setSelectedDate(new Date(año, mes, dia))}
          style={{
            ...styles.calendarDay,
            ...(esPasado ? styles.calendarDayDisabled : {}),
            ...(esSeleccionado ? styles.calendarDaySelected : {})
          }}
        >
          {dia}
        </button>
      );
    }
    return dias;
  };

  // Guarda un nuevo turno en Firestore
  const handleReservar = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedService || !selectedBarber || !selectedTime || !clientName) return;

    try {
      await addDoc(collection(db, 'turnos'), {
        cliente: clientName,
        servicio: selectedService,
        barbero: selectedBarber,
        fecha: selectedDate.toLocaleDateString('es-AR'),
        hora: selectedTime,
        estado: 'Pendiente',
        timestamp: Date.now()
      });

      setSuccessMessage(true);
      setClientName('');
      setSelectedService('');
      setSelectedBarber('');
      setSelectedTime('');
      setSelectedDate(null);
      setTimeout(() => setSuccessMessage(false), 4000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '12345') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Credenciales incorrectas.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setIsAdminMode(false);
  };

  // Actualiza el estado de un turno (Atendido/Anulado)
  const cambiarEstadoTurno = async (id, nuevoEstado) => {
    try {
      const turnoRef = doc(db, 'turnos', id);
      await updateDoc(turnoRef, { estado: nuevoEstado });
    } catch (error) {
      console.error(error);
    }
  };

  // Suma o resta unidades del stock
  const ajustarStock = async (id, cantidadCambio, cantidadActual) => {
    try {
      const prodRef = doc(db, 'productos', id);
      const nuevaCant = cantidadActual + cantidadCambio;
      await updateDoc(prodRef, { cantidad: nuevaCant < 0 ? 0 : nuevaCant });
    } catch (error) {
      console.error(error);
    }
  };

  // Agrega un producto nuevo al inventario
  const handleAgregarProducto = async (e) => {
    e.preventDefault();
    if (!nuevoProdNombre || !nuevoProdCantidad) return;

    try {
      await addDoc(collection(db, 'productos'), {
        nombre: nuevoProdNombre,
        cantidad: parseInt(nuevoProdCantidad, 10),
        categoria: nuevoProdCategoria
      });
      setNuevoProdNombre('');
      setNuevoProdCantidad('');
    } catch (error) {
      console.error(error);
    }
  };

  const gananciasTotales = turnosRegistrados.filter(t => t.estado === 'Atendido').length * 1500;
  const productosBajoStock = productos.filter(p => p.cantidad < 5).length;

  return (
    <div style={styles.appWrapper}>
      <nav style={styles.navbar}>
        <div style={styles.logoContainer}>
          <span style={styles.logoIcon}>💈</span>
          <h1 style={styles.logoText}>ROSARIO STYLES</h1>
        </div>
        <div>
          {!isAdminMode ? (
            <button onClick={() => setIsAdminMode(true)} style={styles.btnNavGear} title="Acceso Dueño">
              ⚙️
            </button>
          ) : (
            <button onClick={handleLogout} style={styles.btnNav}>Volver a Turnos</button>
          )}
        </div>
      </nav>

      {/* SECCIÓN CLIENTE */}
      {!isAdminMode && (
        <div style={styles.mainContent}>
          <div style={styles.heroSection}>
            <span style={{fontSize: '50px'}}>💈🕺</span>
            <h2 style={styles.heroTitle}>¡Reserva tu Turno al Instante!</h2>
            <p style={styles.heroSubtitle}>Elegí el mejor servicio y lucí un estilo impecable.</p>
          </div>

          <div style={styles.bookingContainer}>
            <form onSubmit={handleReservar} style={styles.formContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Tu Nombre Completo</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} style={styles.input} required />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>1. Selecciona el Servicio</label>
                <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} style={styles.select} required>
                  <option value="">-- Elige un servicio --</option>
                  {servicios.map(s => <option key={s.id} value={s.nombre}>{s.nombre} ({s.precio})</option>)}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>2. Elige tu Barbero</label>
                <select value={selectedBarber} onChange={(e) => setSelectedBarber(e.target.value)} style={styles.select} required>
                  <option value="">-- Elige un profesional --</option>
                  {barberos.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>3. Selecciona la Fecha</label>
                <div style={styles.calendarContainer}>
                  <div style={styles.calendarHeader}>
                    <button type="button" onClick={() => cambiarMes(-1)} style={styles.calendarNavBtn}>◀</button>
                    <span style={styles.calendarMonthName}>{meses[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                    <button type="button" onClick={() => cambiarMes(1)} style={styles.calendarNavBtn}>▶</button>
                  </div>
                  <div style={styles.calendarWeekDays}>
                    <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
                  </div>
                  <div style={styles.calendarGrid}>
                    {generarDiasCalendario()}
                  </div>
                </div>
                {selectedDate && <p style={styles.selectedDateText}>Fecha elegida: 📅 {selectedDate.toLocaleDateString('es-AR')}</p>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>4. Selecciona el Horario</label>
                <div style={styles.hoursGrid}>
                  {horarios.map(h => (
                    <button type="button" key={h} onClick={() => setSelectedTime(h)} style={{...styles.hourBtn, ...(selectedTime === h ? styles.hourBtnSelected : {})}}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" style={styles.btnSubmit}>Confirmar Cita 🚀</button>

              {successMessage && <div style={styles.successBadge}>¡Turno Registrado con Éxito! 🎉</div>}
            </form>
          </div>
        </div>
      )}

      {/* SECCIÓN LOGIN */}
      {isAdminMode && !isLoggedIn && (
        <div style={styles.loginWrapper}>
          <div style={styles.loginCard}>
            <h2 style={styles.loginTitle}>Panel Privado Dueño</h2>
            <form onSubmit={handleLogin} style={styles.formLogin}>
              <input type="text" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} style={styles.input} required />
              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
              {loginError && <p style={styles.errorText}>{loginError}</p>}
              <button type="submit" style={styles.btnSubmit}>Ingresar</button>
            </form>
          </div>
        </div>
      )}

      {/* PANEL CONTROL DUEÑO */}
      {isAdminMode && isLoggedIn && (
        <div style={styles.adminMainContent}>
          <div style={styles.adminHeaderRow}>
            <h2>Panel General de Control (Dueño)</h2>
            <button onClick={handleLogout} style={styles.btnLogout}>Cerrar Sesión</button>
          </div>

          <div style={styles.kpiRow}>
            <div style={styles.kpiCard}>
              <p style={styles.kpiTitle}>Caja Estimada (Atendidos)</p>
              <p style={styles.kpiValue}>${gananciasTotales.toLocaleString('es-AR')}</p>
            </div>
            <div style={styles.kpiCard}>
              <p style={styles.kpiTitle}>Turnos Agendados</p>
              <p style={styles.kpiValue}>{turnosRegistrados.length}</p>
            </div>
            <div style={{...styles.kpiCard, borderLeftColor: productosBajoStock > 0 ? '#ff6b6b' : '#64ffda'}}>
              <p style={styles.kpiTitle}>Productos con Poco Stock</p>
              <p style={{...styles.kpiValue, color: productosBajoStock > 0 ? '#ff6b6b' : '#fff'}}>{productosBajoStock}</p>
            </div>
          </div>

          <h3 style={styles.sectionTitle}>📅 Agenda y Control de Turnos</h3>
          <div style={{...styles.tableResponsiveContainer, marginBottom: '40px'}}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Servicio</th>
                  <th style={styles.th}>Barbero</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {turnosRegistrados.map((turno) => (
                  <tr key={turno.id} style={styles.tr}>
                    <td style={styles.td}>{turno.fecha}</td>
                    <td style={{...styles.td, color: '#00f0ff', fontWeight: 'bold'}}>{turno.hora}</td>
                    <td style={styles.td}>{turno.cliente}</td>
                    <td style={styles.td}>{turno.servicio}</td>
                    <td style={styles.td}>💈 {turno.barbero}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: turno.estado === 'Atendido' ? '#1b4332' : turno.estado === 'Anulado' ? '#4c1d1d' : '#003366',
                        color: turno.estado === 'Atendido' ? '#b7e4c7' : turno.estado === 'Anulado' ? '#f8d7da' : '#cbdffa'
                      }}>
                        {turno.estado}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {turno.estado === 'Pendiente' ? (
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button onClick={() => cambiarEstadoTurno(turno.id, 'Atendido')} style={styles.btnActionCheck}>✓ Cobrar</button>
                          <button onClick={() => cambiarEstadoTurno(turno.id, 'Anulado')} style={styles.btnActionCancel}>✕ Anular</button>
                        </div>
                      ) : <span style={{color: '#888'}}>Completado</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={styles.sectionTitle}>📦 Gestión de Stock e Insumos</h3>
          <div style={styles.stockLayoutContainer}>
            <div style={{...styles.tableResponsiveContainer, flex: '2 1 600px'}}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Categoría</th>
                    <th style={styles.th}>Cantidad</th>
                    <th style={styles.th}>Estado Alerta</th>
                    <th style={styles.th}>Modificar</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod) => (
                    <tr key={prod.id} style={styles.tr}>
                      <td style={{...styles.td, fontWeight: '500'}}>{prod.nombre}</td>
                      <td style={styles.td}><span style={styles.categoryTag}>{prod.categoria}</span></td>
                      <td style={{...styles.td, fontSize: '16px', fontWeight: 'bold', color: prod.cantidad < 5 ? '#ff6b6b' : '#fff'}}>{prod.cantidad} u.</td>
                      <td style={styles.td}>
                        {prod.cantidad < 5 ? (
                          <span style={styles.alertCritical}>⚠️ ¡Reponer!</span>
                        ) : (
                          <span style={styles.alertOk}>✅ Suficiente</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{display: 'flex', gap: '5px'}}>
                          <button onClick={() => ajustarStock(prod.id, 1, prod.cantidad)} style={styles.btnStockPlus}>+</button>
                          <button onClick={() => ajustarStock(prod.id, -1, prod.cantidad)} style={styles.btnStockMinus}>-</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.addProductCard}>
              <h4 style={{margin: '0 0 15px 0', color: '#00f0ff'}}>+ Cargar Producto Nuevo</h4>
              <form onSubmit={handleAgregarProducto} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <input type="text" placeholder="Nombre de Producto" value={nuevoProdNombre} onChange={(e) => setNuevoProdNombre(e.target.value)} style={styles.inputAdmin} required />
                <input type="number" placeholder="Stock Inicial" value={nuevoProdCantidad} onChange={(e) => setNuevoProdCantidad(e.target.value)} style={styles.inputAdmin} required />
                <select value={nuevoProdCategoria} onChange={(e) => setNuevoProdCategoria(e.target.value)} style={styles.selectAdmin}>
                  <option value="Insumos">Insumos de Barbería</option>
                  <option value="Peinado">Productos de Peinado</option>
                  <option value="Barba">Cuidado de Barba</option>
                  <option value="Lavado">Lavado y Cosmética</option>
                </select>
                <button type="submit" style={styles.btnSubmitAdmin}>Registrar Insumo 💾</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', backgroundColor: '#0a192f', color: '#f4f6f9', fontFamily: '"Segoe UI", sans-serif' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f2647', padding: '15px 5%', borderBottom: '3px solid #1e467a' },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { fontSize: '26px' },
  logoText: { color: '#00f0ff', fontSize: '22px', margin: 0, fontWeight: 'bold', letterSpacing: '1px' },
  btnNav: { backgroundColor: 'transparent', color: '#00f0ff', border: '1px solid #00f0ff', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' },
  btnNavGear: { backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', outline: 'none' },
  mainContent: { padding: '20px 5%', maxWidth: '1200px', margin: '0 auto' },
  heroSection: { textAlign: 'center', margin: '30px 0' },
  heroTitle: { fontSize: '34px', color: '#fff', marginBottom: '10px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' },
  heroSubtitle: { color: '#8892b0', fontSize: '16px' },
  bookingContainer: { backgroundColor: '#112240', padding: '30px', borderRadius: '12px', border: '1px solid #1e3a63' },
  formContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#00f0ff', fontSize: '15px', fontWeight: '600' },
  input: { backgroundColor: '#1e3a63', color: '#fff', border: '1px solid #2e5b94', padding: '12px', borderRadius: '6px', outline: 'none' },
  select: { backgroundColor: '#1e3a63', color: '#fff', border: '1px solid #2e5b94', padding: '12px', borderRadius: '6px', cursor: 'pointer' },
  calendarContainer: { backgroundColor: '#0f2647', border: '1px solid #2e5b94', borderRadius: '8px', padding: '15px', maxWidth: '400px' },
  calendarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  calendarNavBtn: { backgroundColor: 'transparent', color: '#00f0ff', border: 'none', fontSize: '16px', cursor: 'pointer' },
  calendarMonthName: { fontWeight: 'bold', color: '#fff' },
  calendarWeekDays: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', color: '#8892b0', fontSize: '12px', marginBottom: '10px' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' },
  calendarDay: { backgroundColor: '#112240', color: '#fff', border: '1px solid #2e5b94', padding: '10px 0', borderRadius: '4px', cursor: 'pointer', textAlign: 'center' },
  calendarDayEmpty: { backgroundColor: 'transparent' },
  calendarDayDisabled: { backgroundColor: '#0a192f', color: '#445069', cursor: 'not-allowed', borderColor: 'transparent' },
  calendarDaySelected: { backgroundColor: '#00f0ff', color: '#0a192f', borderColor: '#00f0ff' },
  selectedDateText: { margin: '8px 0 0 0', color: '#64ffda', fontSize: '14px', fontWeight: '600' },
  hoursGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' },
  hourBtn: { backgroundColor: '#1e3a63', color: '#fff', border: '1px solid #2e5b94', padding: '10px', borderRadius: '6px', cursor: 'pointer' },
  hourBtnSelected: { backgroundColor: '#00f0ff', color: '#0a192f', borderColor: '#00f0ff' },
  btnSubmit: { backgroundColor: '#00f0ff', color: '#0a192f', border: 'none', padding: '15px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  successBadge: { backgroundColor: '#1b4332', color: '#b7e4c7', padding: '15px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold' },
  loginWrapper: { height: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  loginCard: { backgroundColor: '#112240', padding: '40px', borderRadius: '12px', border: '1px solid #1e3a63', width: '100%', maxWidth: '400px', textAlign: 'center' },
  loginTitle: { color: '#00f0ff', fontSize: '24px', marginBottom: '25px' },
  formLogin: { display: 'flex', flexDirection: 'column', gap: '15px' },
  errorText: { color: '#ff6b6b', fontWeight: 'bold', fontSize: '14px' },
  adminMainContent: { padding: '30px 5%', maxWidth: '1400px', margin: '0 auto' },
  adminHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  btnLogout: { backgroundColor: '#4c1d1d', color: '#f8d7da', border: '1px solid #721c24', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  kpiRow: { display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' },
  kpiCard: { backgroundColor: '#112240', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #00f0ff', flex: '1 1 200px' },
  kpiTitle: { color: '#8892b0', fontSize: '14px', margin: '0 0 5px 0' },
  kpiValue: { fontSize: '26px', fontWeight: 'bold', margin: 0 },
  sectionTitle: { color: '#fff', borderBottom: '1px solid #1e467a', paddingBottom: '10px', marginBottom: '20px' },
  tableResponsiveContainer: { backgroundColor: '#112240', padding: '20px', borderRadius: '12px', border: '1px solid #1e3a63', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' },
  thRow: { borderBottom: '2px solid #2e5b94' },
  th: { padding: '12px', color: '#8892b0', fontSize: '14px' },
  tr: { borderBottom: '1px solid #1e3a63' },
  td: { padding: '14px 12px', fontSize: '14px' },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  btnActionCheck: { backgroundColor: '#1b4332', color: '#b7e4c7', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  btnActionCancel: { backgroundColor: '#4c1d1d', color: '#f8d7da', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  stockLayoutContainer: { display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' },
  categoryTag: { backgroundColor: '#1e3a63', color: '#00f0ff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' },
  alertCritical: { color: '#ff6b6b', backgroundColor: '#3a1c1c', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' },
  alertOk: { color: '#64ffda', backgroundColor: '#13332b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' },
  btnStockPlus: { backgroundColor: '#1b4332', color: '#64ffda', border: '1px solid #2d6a4f', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer' },
  btnStockMinus: { backgroundColor: '#4c1d1d', color: '#ff6b6b', border: '1px solid #802020', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer' },
  addProductCard: { backgroundColor: '#112240', padding: '25px', borderRadius: '12px', border: '1px solid #1e3a63', flex: '1 1 300px' },
  inputAdmin: { backgroundColor: '#0f2647', color: '#fff', border: '1px solid #2e5b94', padding: '10px', borderRadius: '6px', fontSize: '14px', outline: 'none', marginBottom: '10px' },
  selectAdmin: { backgroundColor: '#0f2647', color: '#fff', border: '1px solid #2e5b94', padding: '10px', borderRadius: '6px', fontSize: '14px', outline: 'none', cursor: 'pointer' },
  btnSubmitAdmin: { backgroundColor: '#00f0ff', color: '#0a192f', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};