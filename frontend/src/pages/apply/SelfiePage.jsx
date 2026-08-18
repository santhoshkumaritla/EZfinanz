import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import StepProgress from '../../components/StepProgress';
import ApplyLayout from '../../components/ApplyLayout';

export default function SelfiePage() {
  const { application, refreshApplication } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('camera');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      setError('Camera access denied. Please upload a photo instead.');
      setMode('upload');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const captured = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        setFile(captured);
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please capture or upload a selfie photo');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = new FormData();
      data.append('selfie', file);
      await api.post('/application/selfie', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshApplication();
      navigate('/apply/status');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit selfie');
    } finally {
      setLoading(false);
    }
  };

  const rejected = application?.selfie?.adminStatus === 'rejected';

  return (
    <ApplyLayout title="Live Selfie Verification">
      <StepProgress currentStage="selfie" />

      {rejected && (
        <div className="alert-warning">
          Your previous photo was rejected: {application.selfie.rejectionReason}. Please submit a new photo.
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}

      <div className="tab-group mb-4">
        <button type="button" className={`tab-btn ${mode === 'camera' ? 'active' : ''}`} onClick={() => { setMode('camera'); setPreview(null); setFile(null); }}>
          Live Camera
        </button>
        <button type="button" className={`tab-btn ${mode === 'upload' ? 'active' : ''}`} onClick={() => { setMode('upload'); stopCamera(); setPreview(null); setFile(null); }}>
          Upload Photo
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'camera' ? (
          <div className="text-center">
            {!preview ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="mx-auto block max-w-full rounded-xl bg-gray-900" />
                <canvas ref={canvasRef} className="hidden" />
                {!cameraActive ? (
                  <button type="button" className="btn-secondary mt-4" onClick={startCamera}>
                    Start Camera
                  </button>
                ) : (
                  <button type="button" className="btn-primary mt-4" onClick={capturePhoto}>
                    Capture Selfie
                  </button>
                )}
              </>
            ) : (
              <div>
                <img src={preview} alt="Selfie preview" className="mx-auto block max-w-sm rounded-xl" />
                <button type="button" className="btn-secondary btn-sm mt-3" onClick={() => { setPreview(null); setFile(null); startCamera(); }}>
                  Retake
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="form-group">
            <input type="file" accept="image/*" capture="user" onChange={handleFileChange} className="text-sm" />
            {preview && <img src={preview} alt="Upload preview" className="mx-auto mt-4 block max-w-sm rounded-xl" />}
          </div>
        )}

        <button type="submit" className="btn-primary btn-block mt-6" disabled={loading || !file}>
          {loading ? 'Submitting...' : 'Submit for Admin Review'}
        </button>
      </form>
    </ApplyLayout>
  );
}
