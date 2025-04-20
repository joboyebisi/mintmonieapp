import React, { useState, useEffect } from 'react';
import { web3FromSource } from '@polkadot/extension-dapp';
import { BN, formatBalance } from '@polkadot/util'; // Import BN and formatBalance
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';

// Function to convert amount to Planck (Polkadot's smallest unit)
const toPlanck = (amount, api) => {
  const decimals = api.registry.chainDecimals[0];
  const base = new BN(10).pow(new BN(decimals));
  const dm = new BN(amount.split('.')[1] || '0'); // Decimal part
  const id = new BN(amount.split('.')[0]); // Integer part
  const ed = dm.mul(new BN(10).pow(new BN(decimals - (dm.toString().length))));
  return id.mul(base).add(ed);
};

// Function to validate a Polkadot address
const isValidAddress = (address) => {
  try {
    encodeAddress(
      isHex(address)
        ? hexToU8a(address)
        : decodeAddress(address)
    );
    return true;
  } catch (error) {
    return false;
  }
};

const SendGift = ({ selectedAccount, api, createGift }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [claimLink, setClaimLink] = useState('');
  const [txHash, setTxHash] = useState(null);

  const handleSend = async () => {
    if (!selectedAccount || !api) {
      setStatus('Error: Wallet not connected or API not ready.');
      return;
    }
    if (!recipient || !isValidAddress(recipient)) {
      setStatus('Error: Please enter a valid Polkadot recipient address.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setStatus('Error: Please enter a positive amount.');
      return;
    }

    setIsLoading(true);
    setStatus('Preparing transaction...');
    setClaimLink('');
    setTxHash(null);

    try {
      const amountInPlanck = toPlanck(amount, api);
      const senderAddress = selectedAccount.address;
      const injector = await web3FromSource(selectedAccount.meta.source);

      setStatus('Waiting for transaction signature and confirmation...');

      const unsub = await api.tx.balances
        .transferKeepAlive(recipient, amountInPlanck)
        .signAndSend(senderAddress, { signer: injector.signer }, ({ status: txStatus, events = [], dispatchError }) => {
          console.log(`Transaction status: ${txStatus.type}`);
          setStatus(`Transaction status: ${txStatus.type}`);

          if (txStatus.isInBlock) {
            console.log(`Included in block hash ${txStatus.asInBlock}`);
            setStatus(`Transaction in block ${txStatus.asInBlock.toHex().substring(0,8)}...`);

            events.forEach(({ event: { data, method, section } }) => {
              console.log(`\tEvent: ${section}.${method}:: ${data.toString()}`);
            });

            if (dispatchError) {
              let errorMsg;
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;
                errorMsg = `${section}.${name}: ${docs.join(' ')}`;
                console.error(`Error: ${section}.${name}: ${docs.join(' ')}`);
              } else {
                errorMsg = dispatchError.toString();
                console.error(`Error: ${dispatchError.toString()}`);
              }
              setStatus(`Transaction Error: ${errorMsg}`);
              setIsLoading(false);
              unsub(); // Unsubscribe on error
            } 
          } else if (txStatus.isFinalized) {
            console.log(`Finalized block hash ${txStatus.asFinalized}`);
            setTxHash(txStatus.txHash.toHex());

            // --- Transaction Successful - Now create gift record & link --- 
            const newGift = createGift(selectedAccount, recipient, amount);
            if (newGift) {
              const generatedLink = `${window.location.origin}/claim?giftId=${newGift.id}`;
              setClaimLink(generatedLink);
              setStatus(`Gift sent successfully! Tx: ${txStatus.txHash.toHex().substring(0,8)}... Share this link:`);
            } else {
                setStatus('Transaction successful, but failed to create gift record (simulated backend).');
            }
            // --- End Gift Creation ---

            setIsLoading(false);
            unsub(); // Unsubscribe on finalization
            // Optionally reset form here
            // setRecipient('');
            // setAmount('');
          } else if (txStatus.isError || txStatus.isInvalid || txStatus.isDropped || txStatus.isUsurped) {
              setStatus(`Transaction Error: ${txStatus.type}`);
              console.error(`Transaction Error: ${txStatus.type}`);
              setIsLoading(false);
              unsub(); // Unsubscribe on error
          }
        });

    } catch (error) {
      console.error('Error preparing/sending transaction:', error);
      setStatus(`Error: ${error.message}`);
      setClaimLink('');
      setIsLoading(false);
    }
  };

  // Format balance for display if API is ready
  useEffect(() => {
    if (api) {
      formatBalance.setDefaults({ decimals: api.registry.chainDecimals[0], unit: api.registry.chainTokens[0] });
    }
  }, [api]);

  return (
    <div>
      <h2>Send DOT Gift</h2>
      {selectedAccount ? (
        <p>From: {selectedAccount.meta.name} ({selectedAccount.address.substring(0, 6)}...{selectedAccount.address.substring(selectedAccount.address.length - 4)})</p>
      ) : (
        <p>Please connect your wallet first.</p>
      )}
      <div>
        <label htmlFor="recipient">Recipient Address:</label>
        <input
          type="text"
          id="recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter Polkadot address"
          style={{ width: '400px', margin: '5px' }}
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="amount">Amount ({api ? api.registry.chainTokens[0] : 'Tokens'}):</label> 
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 1.5"
          style={{ margin: '5px' }}
          disabled={isLoading}
        />
      </div>
      <button onClick={handleSend} disabled={!selectedAccount || !api || isLoading}>
        {isLoading ? 'Processing Transaction...' : 'Send Gift & Create Link'}
      </button>
      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}
      {claimLink && (
        <p>
          <input type="text" value={claimLink} readOnly style={{ width: '400px'}} />
          <button onClick={() => navigator.clipboard.writeText(claimLink)} style={{ marginLeft: '5px' }}>Copy</button>
        </p>
      )}
      {txHash && (
          <p>Transaction Hash: <a href={`https://polkadot.subscan.io/extrinsic/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash.substring(0,8)}...{txHash.substring(txHash.length - 8)}</a></p>
      )}
    </div>
  );
};

export default SendGift; 