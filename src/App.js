import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { v4 as uuidv4 } from 'uuid';
import Navbar from './components/Navbar';
import SendGift from './components/SendGift';
import ClaimGift from './components/ClaimGift';
import Swap from './components/Swap';
import './App.css';

// --- Constants ---
const POLKADOT_RPC_URL = 'wss://rpc.polkadot.io'; // Or Kusama: 'wss://kusama-rpc.polkadot.io';
const APP_NAME = 'MintMonieApp';

function App() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [api, setApi] = useState(null); // Polkadot API instance
  const [gifts, setGifts] = useState([]); // Holds our simulated gift data
  const [extensionNotFound, setExtensionNotFound] = useState(false);
  const [apiError, setApiError] = useState(null);

  // --- API Initialization ---
  useEffect(() => {
    let provider;
    let apiInstance;
    const setupApi = async () => {
      provider = new WsProvider(POLKADOT_RPC_URL);
      provider.on('error', () => {
         console.error('WS Provider error');
         setApiError('Could not connect to the Polkadot network WebSocket.');
         setApi(null);
      });
      try {
        apiInstance = await ApiPromise.create({ provider });
        await apiInstance.isReady;
        setApi(apiInstance);
        setApiError(null);
        console.log('Polkadot API initialized');
      } catch (error) {
        console.error("Error initializing Polkadot API:", error);
        setApiError(`Error initializing Polkadot API: ${error.message}`);
        setApi(null);
      }
    };
    setupApi();

    return () => {
      // Check if apiInstance exists before disconnecting
      apiInstance?.disconnect();
    };
    // Added api to dependency array is not correct here as it causes infinite loop
    // This effect should run only once to set up the API connection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep dependencies empty to run only once

  // --- Wallet Connection ---
  const handleConnectWallet = async () => {
    setExtensionNotFound(false);
    try {
      const extensions = await web3Enable(APP_NAME);
      if (extensions.length === 0) {
        console.log('Polkadot{.js} extension not found.');
        setExtensionNotFound(true);
        setAccounts([]);
        setSelectedAccount(null);
        return;
      }
      const allAccounts = await web3Accounts();
      setAccounts(allAccounts);
      if (allAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(allAccounts[0]); // Auto-select first if none selected
      } else if (allAccounts.length === 0) {
          setSelectedAccount(null); // Ensure no account selected if none available
          console.log('No accounts found/authorized in extension.');
          // Optional: alert user
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert(`Error connecting wallet: ${error.message}`);
    }
  };

  // --- Gift Management (Simulated Backend) ---
  const createGift = (sender, recipient, amount) => {
    const giftId = uuidv4(); // Generate unique ID
    const newGift = {
      id: giftId,
      senderAddress: sender.address,
      recipientAddress: recipient, // The address entered by the sender
      amount: amount, // Store amount as string from input for now
      status: 'pending', // pending, claimed, failed
      createdAt: new Date().toISOString(),
      // In a real backend, we'd also store the actual transaction hash here
      // txHash: null 
    };
    setGifts(prevGifts => [...prevGifts, newGift]);
    console.log("Created Gift (simulated):", newGift);
    return newGift; // Return the created gift object (contains the ID)
  };

  const findGift = (giftId) => {
    return gifts.find(gift => gift.id === giftId);
  };

  const claimGiftBackend = (giftId, claimerAddress) => {
    let claimed = false;
    setGifts(prevGifts =>
      prevGifts.map(gift => {
        if (gift.id === giftId && gift.status === 'pending') {
           // In a real backend, we would now initiate the actual transfer
           // from the sender/escrow to the claimerAddress if needed
           // and verify the claimerAddress matches the intended recipient (if specified)
          console.log(`Marking gift ${giftId} as claimed by ${claimerAddress} (simulated)`);
          claimed = true;
          return { ...gift, status: 'claimed', claimedAt: new Date().toISOString(), claimerAddress: claimerAddress };
        }
        return gift;
      })
    );
    // Simulate success/failure
    return claimed;
  };

  // Handler for account selection change
  const handleAccountChange = (event) => {
      const selectedAddress = event.target.value;
      const account = accounts.find(acc => acc.address === selectedAddress);
      setSelectedAccount(account || null);
  };

  // --- Rendering ---
  return (
    <Router>
      {/* New container for heading + app card */}
      <div className="App-container">
        <h1 className="main-heading">MintMonie</h1>
        
        <div className="App"> {/* Original App div now acts as the card */}
            <Navbar selectedAccount={selectedAccount} handleConnectWallet={handleConnectWallet} accounts={accounts} />

            {/* Display API Errors */}
            {apiError && (
                <div className="status-message error-message" role="alert">
                    API Connection Error: {apiError}
                </div>
            )}

            {/* Display if extension not found */}
            {extensionNotFound && (
                <div className="status-message error-message" role="alert">
                    Polkadot{'{.js}'} extension not found. Please install it from <a href="https://polkadot.js.org/extension/" target="_blank" rel="noopener noreferrer" style={{color: '#fcc'}}>polkadot.js.org/extension</a> and refresh the page.
                </div>
            )}

            {/* Account Selector Dropdown */}
            {accounts.length > 1 && selectedAccount && (
                <div className="account-selector">
                    <label htmlFor="account-select">Switch Account:</label>
                    <select id="account-select" value={selectedAccount.address} onChange={handleAccountChange}>
                    {accounts.map(account => (
                        <option key={account.address} value={account.address}>
                        {account.meta.name} ({account.address.substring(0, 6)}...{account.address.substring(account.address.length - 4)})
                        </option>
                    ))}
                    </select>
                </div>
            )}

            <main role="main">
                <div> 
                    <Routes>
                        <Route
                            path="/"
                            element={<SendGift
                                        selectedAccount={selectedAccount}
                                        api={api}
                                        createGift={createGift}
                                    />}
                        />
                        <Route
                            path="/claim"
                            element={<ClaimGift
                                        selectedAccount={selectedAccount}
                                        api={api}
                                        findGift={findGift}
                                        claimGiftBackend={claimGiftBackend}
                                    />}
                        />
                        <Route
                            path="/swap"
                            element={<Swap selectedAccount={selectedAccount} api={api} />} />
                    </Routes>
                </div>
            </main>
        </div> {/* End of App card div */} 
      </div> {/* End of App-container div */} 
    </Router>
  );
}

export default App;
