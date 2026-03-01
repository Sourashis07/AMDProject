import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAMDScreen, setShowAMDScreen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('token', token);
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = () => {
    setShowAMDScreen(true);
    setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setUser(auth.currentUser);
        setShowAMDScreen(false);
        setFadeOut(false);
      }, 1000);
    }, 2000);
  };

  if (showAMDScreen) {
    return (
      <div style={{...styles.amdScreen, ...(fadeOut ? styles.fadeOut : {})}}>
        <div style={styles.amdContent}>
          <img 
            src="https://wallpapers.com/images/hd/gray-amd-logo-n657xc6ettzratsr.jpg" 
            alt="AMD Logo" 
            style={styles.amdLogo}
          />
          <div style={styles.poweredText} className="pulse">Powered by AMD</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div>
      {user ? <Dashboard /> : <Login onLogin={handleLogin} />}
    </div>
  );
}

const styles = {
  amdScreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgb(23, 22, 20)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    opacity: 1,
    transition: 'opacity 1s ease-out',
  },
  fadeOut: {
    opacity: 0,
  },
  amdContent: {
    textAlign: 'center',
  },
  amdLogo: {
    width: '300px',
    height: 'auto',
    marginBottom: '30px',
    animation: 'fadeIn 1s ease-in-out',
  },
  poweredText: {
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '2px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#000000',
    color: 'white',
  },
};

export default App;
