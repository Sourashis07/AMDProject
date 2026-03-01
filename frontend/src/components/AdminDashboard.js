import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import axios from 'axios';
import LineChart from './LineChart';

function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [gpuHistory, setGpuHistory] = useState([]);
  const maxDataPoints = 60; // Keep last 60 seconds

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 1000); // Refresh every 1 second
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Loading admin stats...');
      const [statsRes, sessionsRes] = await Promise.all([
        axios.get('http://localhost:8000/admin/system-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/admin/active-sessions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      console.log('Stats loaded:', statsRes.data);
      setStats(statsRes.data);
      setSessions(sessionsRes.data.active_sessions);
      
      // Update CPU history
      const cpuAvg = parseFloat(statsRes.data.cpu.average_usage);
      setCpuHistory(prev => [...prev.slice(-maxDataPoints + 1), cpuAvg]);
      
      // Update GPU history
      if (statsRes.data.gpu[0]?.load) {
        const gpuLoad = parseFloat(statsRes.data.gpu[0].load);
        setGpuHistory(prev => [...prev.slice(-maxDataPoints + 1), gpuLoad]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading stats:', err);
      if (err.response?.status === 403) {
        alert('Admin access required');
      }
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading system stats...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard - System Monitor</h1>
        <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.content}>
        {/* Live Graphs */}
        <div style={styles.graphsContainer}>
          <div style={styles.graphCard}>
            <LineChart data={cpuHistory} color="#ed1c24" label="CPU Usage (%)" max={100} />
          </div>
          <div style={styles.graphCard}>
            <LineChart data={gpuHistory} color="#76b900" label="GPU Usage (%)" max={100} />
          </div>
        </div>

        <div style={styles.grid}>
          {/* CPU Stats */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>CPU Usage</h2>
              <img src="https://wallpapers.com/images/featured/amd-wpyulqyqm4zt567i.jpg" alt="AMD" style={styles.cardLogo} />
            </div>
            <div style={styles.cpuName}>{stats?.cpu.name}</div>
            <div style={styles.stat}>
              <span>Cores:</span>
              <strong>{stats?.cpu.cores}</strong>
            </div>
            <div style={styles.stat}>
              <span>Average:</span>
              <strong>{stats?.cpu.average_usage}</strong>
            </div>
            <div style={styles.stat}>
              <span>Frequency:</span>
              <strong>{stats?.cpu.frequency}</strong>
            </div>
            <div style={styles.coreList}>
              {stats?.cpu.usage_per_core.map((usage, idx) => (
                <div key={idx} style={styles.core}>
                  Core {idx}: {usage}
                </div>
              ))}
            </div>
          </div>

          {/* Memory Stats */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Memory Usage</h2>
            <div style={styles.stat}>
              <span>Total:</span>
              <strong>{stats?.memory.total}</strong>
            </div>
            <div style={styles.stat}>
              <span>Used:</span>
              <strong>{stats?.memory.used}</strong>
            </div>
            <div style={styles.stat}>
              <span>Available:</span>
              <strong>{stats?.memory.available}</strong>
            </div>
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, width: stats?.memory.percent}}></div>
            </div>
            <div style={styles.progressText}>{stats?.memory.percent}</div>
          </div>

          {/* GPU Stats */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>GPU Usage</h2>
              <img src="https://static.vecteezy.com/system/resources/previews/020/190/499/non_2x/nvidia-logo-nvidia-icon-free-free-vector.jpg" alt="NVIDIA" style={styles.cardLogo} />
            </div>
            {stats?.gpu.map((gpu, idx) => (
              <div key={idx} style={styles.gpuCard}>
                {gpu.name ? (
                  <>
                    <div style={styles.stat}>
                      <span>Name:</span>
                      <strong>{gpu.name}</strong>
                    </div>
                    <div style={styles.stat}>
                      <span>Load:</span>
                      <strong>{gpu.load}</strong>
                    </div>
                    <div style={styles.stat}>
                      <span>Memory:</span>
                      <strong>{gpu.memory_used} / {gpu.memory_total}</strong>
                    </div>
                    <div style={styles.stat}>
                      <span>Temperature:</span>
                      <strong>{gpu.temperature}</strong>
                    </div>
                  </>
                ) : (
                  <p>{gpu.message}</p>
                )}
              </div>
            ))}
          </div>

          {/* Active Users */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Active Users (24h)</h2>
            <div style={styles.bigNumber}>{stats?.active_users}</div>
            <div style={styles.sessionList}>
              {sessions.map((session, idx) => (
                <div key={idx} style={styles.sessionItem}>
                  <div style={styles.sessionEmail}>{session.email}</div>
                  <div style={styles.sessionIP}>IP: {session.ip}</div>
                  <div style={styles.sessionQueries}>{session.queries_24h} queries</div>
                  <div style={styles.sessionTime}>
                    Last: {new Date(session.last_activity).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    background: '#000000',
    color: 'white',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '24px',
  },
  logoutBtn: {
    padding: '8px 16px',
    background: 'transparent',
    color: 'white',
    border: '2px solid white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  content: {
    padding: '40px',
  },
  graphsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  graphCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    border: '2px solid #000',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    border: '2px solid #000',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #000',
    paddingBottom: '10px',
    marginBottom: '20px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
  },
  cardLogo: {
    height: '40px',
    width: 'auto',
    borderRadius: '5px',
  },
  cpuName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666',
    marginBottom: '15px',
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '5px',
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
  },
  coreList: {
    marginTop: '15px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '5px',
  },
  core: {
    fontSize: '12px',
    padding: '5px',
    background: '#f5f5f5',
    borderRadius: '3px',
  },
  progressBar: {
    width: '100%',
    height: '20px',
    background: '#eee',
    borderRadius: '10px',
    overflow: 'hidden',
    marginTop: '15px',
  },
  progressFill: {
    height: '100%',
    background: '#000',
    transition: 'width 0.3s',
  },
  progressText: {
    textAlign: 'center',
    marginTop: '5px',
    fontWeight: 'bold',
  },
  gpuCard: {
    marginBottom: '10px',
  },
  bigNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '20px 0',
  },
  sessionList: {
    marginTop: '20px',
  },
  sessionItem: {
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '5px',
    marginBottom: '10px',
  },
  sessionEmail: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  sessionIP: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '5px',
  },
  sessionQueries: {
    fontSize: '14px',
    color: '#666',
  },
  sessionTime: {
    fontSize: '12px',
    color: '#999',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '24px',
  },
};

export default AdminDashboard;
