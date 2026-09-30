// A single, focused React component: live camera video (requirement #26.i)
// captured onto a canvas (requirement #26.ii). Loaded via Babel standalone
// (see profile.ejs) rather than a bundler — this is the only React piece in
// an otherwise jQuery-driven app, so a build step isn't worth the overhead.
const { useRef, useState, useEffect } = React;

function VerifyCamera({ userId, onVerified }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [phase, setPhase] = useState('idle'); // idle -> camera -> captured -> verified
  const [error, setError] = useState(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase('camera');
    } catch (err) {
      setError('לא ניתן לגשת למצלמה. יש לאשר הרשאת מצלמה בדפדפן.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    stopCamera();
    setPhase('captured');
  };

  const retake = () => {
    setPhase('idle');
    startCamera();
  };

  const confirmVerified = () => {
    $.ajax({
      url: `/api/users/${userId}/verify`,
      method: 'POST',
      success: function () {
        setPhase('verified');
        if (onVerified) onVerified();
      },
      error: function () {
        setError('שגיאה באימות הפרופיל, נסה/י שוב.');
      },
    });
  };

  useEffect(() => stopCamera, []); // stop the camera if the component unmounts mid-stream

  return (
    <div className="verify-widget">
      {error && <div className="error-box">{error}</div>}

      <video
        ref={videoRef}
        style={{ display: phase === 'camera' ? 'block' : 'none', margin: '0 auto' }}
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ display: phase === 'captured' || phase === 'verified' ? 'block' : 'none', margin: '0 auto' }} />

      <div style={{ marginTop: 12 }}>
        {phase === 'idle' && <button type="button" onClick={startCamera}>הפעלת מצלמה</button>}
        {phase === 'camera' && <button type="button" onClick={capture}>צילום סלפי</button>}
        {phase === 'captured' && (
          <>
            <button type="button" className="secondary" onClick={retake}>צילום מחדש</button>{' '}
            <button type="button" onClick={confirmVerified}>אישור וסימון כמאומת</button>
          </>
        )}
        {phase === 'verified' && <p className="badge">הפרופיל אומת בהצלחה</p>}
      </div>
    </div>
  );
}
