import React, { useState, useEffect, useRef } from 'react';
import { queryAPI } from '../services/api';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';

function ChatWindow({ document, documents, onClose, onDocumentChange }) {
  const [queryText, setQueryText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    wordLimit: 200,
    answerMode: 'balanced',
    model: 'llama3.1:8b'
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!document || !auth.currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', auth.currentUser.uid),
      where('documentId', '==', document.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    }, (error) => {
      console.error('Firestore error:', error);
      // Fallback: try without orderBy if index doesn't exist
      const simpleQ = query(
        collection(db, 'chats'),
        where('userId', '==', auth.currentUser.uid),
        where('documentId', '==', document.id)
      );
      onSnapshot(simpleQ, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => a.timestamp?.toMillis() - b.timestamp?.toMillis());
        setMessages(msgs);
      });
    });

    return () => unsubscribe();
  }, [document]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const formatText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.match(/^\d+\./)) {
        return <div key={idx} style={styles.numberedItem}>{line}</div>;
      } else if (line.match(/^[-•*]/)) {
        return <div key={idx} style={styles.bulletItem}>{line}</div>;
      } else if (line.trim()) {
        return <div key={idx} style={styles.textLine}>{line}</div>;
      }
      return <br key={idx} />;
    });
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!queryText.trim() || !document) return;

    const currentQuery = queryText;
    setQueryText('');
    setLoading(true);

    // Add user message to local state immediately
    const tempUserMsg = {
      id: 'temp-user-' + Date.now(),
      type: 'user',
      text: currentQuery,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // Save to Firestore
      await addDoc(collection(db, 'chats'), {
        type: 'user',
        text: currentQuery,
        userId: auth.currentUser.uid,
        documentId: document.id,
        timestamp: new Date()
      });

      const res = await queryAPI.processDocumentQuery({
        query_text: currentQuery,
        document_id: document.id,
        word_limit: filters.wordLimit,
        answer_mode: filters.answerMode,
        model: filters.model
      });

      // Add AI message to local state immediately
      const tempAiMsg = {
        id: 'temp-ai-' + Date.now(),
        type: 'ai',
        text: res.data.response_text,
        decision: res.data.decisions[0],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, tempAiMsg]);

      // Save to Firestore
      await addDoc(collection(db, 'chats'), {
        type: 'ai',
        text: res.data.response_text,
        decision: res.data.decisions[0],
        userId: auth.currentUser.uid,
        documentId: document.id,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('Query error:', err);
      alert('Query failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSwitch = (doc) => {
    onDocumentChange(doc);
  };

  const handleClearChat = async () => {
    if (!window.confirm('Delete all messages for this document?')) return;
    try {
      const q = query(
        collection(db, 'chats'),
        where('userId', '==', auth.currentUser.uid),
        where('documentId', '==', document.id)
      );
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
    } catch (err) {
      alert('Failed to clear chat: ' + err.message);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.window}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>Documents</h3>
          </div>
          <div style={styles.documentList}>
            {documents.filter(d => d.status === 'completed').map((doc) => (
              <div
                key={doc.id}
                style={{
                  ...styles.sidebarItem,
                  ...(document.id === doc.id ? styles.sidebarItemActive : {})
                }}
                onClick={() => handleDocumentSwitch(doc)}
              >
                <div style={styles.docName}>{doc.filename}</div>
                <div style={styles.docChunks}>{doc.chunk_count} chunks</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.chatArea}>
          <div style={styles.chatHeader}>
            <div>
              <h3 style={styles.chatTitle}>{document.filename}</h3>
              <p style={styles.chatSubtitle}>Ask questions about this document</p>
            </div>
            <div style={styles.headerActions}>
              <button onClick={handleClearChat} style={styles.clearBtn}>Clear Chat</button>
              <button onClick={onClose} style={styles.closeBtn}>×</button>
            </div>
          </div>

          <div style={styles.messagesArea}>
            {messages.length === 0 && !loading && (
              <div style={styles.emptyState}>
                <p>Start asking questions about {document.filename}</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} style={styles.messageWrapper}>
                {msg.type === 'user' ? (
                  <div style={styles.userMessage}>
                    <p style={styles.messageText}>{msg.text}</p>
                  </div>
                ) : (
                  <div style={styles.aiMessage}>
                    <div style={styles.aiHeader}>Llama 3.1</div>
                    <div style={styles.messageText}>
                      {formatText(msg.text)}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={styles.messageWrapper}>
                <div style={styles.aiMessage}>
                  <div style={styles.thinkingAnimation}>
                    <span className="dot">●</span>
                    <span className="dot">●</span>
                    <span className="dot">●</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={styles.inputArea}>
            <form onSubmit={handleQuery} style={styles.inputForm}>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                style={styles.filterBtn}
                disabled={loading}
              >
                ⚙
              </button>
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Ask a question..."
                style={styles.input}
                disabled={loading}
              />
              <button
                type="submit"
                style={styles.sendBtn}
                disabled={loading || !queryText.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {showFilters && (
        <div style={styles.filterModal}>
          <div style={styles.filterContent}>
            <div style={styles.filterHeader}>
              <h3 style={styles.filterTitle}>Filter Settings</h3>
              <button onClick={() => setShowFilters(false)} style={styles.filterClose}>×</button>
            </div>

            <div style={styles.filterSection}>
              <label style={styles.filterLabel}>Word Limit: {filters.wordLimit}</label>
              <input
                type="range"
                min="50"
                max="500"
                step="50"
                value={filters.wordLimit}
                onChange={(e) => setFilters({...filters, wordLimit: parseInt(e.target.value)})}
                style={styles.slider}
              />
              <div style={styles.sliderLabels}>
                <span>50</span>
                <span>500</span>
              </div>
            </div>

            <div style={styles.filterSection}>
              <label style={styles.filterLabel}>Answer Mode</label>
              <div style={styles.modeButtons}>
                <button
                  onClick={() => setFilters({...filters, answerMode: 'strict'})}
                  style={filters.answerMode === 'strict' ? styles.modeButtonActive : styles.modeButton}
                >
                  Strict
                </button>
                <button
                  onClick={() => setFilters({...filters, answerMode: 'balanced'})}
                  style={filters.answerMode === 'balanced' ? styles.modeButtonActive : styles.modeButton}
                >
                  Balanced
                </button>
                <button
                  onClick={() => setFilters({...filters, answerMode: 'creative'})}
                  style={filters.answerMode === 'creative' ? styles.modeButtonActive : styles.modeButton}
                >
                  Creative
                </button>
              </div>
              <p style={styles.modeDescription}>
                {filters.answerMode === 'strict' && 'Only use document content'}
                {filters.answerMode === 'balanced' && 'Primarily document, some general knowledge'}
                {filters.answerMode === 'creative' && 'Document + general knowledge'}
              </p>
            </div>

            <div style={styles.filterSection}>
              <label style={styles.filterLabel}>Model</label>
              <select
                value={filters.model}
                onChange={(e) => setFilters({...filters, model: e.target.value})}
                style={styles.select}
              >
                <option value="llama3.1:8b">Llama 3.1 (8B)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  window: {
    width: '90%',
    height: '90%',
    background: '#ffffff',
    borderRadius: '10px',
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: '250px',
    background: '#f5f5f5',
    borderRight: '2px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    height: '80px',
    background: '#000000',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
  },
  sidebarTitle: {
    margin: 0,
    color: 'white',
    fontSize: '18px',
  },
  documentList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
  },
  sidebarItem: {
    padding: '15px',
    marginBottom: '10px',
    background: '#ffffff',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
  },
  sidebarItemActive: {
    background: '#000000',
    color: 'white',
    border: '1px solid #000',
  },
  docName: {
    fontWeight: 'bold',
    marginBottom: '5px',
    fontSize: '14px',
  },
  docChunks: {
    fontSize: '12px',
    opacity: 0.7,
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    height: '80px',
    padding: '0 20px',
    background: '#000000',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  clearBtn: {
    background: 'transparent',
    border: '2px solid white',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '5px',
    fontWeight: 'bold',
  },
  chatTitle: {
    margin: '0 0 5px 0',
    fontSize: '20px',
  },
  chatSubtitle: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.8,
  },
  closeBtn: {
    background: 'transparent',
    border: '2px solid white',
    color: 'white',
    fontSize: '30px',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',
  },
  messagesArea: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    background: '#fafafa',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
    textAlign: 'center',
  },
  messageWrapper: {
    marginBottom: '20px',
  },
  userMessage: {
    background: '#000000',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '18px',
    maxWidth: '70%',
    marginLeft: 'auto',
  },
  aiMessage: {
    background: '#ffffff',
    padding: '12px 16px',
    borderRadius: '18px',
    border: '1px solid #ddd',
    maxWidth: '70%',
  },
  aiHeader: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#666',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  messageText: {
    margin: 0,
    lineHeight: '1.5',
  },
  numberedItem: {
    marginLeft: '20px',
    marginBottom: '8px',
  },
  bulletItem: {
    marginLeft: '20px',
    marginBottom: '8px',
  },
  textLine: {
    marginBottom: '8px',
  },
  decisionBox: {
    background: '#f5f5f5',
    padding: '10px',
    borderRadius: '8px',
    marginTop: '10px',
    fontSize: '13px',
  },
  thinkingAnimation: {
    display: 'flex',
    gap: '5px',
  },
  inputArea: {
    padding: '20px',
    background: '#ffffff',
    borderTop: '2px solid #ddd',
  },
  inputForm: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  filterBtn: {
    width: '40px',
    height: '40px',
    background: '#000000',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    padding: '12px 20px',
    border: '1px solid #ddd',
    borderRadius: '25px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  sendBtn: {
    padding: '12px 30px',
    background: '#000000',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  filterModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  filterContent: {
    background: 'white',
    borderRadius: '10px',
    width: '400px',
    maxWidth: '90%',
  },
  filterHeader: {
    background: '#000000',
    color: 'white',
    padding: '20px',
    borderRadius: '10px 10px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterTitle: {
    margin: 0,
    fontSize: '18px',
  },
  filterClose: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '30px',
    cursor: 'pointer',
    lineHeight: '1',
  },
  filterSection: {
    padding: '20px',
    borderBottom: '1px solid #eee',
  },
  filterLabel: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '10px',
    fontSize: '14px',
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    outline: 'none',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
  },
  modeButtons: {
    display: 'flex',
    gap: '10px',
  },
  modeButton: {
    flex: 1,
    padding: '10px',
    background: '#f5f5f5',
    border: '2px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  modeButtonActive: {
    flex: 1,
    padding: '10px',
    background: '#000000',
    color: 'white',
    border: '2px solid #000',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  modeDescription: {
    fontSize: '12px',
    color: '#666',
    marginTop: '10px',
    fontStyle: 'italic',
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '2px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
};

export default ChatWindow;
