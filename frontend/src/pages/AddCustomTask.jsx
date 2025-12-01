import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Barcode, CheckCircle, Package, Hash, XCircle } from 'lucide-react';
import Header from '../components/Header';
import api from '../api';

// Movemos la DB fuera del componente para que sea constante y no cause re-renders
const productDB = {
    '7801610002446': { material: 'glass', name: 'Botella Coca-Cola Vidrio' },
    '7802800533560': { material: 'plastic', name: 'Botella Agua Mineral' },
    '7791234567890': { material: 'paper', name: 'Caja de Cereal' },
    '7804610080005': { material: 'metal', name: 'Lata de Bebida' }
};

const AddCustomTask = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [code, setCode] = useState('');
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const scannerRef = useRef(null);

  // Usamos useCallback para que la función sea estable y no se recree en cada render
  const onScanSuccess = useCallback((decodedText) => {
    if(scannerRef.current) {
        scannerRef.current.clear();
        setShowScanner(false);
    }
    
    setCode(decodedText);
    
    if (productDB[decodedText]) {
        setMaterial(productDB[decodedText].material);
        alert(`¡Producto detectado! \n${productDB[decodedText].name}`);
    } else {
        alert(`Código ${decodedText} leído. No está en nuestra base de datos, selecciona el material.`);
    }
  }, []); // Sin dependencias porque setCode y setShowScanner son estables

  useEffect(() => {
    if (showScanner) {
        const config = {
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            formatsToSupport: [ 
                Html5QrcodeSupportedFormats.EAN_13, 
                Html5QrcodeSupportedFormats.QR_CODE 
            ],
            videoConstraints: {
                facingMode: { exact: "environment" } // Intentar forzar cámara trasera
            }
        };

        const fallbackConfig = { ...config, videoConstraints: { facingMode: "environment" } };

        try {
            const scanner = new Html5QrcodeScanner("reader", config, false);
            scanner.render(onScanSuccess, (err) => console.log(err));
            scannerRef.current = scanner;
        } catch (e) {
            // AQUÍ ESTABA EL ERROR: Ahora usamos 'e' para loguearlo y evitar el error de linter
            console.error("Error al iniciar cámara principal, intentando fallback:", e);
            
            try {
                const scanner = new Html5QrcodeScanner("reader", fallbackConfig, false);
                scanner.render(onScanSuccess, (err) => console.log(err));
                scannerRef.current = scanner;
            } catch (e2) {
                console.error("Error fatal al iniciar scanner:", e2);
                alert("No se pudo iniciar la cámara.");
                setShowScanner(false);
            }
        }
    }

    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(error => console.error("Error limpiando scanner", error));
            scannerRef.current = null;
        }
    };
  }, [showScanner, onScanSuccess]); // Dependencias corregidas

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!material) {
        alert("Por favor selecciona un tipo de material");
        return;
    }
    
    setLoading(true);
    const userEmail = localStorage.getItem('user');

    try {
      const res = await api.post('/api/custom-task/', {
        username: userEmail,
        code: code || 'MANUAL',
        material_type: material,
        quantity: quantity
      });

      if (res.data.success) {
        alert(res.data.message);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      alert("Error al registrar la tarea: " + (err.response?.data?.error || "Error de conexión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Escanear Reciclaje" />
      <div className="page-content">
        
        {!showScanner ? (
            <div 
                className="scanner-container" 
                onClick={() => setShowScanner(true)}
                style={{cursor: 'pointer', background: '#1f2937', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}
            >
                <div style={{background: 'var(--primary)', padding: '15px', borderRadius: '50%', marginBottom: '10px', boxShadow: '0 0 20px rgba(30,168,128,0.6)'}}>
                    <Camera size={40} color="white" />
                </div>
                <span style={{color: 'white', fontWeight: '600'}}>Tocar para Escanear</span>
            </div>
        ) : (
            <div className="card" style={{padding: '0', background: '#000', overflow:'hidden'}}>
                <div id="reader" style={{width: '100%'}}></div>
                <button 
                    onClick={() => setShowScanner(false)} 
                    className="btn btn-danger" 
                    style={{borderRadius: '0', marginTop:'0'}}
                >
                    <XCircle size={18} style={{marginRight:'5px'}}/> Cancelar
                </button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="card" style={{marginTop: '20px'}}>
            <h3 className="section-title" style={{fontSize: '1.1rem'}}>Detalles del Objeto</h3>

            <div className="form-group">
                <label className="form-label">Código</label>
                <div className="input-wrapper">
                    <Barcode className="input-icon" size={20} />
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Escaneado o Manual"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Tipo de Material</label>
                <div className="input-wrapper">
                    <Package className="input-icon" size={20} />
                    <select 
                        className="form-input select-input" 
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                    >
                        <option value="">Selecciona...</option>
                        <option value="plastic">Plástico</option>
                        <option value="glass">Vidrio</option>
                        <option value="paper">Papel / Cartón</option>
                        <option value="metal">Metal / Latas</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Cantidad</label>
                <div className="input-wrapper">
                    <Hash className="input-icon" size={20} />
                    <input 
                        type="number" 
                        min="1"
                        className="form-input" 
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                </div>
            </div>

            {material && (
                <div style={{background: 'var(--primary-light)', padding: '10px', borderRadius: '8px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <CheckCircle size={20} color="var(--primary)"/>
                    <span style={{color: 'var(--primary-dark)', fontWeight: '600', fontSize: '0.9rem'}}>
                        +{quantity * (material === 'glass' ? 15 : material === 'metal' ? 20 : 10)} Puntos Estimados
                    </span>
                </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Confirmar Reciclaje'}
            </button>
        </form>
      </div>
    </>
  );
};

export default AddCustomTask;