import React from 'react';
import './auth.css';
import logo from '../../asset/npedu-logo-1.png';

const AuthLayout = ({ children }) => {
    return (
        <div className="auth-page">
            {/* Floating star decorations */}
            <span className="auth-star">⭐</span>
            <span className="auth-star">✨</span>
            <span className="auth-star">⭐</span>
            <span className="auth-star">✨</span>
            <span className="auth-star">⭐</span>

            {/* Left panel: logo + form */}
            <div className="auth-left">
                {/* Logo */}
                <div className="auth-logo" style={{ marginBottom: '2rem' }}>
                    <img src={logo} alt="NP Education" style={{ height: '60px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                </div>

                {/* Form content injected here */}
                {children}
            </div>

            {/* Right panel: decorations */}
            <div className="auth-right">
                <div className="auth-deco">
                    <div className="auth-trophy">🏆</div>
                    <div className="auth-deco-stars">⭐ ⭐ ⭐ ⭐ ⭐</div>
                    <div className="auth-deco-text">Chào mừng bạn đến với<br />NP Education</div>
                </div>

                {/* Ribbon SVG */}
                <div className="auth-ribbon">
                    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
                        <path d="M200 0 Q160 30 180 60 Q200 90 160 120 L200 120 Z"
                            fill="rgba(255,220,50,0.5)" />
                        <path d="M200 0 Q170 40 190 70 Q210 100 180 120 L200 120 Z"
                            fill="rgba(255,220,50,0.3)" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;