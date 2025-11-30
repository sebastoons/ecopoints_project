import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Barcode, CheckCircle, Package, Hash, XCircle } from 'lucide-react';
import Header from '../components/Header';

const AddCustomTask = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [code, setCode] = useState('');
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Referencia para limpiar el escáner al desmontar
  const scannerRef = useRef(null);

  // Simulación de base de datos de productos (Códigos reales de ejemplo)
  const productDB = {
    '7801610002446': { material: 'glass', name: 'Botella Coca-Cola Vidrio' },
    '7802800533560': { material: 'plastic', name: 'Botella Agua Mineral' },
    '7791234567890': { material: 'paper', name: 'Caja de Cereal' },
    '7804610080005': { material: 'metal', name: 'Lata de Bebida' }
  };

  useEffect(() => {
    if (showScanner) {
        // Configuración del escáner
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { 
                fps: 10, 
                qrbox: 250,
                formatsToSupport: [ 
                    Html5QrcodeSupportedFormats.EAN_13, 
                    Html5QrcodeSupportedFormats.EAN_8, 
                    Html5QrcodeSupportedFormats.UPC_A, 
                    Html5QrcodeSupportedFormats.QR_CODE 
                ]
            },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
    }

    // Limpieza al cerrar componente o escáner
    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(error => console.error("Error limpiando scanner", error));
            scannerRef.current = null;
        }
    };
  }, [showScanner]);

  const onScanSuccess = (decodedText) => {
    // Detener escaneo al encontrar código
    if(scannerRef.current) {
        scannerRef.current.clear();
        setShowScanner(false);
    }
    
    setCode(decodedText);
    
    // Buscar en nuestra "BD"
    if (productDB[decodedText]) {
        setMaterial(productDB[decodedText].material);
        alert(`¡Producto detectado! \n${productDB[decodedText].name}`);
    } else {
        alert(`Código ${decodedText} leído. No está en nuestra base de datos, por favor selecciona el material manualmente.`);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const onScanFailure = (error) => {
    // No hacer nada, es normal mientras busca
    // console.warn(error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!material) {
        alert("Por favor selecciona un tipo de material");
        return;
    }
    
    setLoading(true);
    const userEmail = localStorage.getItem('user');

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/custom-task/', {
        username: userEmail,
        code: code || 'MANUAL',
        material_type: material,
        quantity: quantity
      });

      if (res.data.success) {
        alert(res.data.message);
        navigate('/dashboard');
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Error al registrar la tarea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Escanear Reciclaje" />
      <div className="page-content">
        
        {/* ZONA DE ESCÁNER */}
        {!showScanner ? (
            <div 
                className="scanner-container" 
                onClick={() => setShowScanner(true)}
                style={{cursor: 'pointer', background: '#000', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}
            >
                <div style={{background: 'var(--primary)', padding: '15px', borderRadius: '50%', marginBottom: '10px', boxShadow: '0 0 20px rgba(30,168,128,0.6)'}}>
                    <Camera size={40} color="white" />
                </div>
                <span style={{color: 'white', fontWeight: '600'}}>Activar Cámara</span>
            </div>
        ) : (
            <div className="card" style={{padding: '10px', background: '#000'}}>
                <div id="reader" style={{width: '100%'}}></div>
                <button 
                    onClick={() => setShowScanner(false)} 
                    className="btn" 
                    style={{background: '#ef4444', color: 'white', marginTop: '10px'}}
                >
                    <XCircle size={18} style={{marginRight:'5px'}}/> Cancelar Escaneo
                </button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="card" style={{marginTop: '20px'}}>
            <h3 className="section-title" style={{fontSize: '1.1rem'}}>Detalles del Objeto</h3>

            {/* Código Detectado o Manual */}
            <div className="form-group">
                <label className="form-label">Código (Escaneado o Manual)</label>
                <div className="input-wrapper">
                    <Barcode className="input-icon" size={20} />
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej: 780123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                </div>
            </div>

            {/* Selector de Material */}
            <div className="form-group">
                <label className="form-label">Tipo de Material</label>
                <div className="input-wrapper">
                    <Package className="input-icon" size={20} />
                    <select 
                        className="form-input" // Reutilizamos clase form-input
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                    >
                        <option value="">Selecciona un material...</option>
                        <option value="plastic">Plástico (Botellas, Envases)</option>
                        <option value="glass">Vidrio</option>
                        <option value="paper">Papel / Cartón</option>
                        <option value="metal">Metal / Latas</option>
                    </select>
                </div>
            </div>

            {/* Cantidad */}
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

            {/* Resumen de Puntos Estimados */}
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