# MintMonie

MintMonie is a web application designed to simplify the process of sending Polkadot (DOT) cryptocurrency as gifts. Users can connect their Polkadot wallet, specify a recipient address and amount, send the DOT gift securely using native blockchain features, and generate a unique claim link for the recipient.

## Live Demo

Check out the live deployment on Vercel:
**[https://mintmonieapp-avjnquaye-job-oyebisis-projects.vercel.app/](https://mintmonieapp-avjnquaye-job-oyebisis-projects.vercel.app/)**

## Features

*   **Connect Wallet:** Integrates with the Polkadot{.js} browser extension (and compatible extensions like Talisman) to allow users to connect their Polkadot accounts.
*   **Send DOT Gifts:** Facilitates sending DOT using the native `balances.transferKeepAlive` extrinsic, ensuring recipient accounts meet the existential deposit requirements.
*   **Generate Gift Link:** Creates a unique URL containing a gift ID after a successful transaction.
*   **Claim Gifts:** Allows recipients to use the unique gift link to view gift details and confirm the claim (currently simulated via application state).
*   **Swap Placeholder:** Includes a dedicated section as a placeholder for future integration with services like SpaceWalk for DOT-to-USDC swaps.
*   **Themed UI:** Styled with a dark theme inspired by the Polkadot ecosystem aesthetic.

## How It Works (Technical Overview)

*   **Frontend:** Built with **React** using `create-react-app`. **React Router** handles navigation between Send, Claim, and Swap pages.
*   **Wallet Interaction:** Uses **`@polkadot/extension-dapp`** to detect installed Polkadot browser extensions, request user authorization, retrieve accounts, and access the extension's signer object for secure transaction signing (private keys never leave the user's extension).
*   **Blockchain Interaction:** Leverages **`@polkadot/api`** to:
    *   Connect to a public Polkadot RPC node via WebSocket.
    *   Construct a native `balances.transferKeepAlive` transaction. This method is preferred over `transfer` as it prevents accidentally reaping (deactivating) recipient accounts that might fall below the existential deposit after the transfer.
    *   Send the signed transaction to the network and track its status in real-time (e.g., `isInBlock`, `isFinalized`).
    *   Use chain metadata (`api.registry`) for details like token decimals and symbols.
*   **Gift Link/Claiming:**
    *   Upon successful finalization of the transfer, a unique gift ID is generated (using `uuid`).
    *   This ID is stored in the React application's state (simulating a simple backend database for this demo).
    *   A claim link (`/claim?giftId=...`) is generated.
    *   The Claim page reads the `giftId` from the URL (either automatically on load or via manual paste), fetches the details from the application state, and allows the user to "confirm" the claim (updating the local state).
*   **No Custom Smart Contracts:** The core DOT transfer functionality relies entirely on the Polkadot network's native `balances` pallet, not on custom-deployed smart contracts.
## How It Works (For Users)

Using MintMonie to send Polkadot gifts is simple:

1.  **Connect Your Wallet:**
    *   Click the "Connect Wallet" button.
    *   Your Polkadot{.js} browser extension (or similar compatible wallet like Talisman) will pop up, asking you to approve the connection. Your funds and private keys always stay safe within your extension.
    *   Select the account you want to send the gift from. The app can now see your selected account address but cannot perform actions without your explicit approval for each transaction.

2.  **Send a DOT Gift:**
    *   Navigate to the "Send Gift" page.
    *   Enter the recipient's Polkadot address (make sure it's correct!).
    *   Enter the amount of DOT you wish to send as a gift.
    *   Click "Send Gift & Create Link".![MintMonie 2](https://github.com/user-attachments/assets/838fae93-dd86-43a2-84e4-9869c5ae9e45)

    *   Your wallet extension will pop up again, sho![MintMonie 1](https://github.com/user-attachments/assets/8a765926-05e6-4d08-a08d-bf4f66d7bc24)
wing the transaction details and asking you to confirm and sign the transaction with your password.
    *   Once the transaction is confirmed on the blockchain (usually takes a few seconds), the app will display a unique **Gift Link**.

3.  **Share the Gift Link:**
    *   Copy the generated Gift Link

    *   Share this link with your friend or family member through any messaging app, email, etc.

4.  **Recipient Claims the Gift:**
    *   The recipient clicks the special Gift Link you shared.
    *   This takes them to the "Claim Gift" page in the MintMonie app, which automatically loads the gift details from the link.
    *   They will need to connect their *own* Polkadot wallet.
    *   They can then see the gift details and click "Confirm Claim & Proceed to Swap". This currently marks the gift as claimed in the app's tracking and prepares them for the next step. *(Note: The actual DOT was already sent in Step 2; this step acknow![MintMonie 3](https://github.com/user-attachments/assets/c6300a10-5c83-45bb-b07c-061120152345)
ledges receipt).*

5.  **(Future) Swap & Withdraw:**
    *   After confirming the claim, the user is redirected to the "Swap" page.
    *   *(Planned Feature)* This page will allow the user to swap the received DOT for a stablecoin like USDC using integrations like SpaceWalk.
    *   *(Planned Feature)* Following the swap, further in![MintMonie 4](https://github.com/user-attachments/assets/e8b6194e-9b46-4d1d-85b1-9139be1a20cf)
tegration (e.g., with MoneyGram via SpaceWalk/Pendulum) would allow withdrawing the value.
## Tech Stack

*   **Frontend:**
    *   React (v18+)
    *   React Router (`react-router-dom`)
    *   CSS3 (via `App.css`)
    *   JavaScript (ES6+)
*   **Polkadot Interaction:**
    *   `@polkadot/api`
    *   `@polkadot/extension-dapp`
    *   `@polkadot/util` (for BN.js, formatting)
    *   `@polkadot/keyring` (for address validation)
*   **Utilities:**
    *   `uuid`

## Getting Started (Local Development)

Follow these instructions to set up and run the project locally.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v16 or later recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js) or [Yarn](https://yarnpkg.com/)
*   [Git](https://git-scm.com/)
*   [Polkadot{.js} Browser Extension](https://polkadot.js.org/extension/) (or a compatible extension like Talisman) installed and set up with an account funded on the Polkadot network.

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/joboyebisi/mintmonieapp.git
    ```
    *(Note: Use the correct repository URL if it differs)*

2.  **Navigate to the project directory:**
    ```bash
    cd mintmonieapp
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```
    *(or `yarn install`)*

4.  **Start the development server:**
    ```bash
    npm start
    ```
    *(or `yarn start`)*

5.  **Open the app:**
    The application should automatically open in your default browser at `http://localhost:3000`. If not, navigate to that URL manually.

## Deployment

This application is deployed to Vercel. The deployment is configured to automatically update when changes are pushed to the `main` branch of the linked GitHub repository (`joboyebisi/mintmonieapp`).

*   **Live URL:** [https://mintmonieapp-avjnquaye-job-oyebisis-projects.vercel.app/](https://mintmonieapp-avjnquaye-job-oyebisis-projects.vercel.app/)

## Future Improvements / TODOs

*   Integrate with SpaceWalk/Pendulum for DOT -> USDC swaps.
*   Implement MoneyGram withdrawal functionality (requires specific API/integration details).
*   Replace simulated gift tracking state with a proper backend database or on-chain storage solution.
*   Enhance UI/UX with better loading indicators, detailed transaction progress, and more comprehensive error handling.
*   Add support for other wallets (e.g., WalletConnect).
*   Implement unit and integration tests.

## License

*(Optional: Add license information here, e.g., MIT License)*
