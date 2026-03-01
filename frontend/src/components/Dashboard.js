import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { documentsAPI, queryAPI, logsAPI } from '../services/api';
import ChatWindow from './ChatWindow';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('upload');
  const [documents, setDocuments] = useState([]);
  const [queryHistory, setQueryHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    setUser(auth.currentUser);
    if (auth.currentUser) {
      loadDocuments();
      loadQueryHistory();
    }
  }, []);

  useEffect(() => {
    // Refresh documents when tab changes
    if (activeTab === 'upload' || activeTab === 'chat') {
      loadDocuments();
    }
  }, [activeTab]);

  const loadDocuments = async () => {
    try {
      const res = await documentsAPI.list();
      setDocuments(res.data);
    } catch (err) {
      console.error('Error loading documents:', err);
      // Retry once if token might be stale
      if (err.response?.status === 401) {
        const token = await auth.currentUser?.getIdToken(true);
        if (token) {
          localStorage.setItem('token', token);
          const res = await documentsAPI.list();
          setDocuments(res.data);
        }
      }
    }
  };

  const loadQueryHistory = async () => {
    try {
      const res = await queryAPI.history(10);
      setQueryHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };



  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);
    try {
      await documentsAPI.upload(file);
      alert('Document uploaded successfully!');
      loadDocuments();
      setSelectedFile(null);
      e.target.value = '';
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAskClick = (doc) => {
    setSelectedDocument(doc);
    setShowChatWindow(true);
  };

  const handleViewDocument = (doc) => {
    const token = localStorage.getItem('token');
    window.open(`http://localhost:8000/documents/view/${doc.id}?token=${token}`, '_blank');
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await documentsAPI.delete(docId);
      loadDocuments();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const getDisplayEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 3) return email;
    return `${name.substring(0, 3)}...@${domain}`;
  };

  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>OrgCopilot - Dashboard</h1>
        
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('upload')}
            style={activeTab === 'upload' ? styles.tabActive : styles.tab}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            style={activeTab === 'chat' ? styles.tabActive : styles.tab}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={activeTab === 'history' ? styles.tabActive : styles.tab}
          >
            History
          </button>
        </div>

        <div style={styles.accountSection}>
          <div 
            style={styles.accountButton}
            onClick={() => setShowAccountMenu(!showAccountMenu)}
          >
            {getDisplayEmail(user?.email)}
          </div>
          {showAccountMenu && (
            <div style={styles.accountMenu}>
              <button onClick={handleLogout} style={styles.menuItem} className="menuItem">Logout</button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {activeTab === 'upload' && (
          <div>
            <h2>Upload Documents</h2>
            <div style={styles.uploadBox}>
              <label htmlFor="file-upload" style={styles.uploadButton}>
                Choose File
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                style={styles.fileInputHidden}
                disabled={loading}
                accept=".txt,.pdf,.png,.jpg,.jpeg,.gif,.bmp"
              />
              <p style={styles.fileName}>
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </p>
              {loading && <p>Uploading...</p>}
              <p style={styles.hint}>Supported: TXT, PDF, Images</p>
            </div>

            <h3 style={styles.sectionTitle}>Your Documents</h3>
            <div style={styles.documentList}>
              {documents.map((doc) => (
                <div key={doc.id} style={styles.documentCard}>
                  <div style={styles.docInfo}>
                    <strong>{doc.filename}</strong>
                    <p style={styles.docMeta}>
                      Status: <span style={doc.status === 'completed' ? styles.statusSuccess : styles.statusPending}>
                        {doc.status}
                      </span>
                    </p>
                    <p style={styles.docMeta}>Chunks: {doc.chunk_count}</p>
                  </div>
                  <div style={styles.docActions}>
                    {doc.status === 'completed' && (
                      <button onClick={() => handleAskClick(doc)} style={styles.askBtn}>
                        Ask
                      </button>
                    )}
                    <button onClick={() => handleViewDocument(doc)} style={styles.viewBtn}>
                      View
                    </button>
                    <button onClick={() => handleDeleteDocument(doc.id)} style={styles.deleteBtn}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && <p>No documents uploaded yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div>
            <h2>Chat with Documents</h2>
            <p>Select a document to start chatting</p>
            <div style={styles.documentList}>
              {documents.filter(d => d.status === 'completed').map((doc) => (
                <div key={doc.id} style={styles.documentCard}>
                  <div style={styles.docInfo}>
                    <strong>{doc.filename}</strong>
                    <p style={styles.docMeta}>Chunks: {doc.chunk_count}</p>
                  </div>
                  <div style={styles.docActions}>
                    <button onClick={() => handleAskClick(doc)} style={styles.askBtn}>
                      Open Chat
                    </button>
                    <button onClick={() => handleDeleteDocument(doc.id)} style={styles.deleteBtn}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {documents.filter(d => d.status === 'completed').length === 0 && (
                <p>No documents available for chat.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2>Query History</h2>
            <div style={styles.historyList}>
              {queryHistory.map((item) => (
                <div key={item.id} style={styles.historyCard}>
                  <p style={styles.historyQuery}><strong>Q:</strong> {item.query_text}</p>
                  <p style={styles.historyResponse}><strong>A:</strong> {item.response_text}</p>
                  <p style={styles.historyTime}>{new Date(item.created_at).toLocaleString()}</p>
                </div>
              ))}
              {queryHistory.length === 0 && <p>No query history yet.</p>}
            </div>
          </div>
        )}


      </div>

      {showChatWindow && (
        <ChatWindow
          document={selectedDocument}
          documents={documents}
          onClose={() => setShowChatWindow(false)}
          onDocumentChange={setSelectedDocument}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#ffffff',
  },
  header: {
    background: '#000000',
    color: 'white',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
  },
  tab: {
    padding: '10px 20px',
    background: 'transparent',
    border: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#999',
    borderRadius: '5px',
  },
  tabActive: {
    padding: '10px 20px',
    background: 'transparent',
    border: '2px solid white',
    cursor: 'pointer',
    fontSize: '16px',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: '5px',
  },
  accountSection: {
    position: 'relative',
  },
  accountButton: {
    color: 'white',
    cursor: 'pointer',
    padding: '8px 16px',
    border: '2px solid white',
    borderRadius: '5px',
    fontWeight: 'bold',
  },
  accountMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '10px',
    background: 'white',
    border: '2px solid #000',
    borderRadius: '8px',
    minWidth: '150px',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  menuItem: {
    width: '100%',
    padding: '12px 20px',
    background: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#000',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  content: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  uploadBox: {
    background: '#f9f9f9',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '30px',
    textAlign: 'center',
    border: '2px dashed #ccc',
  },
  uploadButton: {
    display: 'inline-block',
    padding: '12px 40px',
    background: '#000000',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  fileInputHidden: {
    display: 'none',
  },
  fileName: {
    marginTop: '15px',
    fontSize: '14px',
    color: '#666',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '10px',
  },
  sectionTitle: {
    marginTop: '30px',
    marginBottom: '15px',
  },
  documentList: {
    display: 'grid',
    gap: '15px',
  },
  documentCard: {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docMeta: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#666',
  },
  docActions: {
    display: 'flex',
    gap: '10px',
  },
  viewBtn: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#000',
    border: '2px solid #000',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  askBtn: {
    padding: '10px 30px',
    background: '#000000',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  deleteBtn: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#000',
    border: '2px solid #000',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  statusSuccess: {
    color: '#000',
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#666',
    fontWeight: 'bold',
  },
  statusError: {
    color: '#999',
    fontWeight: 'bold',
  },
  historyList: {
    display: 'grid',
    gap: '15px',
  },
  historyCard: {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  historyQuery: {
    marginBottom: '10px',
    color: '#000',
  },
  historyResponse: {
    color: '#666',
    marginBottom: '10px',
  },
  historyTime: {
    fontSize: '12px',
    color: '#999',
  },
  refreshBtn: {
    padding: '10px 20px',
    background: '#000000',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  logsList: {
    display: 'grid',
    gap: '10px',
  },
  logCard: {
    background: '#ffffff',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  logAgent: {
    fontWeight: 'bold',
    color: '#000',
  },
  logAction: {
    fontSize: '14px',
    marginBottom: '5px',
    color: '#666',
  },
  logTime: {
    fontSize: '12px',
    color: '#999',
  },
};

export default Dashboard;
