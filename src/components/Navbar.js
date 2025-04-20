import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ selectedAccount, handleConnectWallet }) => {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <div>
        <Link to="/" style={{ marginRight: '1rem' }}>Send Gift</Link>
        <Link to="/claim" style={{ marginRight: '1rem' }}>Claim Gift</Link>
        <Link to="/swap">Change Gift to Money</Link>
      </div>
      <div>
        {selectedAccount ? (
          <span>Connected: {selectedAccount.meta.name} ({selectedAccount.address.substring(0, 6)}...)</span>
        ) : (
          <button onClick={handleConnectWallet}>Connect Wallet</button>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 