import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { authAPI } from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgId, setOrgId] = useState('org_demo');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('token', token);
        
        await authAPI.register({
          firebase_uid: userCredential.user.uid,
          email: email,
          role: 'employee',
          organization_id: orgId
        });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('token', token);
      }
      
      onLogin();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.title}>Agentic AI System</h1>
            <p style={styles.subtitle}>Local Enterprise AI Platform</p>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
              {isSignUp && (
                <input
                  type="text"
                  placeholder="Organization ID"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  style={styles.input}
                  required
                />
              )}
              
              {error && <p style={styles.error}>{error}</p>}
              
              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? 'Authenticating...' : (isSignUp ? 'Sign Up' : 'Login')}
              </button>
            </form>
            
            <p style={styles.toggle}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <span onClick={() => setIsSignUp(!isSignUp)} style={styles.link}>
                {isSignUp ? ' Login' : ' Sign Up'}
              </span>
            </p>
          </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000000',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    border: '3px solid #000',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '28px',
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: '0 0 30px 0',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px',
    border: '2px solid #000',
    borderRadius: '5px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  button: {
    padding: '12px',
    background: '#000000',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  error: {
    color: '#000',
    fontSize: '12px',
    margin: '0',
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '5px',
    border: '1px solid #000',
  },
  toggle: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: '#666',
  },
  link: {
    color: '#000',
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
};

export default Login;
