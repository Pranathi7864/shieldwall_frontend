import React, { useState, useEffect } from 'react';

function Dashboard({ user, onLogout }) {
  // Navigation tabs for Admin view
  const [adminTab, setAdminTab] = useState('keys'); 
  
  // Data State Arrays
  const [alerts, setAlerts] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Form Field Inputs
  const [logPayload, setLogPayload] = useState('');
  const [ingestionMessage, setIngestionMessage] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newSecretKey, setNewSecretKey] = useState('');

  // 1. Fetch data systematically based on who is logged in
  const loadTelemetryData = () => {
    fetch(`http://localhost:8080/api/alerts?currentUsername=${user.username}`)
      .then((res) => res.json())
      .then((data) => setAlerts(data))
      .catch((err) => console.error(err));

    fetch(`http://localhost:8080/api/credentials?currentUsername=${user.username}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCredentials(data))
      .catch((err) => console.error(err));

    // Fetch master user matrix metadata if the logged-in profile is an Admin
    if (user.role === 'ADMIN') {
      fetch(`http://localhost:8080/api/users?currentUsername=${user.username}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setUsersList(data))
        .catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    loadTelemetryData();
    // Setting up a polling system to keep metrics fresh on admin dashboards
    const interval = setInterval(loadTelemetryData, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if current employee has caused any alerts
  const isEmployeeBlackMarked = alerts.some(alert => alert.triggeredByUserId === user.id);

  // 2. Event Action: Manager creates a new credential asset
  const handleCreateCredential = (e) => {
    e.preventDefault();
    
    console.log("--- Save Key Triggered ---");
    console.log("Current User Object:", user);
    console.log("Input Service Name:", newServiceName);
    console.log("Input Secret Key:", newSecretKey);

    if (!user) {
      alert("Error: Active user session not found. Please log in again.");
      return;
    }

    if (!newServiceName.trim() || !newSecretKey.trim()) {
      alert("Please fill out both the Service Name and Secret Token fields.");
      return;
    }

    const managerId = user.id ? Number(user.id) : 0;
    const usernameParam = user.username || "manager_user";

    const payload = {
      serviceName: newServiceName.trim(),
      secretKey: newSecretKey.trim(),
      status: 'ACTIVE',
      managedByUserId: managerId
    };

    console.log("Sending Payload:", payload);

    fetch(`http://localhost:8080/api/credentials?currentUsername=${encodeURIComponent(usernameParam)}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then((res) => {
      console.log("Server Response Status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP Error Status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("Successfully saved key to vault:", data);
      setNewServiceName('');
      setNewSecretKey('');
      loadTelemetryData(); // Reload list container view
      alert("Key successfully registered to your hardened database vault!");
    })
    .catch((err) => {
      console.error("Network / Server Fetch Exception:", err);
      alert("Failed to connect to the backend server. Make sure Spring Boot is actively running on port 8080!");
    });
  };

  // 3. Event Action: Log Ingestion Scans
  const handleScanLogs = (e) => {
    e.preventDefault();
    setIngestionMessage('');

    fetch(`http://localhost:8080/api/events/scan?currentUsername=${user.username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: logPayload
    })
      .then((res) => res.text())
      .then((msg) => {
        setIngestionMessage(msg);
        setLogPayload('');
        loadTelemetryData();
      })
      .catch((err) => console.error(err));
  };

  // 4. Event Action: Force Manual Rotation
  const handleManualRotation = (id) => {
    fetch(`http://localhost:8080/api/credentials/${id}/rotate?currentUsername=${user.username}`, {
      method: 'POST'
    }).then((res) => { if (res.ok) loadTelemetryData(); });
  };

  // 5. Event Action: Admin approves a registration node
  const handleApproveUser = (userId) => {
    fetch(`http://localhost:8080/api/users/${userId}/approve?currentUsername=${user.username}`, {
      method: 'PUT'
    })
    .then((res) => {
      if (res.ok) {
        loadTelemetryData(); // Refresh table immediately
        alert("Personnel security clearance approved!");
      }
    });
  };

  // 6. Event Action: Clear alert cards
  const handleDismissAlert = (id) => {
    fetch(`http://localhost:8080/api/alerts/${id}?currentUsername=${user.username}`, {
      method: 'DELETE'
    }).then((res) => { if (res.ok) loadTelemetryData(); });
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER HUD PROFILE BLOCK */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e3a8a' }}>ShieldWall Incident Command Console</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
            <p style={{ margin: 0, color: '#64748b' }}>
              Identity: <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{user.username}</span> | 
              Clearance: <span style={{ padding: '2px 8px', background: '#e0f2fe', borderRadius: '4px', fontWeight: 'bold', color: '#0369a1', fontSize: '12px' }}>{user.role}</span>
            </p>
            {user.role === 'EMPLOYEE' && (
              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: isEmployeeBlackMarked ? '#fee2e2' : '#d1fae5', color: isEmployeeBlackMarked ? '#b91c1c' : '#065f46' }}>
                {isEmployeeBlackMarked ? '🚨 Violation Status: Black Marked' : '🟢 Account Status: Clear'}
              </span>
            )}
          </div>
        </div>
        <button onClick={onLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Terminate Session</button>
      </div>

      {/* ======================================================== */}
      {/* 👑 ADMIN DASHBOARD WORKSPACE (TAB DRIVEN LAYOUT)          */}
      {/* ======================================================== */}
      {user.role === 'ADMIN' && (
        <div>
          {/* Admin Navigation Toggles */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button 
              onClick={() => setAdminTab('keys')} 
              style={{ background: adminTab === 'keys' ? '#1e3a8a' : '#cbd5e1', color: adminTab === 'keys' ? 'white' : '#1e293b', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
            >
              Vault & Secret Monitor
            </button>
            <button 
              onClick={() => setAdminTab('users')} 
              style={{ background: adminTab === 'users' ? '#1e3a8a' : '#cbd5e1', color: adminTab === 'users' ? 'white' : '#1e293b', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
            >
              User Management & Violation Ledger
            </button>
          </div>

          {/* PAGE 1: GLOBAL KEY VAULT VIEWER */}
          {adminTab === 'keys' && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0, color: '#047857' }}>🔑 Global Hardened Asset Vault Index</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#64748b' }}>
                    <th style={{ padding: '10px' }}>Service Target</th>
                    <th style={{ padding: '10px' }}>Secret Signature</th>
                    <th style={{ padding: '10px' }}>Status Indicator</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((cred) => (
                    <tr key={cred.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{cred.serviceName}</td>
                      <td style={{ padding: '10px', fontFamily: 'monospace' }}>{cred.secretKey}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', background: cred.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2', color: cred.status === 'ACTIVE' ? '#065f46' : '#991b1b' }}>
                          {cred.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button onClick={() => handleManualRotation(cred.id)} style={{ fontSize: '11px', background: '#0284c7', color: 'white', padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          Force Rotation
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGE 2: USER ACCOUNT VIOLATION MATRIX */}
          {adminTab === 'users' && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0, color: '#7c3aed' }}>👥 Enterprise Personnel Access & Accountability Matrix</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#64748b' }}>
                    <th style={{ padding: '10px' }}>Username Identity</th>
                    <th style={{ padding: '10px' }}>Assigned System Role</th>
                    <th style={{ padding: '10px' }}>Access Clearance</th>
                    <th style={{ padding: '10px' }}>Audit Profile / Action Metrics</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const userLeaked = alerts.some(a => a.triggeredByUserId === u.id);
                    const managerKeys = credentials.filter(c => c.managedByUserId === u.id);
                    const activeCount = managerKeys.filter(c => c.status === 'ACTIVE').length;

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontWeight: '600' }}>{u.username}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>{u.role}</span>
                        </td>
                        
                        {/* ACCESS CLEARANCE STATUS & ACTION BUTTON */}
                        <td style={{ padding: '10px' }}>
                          {u.enabled ? (
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>🟢 Approved</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⏳ Pending</span>
                              <button onClick={() => handleApproveUser(u.id)} style={{ background: '#10b981', color: 'white', fontSize: '11px', padding: '2px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Grant Access
                              </button>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '10px' }}>
                          {u.role === 'EMPLOYEE' && (
                            <span style={{ fontWeight: 'bold', color: userLeaked ? '#ef4444' : '#10b981' }}>
                              {userLeaked ? '⚠️ BLACK MARKED: Exposed Active Secret' : '✅ Clear (No Violations Found)'}
                            </span>
                          )}
                          {u.role === 'MANAGER' && (
                            <span style={{ color: '#0284c7', fontWeight: '500' }}>
                              💼 Managed Keys: <strong>{managerKeys.length}</strong> ({activeCount} Active, {managerKeys.length - activeCount} Compromised)
                            </span>
                          )}
                          {u.role === 'ADMIN' && <span style={{ color: '#64748b' }}>System Administrator Overlord</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 💼 MANAGER & EMPLOYEE CORE FUNCTIONAL INTERFACES          */}
      {/* ======================================================== */}
      {user.role !== 'ADMIN' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* TERMINAL PANEL ACCESSIBLE TO MANAGERS AND EMPLOYEES */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#b45309' }}>📁 Real-Time Log Streams Injection Terminal</h3>
            <form onSubmit={handleScanLogs}>
              <textarea 
                rows="4" 
                placeholder="Paste telemetry logs here to process security filters..."
                value={logPayload}
                onChange={(e) => setLogPayload(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '13px', background: '#f8fafc', width: '100%', padding: '10px', boxSizing: 'border-box', marginBottom: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                required
              />
              <button type="submit" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: 'white', width: '100%', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Transmit String To Scanner
              </button>
            </form>
            {ingestionMessage && (
              <p style={{ background: '#ecfdf5', color: '#047857', padding: '8px', borderRadius: '6px', fontSize: '12px', marginTop: '10px', border: '1px solid #a7f3d0' }}>
                {ingestionMessage}
              </p>
            )}
          </div>

          {/* MANAGER PANEL CONTROL LAYER */}
          {user.role === 'MANAGER' && (
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0, color: '#047857' }}>🛠️ Manage & Register Team Security Assets</h3>
              
              {/* Form to inject new keys into database */}
              <form onSubmit={handleCreateCredential} style={{ marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#334155' }}>Generate Fresh Secret Tracking Key</h4>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input type="text" placeholder="Service Name" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', flex: 1 }} required />
                  <input type="text" placeholder="Secret Key Token" value={newSecretKey} onChange={(e) => setNewSecretKey(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', flex: 1 }} required />
                </div>
                <button type="submit" style={{ background: '#10b981', color: 'white', width: '100%', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Save Key to Database Vault
                </button>
              </form>

              {/* View Manager Owned Keys */}
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155' }}>Your Monitored Credentials</h4>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#64748b', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ paddingBottom: '6px' }}>Service</th>
                    <th style={{ paddingBottom: '6px' }}>Token Signature</th>
                    <th style={{ paddingBottom: '6px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ fontWeight: 'bold', padding: '6px 0' }}>{c.serviceName}</td>
                      <td style={{ fontFamily: 'monospace', padding: '6px 0' }}>{c.secretKey}</td>
                      <td style={{ padding: '6px 0' }}>
                        <span style={{ color: c.status === 'ACTIVE' ? '#047857' : '#ef4444', fontWeight: 'bold' }}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* 🚨 SECURITY INCIDENT MONITORING LEDGER CARD FEED        */}
      {/* ======================================================== */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginTop: '24px' }}>
        <h3 style={{ marginTop: 0, color: '#1e40af' }}>🚨 Real-Time Security Incident Intelligence Ledger</h3>
        {alerts.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>No threat anomalies registered. Operational safety nominal.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {alerts.map((alert) => (
              <div key={alert.id} style={{ border: '1px solid #fee2e2', background: '#fff5f5', borderRadius: '8px', padding: '14px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', margin: '0 0 6px 0' }}>{alert.message}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                  <span style={{ color: '#7f1d1d' }}>Timestamp: {new Date(alert.timestamp).toLocaleTimeString()}</span>
                  {user.role === 'ADMIN' && (
                    <button onClick={() => handleDismissAlert(alert.id)} style={{ background: 'transparent', color: '#b91c1c', border: '1px solid #b91c1c', padding: '2px 6px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}>
                      Dismiss Card
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;