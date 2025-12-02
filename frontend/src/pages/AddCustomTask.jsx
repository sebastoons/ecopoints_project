import React, { useState, useEffect, useRef } from 'react';
import api from '../api'; 
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Barcode, CheckCircle, Package, Hash, XCircle, ScanLine } from 'lucide-react';
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
  
  const scannerRef = useRef(null);

  const productDB = {
    '7801610002446': { material: 'glass', name: 'Botella Vidrio' },
    '7802800533560': { material: 'plastic', name: 'Botella Plástico' },
  };

  const startCamera = async () => {
    setIsScanning(true);
    try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        
        await html5QrCode.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                handleScanSuccess(decodedText);
            },
            () => {} 
        );
    } catch (err) {
        console.error(err); // VARIABLE USADA AQUÍ PARA EVITAR ERROR
        setIsScanning(false);
        showToast("No se pudo acceder a la cámara", "error");
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
        try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            setIsScanning(false);
        } catch (err) { 
            console.error(err); // VARIABLE USADA AQUÍ
        }
    }
  };

  const handleScanSuccess = (decodedText) => {
    stopCamera();
    setCode(decodedText);
    
    if (productDB[decodedText]) {
        setMaterial(productDB[decodedText].material);
        showToast(`Producto: ${productDB[decodedText].name}`, "success");
    } else {
        showToast("Código leído. Selecciona el material.", "info");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code || code.trim() === '') {
        showToast("Debes escanear o ingresar un código", "error");
        return;
    }
    if (!material) {
        showToast("Selecciona el tipo de material", "error");
        return;
    }
    
    setLoading(true);
    const userEmail = localStorage.getItem('user');

    try {
      const res = await api.post('/api/custom-task/', {
        username: userEmail,
        code: code,
        material_type: material,
        quantity: quantity
      });

      if (res.data.success) {
        showToast(res.data.message, "success"); 
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err); // VARIABLE USADA AQUÍ
      showToast("Error al registrar. Intenta nuevamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      return () => {
          if(scannerRef.current) {
             try { 
                 scannerRef.current.stop(); 
             } catch(e) {
                 console.error(e); // VARIABLE USADA AQUÍ
             }
          }
      }
  }, []);

  return (
    <>
      <Header title="Reciclar" />
      <div className="page-content">
        
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
                <button 
                    onClick={stopCamera}
                    style={{
                        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '10px 20px',
                        borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10
                    }}
                >
                    <XCircle size={20}/> Cancelar
                </button>
            )}
        </div>

        <form onSubmit={handleSubmit} className="card">
            <h3 className="section-title" style={{fontSize: '1.1rem'}}>Detalles</h3>

            <div className="form-group">
                <label className="form-label">Código</label>
                <div className="input-wrapper">
                    <Barcode className="input-icon" size={20} />
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="---"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        style={{borderColor: !code ? '#cbd5e1' : 'var(--primary)'}}
                    />
                    {code && <CheckCircle size={18} className="input-icon" style={{left: 'auto', right: '16px', color: 'var(--primary)'}} />}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Material</label>
                <div className="input-wrapper">
                    <Package className="input-icon" size={20} />
                    <select 
                        className="select-input" 
                        style={{paddingLeft: '48px', width: '100%'}}
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
                    <input 
                        type="number" min="1" className="form-input" 
                        value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !code || !material} 
                style={{opacity: (!code || !material) ? 0.6 : 1}}
            >
                {loading ? 'Procesando...' : 'Registrar'}
            </button>
        </form>
      </div>
    </>
  );
};

export default AddCustomTask;