import React, { useState, useEffect, useRef } from 'react';
import api from '../api'; 
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Barcode, CheckCircle, Package, Hash, XCircle, ScanLine, Leaf } from 'lucide-react';
import Header from '../components/Header';
import { useToast } from '../context/ToastContext'; 

const AddCustomTask = () => {
  const navigate = useNavigate();
  const { showToast } = useToast(); 
  const [isScanning, setIsScanning] = useState(false);
  const [code, setCode] = useState('');
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Estados para cálculos en tiempo real
  const [estimatedPoints, setEstimatedPoints] = useState(0);
  const [estimatedCo2, setEstimatedCo2] = useState(0);

  const scannerRef = useRef(null);

  const productDB = {
    '7801610002446': { material: 'glass', name: 'Botella Vidrio' },
    '7802800533560': { material: 'plastic', name: 'Botella Plástico' },
  };

  // --- CÁLCULO DINÁMICO ---
  useEffect(() => {
      if (!material || quantity < 1) {
          setEstimatedPoints(0);
          setEstimatedCo2(0);
          return;
      }
      const pointsMap = {'plastic': 10, 'glass': 15, 'paper': 5, 'metal': 20};
      const points = (pointsMap[material] || 0) * quantity;
      const co2 = (quantity * 0.15).toFixed(2); // Ejemplo 0.15kg por unidad
      
      setEstimatedPoints(points);
      setEstimatedCo2(co2);
  }, [material, quantity]);

  const startCamera = async () => {
    setIsScanning(true);
    try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => { handleScanSuccess(decodedText); },
            () => {} 
        );
    } catch (err) {
        console.error(err);
        setIsScanning(false);
        showToast("Error al iniciar cámara", "error");
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
        try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            setIsScanning(false);
        } catch (err) { console.error(err); }
    }
  };

  const handleScanSuccess = (decodedText) => {
    stopCamera();
    setCode(decodedText);
    if (productDB[decodedText]) {
        setMaterial(productDB[decodedText].material);
        showToast(`Producto: ${productDB[decodedText].name}`, "success");
    } else {
        showToast("Código leído. Selecciona material.", "info");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || !material) {
        showToast("Faltan datos para reciclar", "error");
        return;
    }
    
    setLoading(true);
    const userEmail = sessionStorage.getItem('user');

    try {
      const res = await api.post('/api/custom-task/', {
        username: userEmail, code, material_type: material, quantity
      });
      if (res.data.success) {
        showToast(res.data.message, "success"); 
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      showToast("Error al registrar", "error");
    } finally {
      setLoading(false);
    }
  };

  // Corrección línea 110: Uso de 'e' en el catch
  useEffect(() => {
      return () => { 
          if(scannerRef.current) {
              try { 
                  scannerRef.current.stop(); 
              } catch(e) {
                  console.error(e); // <--- Variable 'e' usada aquí
              }
          }
      }
  }, []);

  return (
    <>
      <Header title="Reciclar" />
      <div className="page-content">
        
        {/* CÁMARA */}
        <div className={`scanner-container ${isScanning ? 'scanner-active' : ''}`}>
            <div id="reader" style={{width: '100%', height: '100%'}}></div>
            {!isScanning ? (
                <div className="scan-btn-overlay" onClick={startCamera} style={{cursor: 'pointer'}}>
                    <div style={{background: 'var(--primary)', padding: '20px', borderRadius: '50%', marginBottom: '15px', boxShadow: '0 0 20px rgba(30,168,128,0.6)'}}>
                        <ScanLine size={48} color="white" />
                    </div>
                    <span style={{fontWeight: '700', fontSize: '1.1rem'}}>Escanear Código</span>
                </div>
            ) : (
                <button onClick={stopCamera} className="btn" style={{position: 'absolute', bottom: '20px', background: 'rgba(0,0,0,0.6)', color: 'white', width: 'auto', zIndex:10}}>
                    <XCircle size={20}/> Cancelar
                </button>
            )}
        </div>

        <form onSubmit={handleSubmit} className="card">
            <h3 className="section-title" style={{fontSize: '1.1rem'}}>Detalles del Objeto</h3>

            <div className="form-group">
                <label className="form-label">Código</label>
                <div className="input-wrapper">
                    <Barcode className="input-icon" size={20} />
                    <input type="text" className="form-input" placeholder="---" value={code} onChange={(e) => setCode(e.target.value)} />
                    {code && <CheckCircle size={18} className="input-icon" style={{left: 'auto', right: '16px', color: 'var(--primary)'}} />}
                </div>
            </div>

            {/* SELECT MEJORADO: Combina clases form-input y select-input */}
            <div className="form-group">
                <label className="form-label">Material</label>
                <div className="input-wrapper">
                    <Package className="input-icon" size={20} />
                    <select 
                        className="form-input select-input" 
                        value={material} 
                        onChange={(e) => setMaterial(e.target.value)}
                    >
                        <option value="">Seleccionar...</option>
                        <option value="plastic">Plástico</option>
                        <option value="glass">Vidrio</option>
                        <option value="paper">Papel/Cartón</option>
                        <option value="metal">Metal/Lata</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Cantidad</label>
                <div className="input-wrapper">
                    <Hash className="input-icon" size={20} />
                    <input type="number" min="1" className="form-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
            </div>

            {/* PREVISUALIZACIÓN DE PUNTOS */}
            {estimatedPoints > 0 && (
                <div style={{background: 'var(--primary-light)', padding: '12px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--primary)'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
                        <span style={{color: 'var(--primary-dark)', fontWeight: '600'}}>Ganancia Estimada:</span>
                        <span style={{color: 'var(--primary)', fontWeight: '800', fontSize:'1.1rem'}}>+{estimatedPoints} pts</span>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'0.85rem', color:'#666'}}>
                        <Leaf size={14} color="var(--accent)"/> <span>Evitarás {estimatedCo2}kg de CO2</span>
                    </div>
                </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading || !code || !material} style={{opacity: (!code || !material) ? 0.6 : 1}}>
                {loading ? 'Registrando...' : 'Confirmar Reciclaje'}
            </button>
        </form>
      </div>
    </>
  );
};

export default AddCustomTask;