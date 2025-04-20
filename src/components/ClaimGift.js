import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ClaimGift = ({ selectedAccount, api, findGift, claimGiftBackend }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [giftUrl, setGiftUrl] = useState('');
  const [giftId, setGiftId] = useState(null);
  const [giftDetails, setGiftDetails] = useState(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loadGiftFromUrl = useCallback(() => {
    if (!giftUrl) {
        setStatus('Error: URL input is empty.')
        return;
    }
    setGiftDetails(null);
    setGiftId(null);
    setIsLoading(true);
    setStatus('Processing URL...');

    try {
      const url = new URL(giftUrl.startsWith('http') ? giftUrl : window.location.origin + giftUrl);
      const id = url.searchParams.get('giftId');

      if (id) {
        setGiftId(id);
        setStatus('Fetching gift details...');
        const foundGift = findGift(id);

        if (foundGift) {
          setGiftDetails(foundGift);
          if (foundGift.status === 'claimed') {
            setStatus(`Gift already claimed by ${foundGift.claimerAddress?.substring(0, 6)}... on ${new Date(foundGift.claimedAt).toLocaleString()}`);
          } else if (foundGift.status === 'pending') {
            setStatus('Gift loaded. Ready to confirm claim.');
          } else {
            setStatus(`Gift status: ${foundGift.status}`);
          }
        } else {
          setStatus('Error: Gift not found for the ID in the URL.');
        }
      } else {
        setStatus('Error: The provided URL does not contain a valid giftId parameter.');
      }
    } catch (error) {
      console.error("Error parsing URL or fetching gift:", error);
      setStatus('Error: Invalid URL format. Please paste the full gift link.');
    } finally {
      setIsLoading(false);
    }
  }, [giftUrl, findGift]);

  useEffect(() => {
      if (initialLoadDone) return;

      const idFromUrl = searchParams.get('giftId');
      if (idFromUrl) {
          console.log("Gift ID found in URL, attempting auto-load:", idFromUrl);
          const currentFullUrl = window.location.href;
          setGiftUrl(currentFullUrl);
      }
      setInitialLoadDone(true);
  }, [searchParams, initialLoadDone]);

  useEffect(() => {
      if (initialLoadDone && !giftUrl && giftId) {
          setGiftDetails(null);
          setGiftId(null);
          setStatus('');
      }
  }, [giftUrl, giftId, initialLoadDone]);

  useEffect(() => {
    if (initialLoadDone && giftUrl && searchParams.get('giftId') && !giftDetails && !isLoading) {
        loadGiftFromUrl();
    }
  }, [initialLoadDone, giftUrl, searchParams, giftDetails, isLoading, loadGiftFromUrl]);

  const handleClaim = async () => {
    if (!selectedAccount) {
      setStatus('Error: Please connect wallet to confirm claim.');
      return;
    }
    if (!giftDetails || giftDetails.status !== 'pending') {
      setStatus('Error: Gift cannot be claimed (already claimed or invalid state).');
      return;
    }

    setIsLoading(true);
    setStatus('Confirming claim...');

    try {
      const success = claimGiftBackend(giftId, selectedAccount.address);
      if (success) {
        setStatus('Claim confirmed successfully! Redirecting to Swap page...');
        const updatedGift = findGift(giftId);
        setGiftDetails(updatedGift);
        setTimeout(() => {
            navigate('/swap');
        }, 1500);
      } else {
        throw new Error('Failed to confirm claim on the backend (simulated).');
      }
    } catch (error) {
      console.error('Error confirming claim:', error);
      setStatus(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const goToSwap = () => {
    navigate('/swap');
  };

  const getStatusClass = () => {
    if (!status) return '';
    if (status.startsWith('Error:')) return 'error-message';
    if (status.includes('successfully') || status.includes('claimed by') || status.includes('Ready to confirm')) return 'success-message';
    return '';
  };

  return (
    <div>
      <h2>Claim DOT Gift</h2>

      <div className="form-group">
        <label htmlFor="giftUrl">Gift URL:</label>
        <input
          type="text"
          id="giftUrl"
          value={giftUrl}
          onChange={(e) => setGiftUrl(e.target.value)}
          placeholder="Paste the full gift link here or click the link directly..."
          style={{ width: 'calc(100% - 150px)', marginRight: '10px' }}
          disabled={isLoading && giftDetails !== null}
        />
        <button onClick={loadGiftFromUrl} disabled={!giftUrl || (isLoading && !giftDetails)}>
          {isLoading && !giftDetails ? 'Loading...' : 'Load Gift Details'}
        </button>
      </div>

      {status && <p className={`status-message ${getStatusClass()}`}>{status}</p>}

      {giftDetails && (
        <div style={{ marginTop: '1.5rem' }}>
          <p>Gift Amount: <strong>{giftDetails.amount} {api ? api.registry.chainTokens[0] : 'Tokens'}</strong></p>
          <p>Sent From: {giftDetails.senderAddress.substring(0, 6)}...{giftDetails.senderAddress.substring(giftDetails.senderAddress.length - 4)}</p>
          <hr style={{ borderTop: '1px solid rgba(0,0,0,0.1)', margin: '1rem 0' }} />

          {giftDetails.status === 'pending' && (
            <div className="claim-gift-actions">
              {selectedAccount ? (
                <>
                  <p>Claim to Account: {selectedAccount.meta.name} ({selectedAccount.address.substring(0, 6)}...{selectedAccount.address.substring(selectedAccount.address.length - 4)})</p>
                  <button onClick={handleClaim} disabled={isLoading || !selectedAccount}>
                    {isLoading ? 'Confirming...' : 'Confirm Claim & Proceed to Swap'}
                  </button>
                </>
              ) : (
                <p><strong>Please connect your wallet to confirm the claim.</strong></p>
              )}
            </div>
          )}

          {giftDetails.status === 'claimed' && (
            <div className="claim-gift-actions">
              <p>Claimed by: {giftDetails.claimerAddress?.substring(0, 6)}...{giftDetails.claimerAddress?.substring(giftDetails.claimerAddress.length - 4)}</p>
              <p>Claimed on: {new Date(giftDetails.claimedAt).toLocaleString()}</p>
              <button onClick={goToSwap}>Proceed to Swap/Withdraw</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClaimGift; 