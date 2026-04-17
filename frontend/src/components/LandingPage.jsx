import React from 'react';

export function LandingPage({ onEnter }) {
  return (
    <div className="landing-screen">
      <div className="auth-card">
        <div className="auth-header">
           <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="auth-icon">
             <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
             <path d="M2 17l10 5 10-5"></path>
             <path d="M2 12l10 5 10-5"></path>
           </svg>
        </div>
        
        <div className="auth-body">
           
           <button className="auth-btn" onClick={onEnter}>
              <span className="brand-name" style={{ fontSize: '1.6rem', letterSpacing: '0.4em' }}>RESQNET</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
           </button>
        </div>
        
        <div className="auth-footer">
          Encrypted Connection • Node Online
        </div>
      </div>
    </div>
  );
}
