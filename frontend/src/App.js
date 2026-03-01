import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAMDScreen, setShowAMDScreen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [dashboardFadeIn, setDashboardFadeIn] = useState(false);

  useEffect(() => {
    // Show initial loading screen
    setTimeout(() => {
      setShowInitialLoading(false);
    }, 2500);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('token', token);
        
        try {
          const response = await fetch('http://localhost:8000/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUserRole(userData.role);
          } else if (response.status === 404) {
            // User not in database, register them
            const isAdmin = user.email === 'admin@agenticai.com';
            const registerResponse = await fetch('http://localhost:8000/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                firebase_uid: user.uid,
                email: user.email,
                role: isAdmin ? 'admin' : 'employee',
                organization_id: 'org_demo'
              })
            });
            
            if (registerResponse.ok) {
              const userData = await registerResponse.json();
              setUserRole(userData.role);
            } else {
              setUserRole('employee');
            }
          } else {
            setUserRole('employee');
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          setUserRole('employee');
        }
        
        setUser(user);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    setShowAMDScreen(true);
    setTimeout(async () => {
      setFadeOut(true);
      setTimeout(async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          try {
            const response = await fetch('http://localhost:8000/auth/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUserRole(userData.role);
            } else if (response.status === 404) {
              // Register user if not found
              const isAdmin = currentUser.email === 'admin@agenticai.com';
              const registerResponse = await fetch('http://localhost:8000/auth/register', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  firebase_uid: currentUser.uid,
                  email: currentUser.email,
                  role: isAdmin ? 'admin' : 'employee',
                  organization_id: 'org_demo'
                })
              });
              
              if (registerResponse.ok) {
                const userData = await registerResponse.json();
                setUserRole(userData.role);
              } else {
                setUserRole('employee');
              }
            } else {
              setUserRole('employee');
            }
          } catch (err) {
            console.error('Error fetching user role:', err);
            setUserRole('employee');
          }
        }
        setUser(currentUser);
        setDashboardFadeIn(true);
        setShowAMDScreen(false);
        setFadeOut(false);
      }, 1000);
    }, 2000);
  };

  if (showInitialLoading) {
    return (
      <div style={styles.initialLoading}>
        <div style={styles.initialText} className="pulse">OrgCopilot - Agentic AI For Organizations</div>
      </div>
    );
  }

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

  if (loading || (user && !userRole)) {
    return (
      <div style={styles.loading}>
        <h2>Loading...</h2>
        <p style={{fontSize: '14px', marginTop: '10px'}}>Checking user role...</p>
      </div>
    );
  }

  return (
    <div style={dashboardFadeIn ? styles.dashboardFadeIn : {}}>
      {user ? (
        userRole === 'admin' ? (
          <AdminDashboard onLogout={() => {
            auth.signOut();
            localStorage.removeItem('token');
            window.location.reload();
          }} />
        ) : (
          <Dashboard />
        )
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

const styles = {
  initialLoading: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  initialText: {
    color: 'white',
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    textAlign: 'center',
  },
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
  dashboardFadeIn: {
    animation: 'fadeInDashboard 1.5s ease-out',
  },
};

export default App;
