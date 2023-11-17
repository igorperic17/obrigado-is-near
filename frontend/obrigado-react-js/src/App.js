import logo from './assets/header-logo.png';
import access from './assets/hands.png';
import provide from './assets/wallet.png';
import mainLogo from './assets/main-logo.png';
import dargAndDrop from './assets/drag-and-drop.png';

import './App.css';
import TempContainer from './components/TempContainer/TempContainer';
import { useCallback, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
// import LearnMoreModal from './components/LearnMoreModal/LearnMoreModal';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

import { Wallet } from './near-wallet';
const CONTRACT_ADDRESS = 'obrigado.testnet';

// When creating the wallet you can optionally ask to create an access key
// Having the key enables to call non-payable methods without interrupting the user to sign
const wallet = new Wallet({ network: 'testnet' });

// Setup on page load
window.onload = async () => {
  let isSignedIn = await wallet.startUp();
  // isSignedIn ? signedInUI() : signedOutUI();
  // getGreeting();
};

function App() {
  const [isDragDropVisible, setIsDragDropVisible] = useState(false);
  // const [isLearnModalOpen, setIsLearnModalOpen] = useState(false);
  
  const onConnectWalletClick = useCallback(() => {
    if (isDragDropVisible) {
      // submit task
      wallet.startUp().then( (isSignedIn) => {
        if (!isSignedIn) return;
        wallet.callMethod({ 
          method: 'create_task', 
          contractId: CONTRACT_ADDRESS,
          args: {
            "repository_url": "https://nftstorage.link/ipfs/bafkreiciq7gn6nwyqbapau4gk4ks52574yusxytlymrmncvb6rxrpwndfu", 
            "bounty": 10
          },
          gas: "30000000000000",
          deposit: "10000000000000000000000000"
        }).then(() => {
          // TODO: replace with snackbar
          // console.log("Successfully minted new tokens to youself. You're rich!");
        }).catch((err) => {
          // console.error(err);
        }).finally(() => {
          setIsDragDropVisible(false);
        })});
    } else {
      wallet.signIn();
      setIsDragDropVisible(true);
    }
  }, [isDragDropVisible, wallet]);

  return (
    <div className="app">
      <header className="app-header">
        <img src={logo} className="app-logo" alt="logo" />
        {/* <button className="header-button" onClick={() => setIsLearnModalOpen(true)}>Learn More</button> */}
      </header>
      <div className="sub-header">
        <img src={mainLogo} className="sub-header-main" alt="Main Logo"/>
        { !isDragDropVisible && <p className='header-subtitle'>
          <span>Start earning crypto tokens for your hard work today!</span>
          <span>Join now and prosper with Web3 technology.</span>
        </p> }
        { !isDragDropVisible ?
        <div className="cards-section">
          <div className="card-access">
            <p className="card-title">Access Compute</p>
            <img src={access} className="card-image" alt="Access Compute" />
            <p className="card-description">
              Submit your compute-intensive tasks with ease on NEAR. 
              Connect with your wallet, set the bounty, and get your results! 
              Don't forget to <a href="https://near.org/" rel="Near">say obrigato</a>
            </p>
            <button className="card-button" onClick={() => onConnectWalletClick()}>Submit Task</button>
          </div>

          <div className="card-access card_m_l">
            <p className="card-title">Provide Compute & Earn</p>
            <img src={provide} className="card-image" alt="Provide Computer & Earn" />
            <p className="card-description">
              Turm your idle computing resources into earnings on Near. 
              Download and run the Task Runner to earn passive income. 
              <a href="https://near.org/" rel="Near">Obrigato Near</a>
            </p>
            <button className="card-button">Download Runner</button>
          </div>
        </div> :
        <>
          <div className="card-drag-drop">
            <div className="card-drag-drop-wrapper">
              <img src={dargAndDrop} alt="Drag and Drop"/>
              <p className="card-drag-drop-description">Drag and Drop</p>
            </div>
            <span className="card-or-label">
                or
            </span>
            <div className="card-fields">
            <Box
              component="form"
              sx={{
                '& .MuiTextField-root': { 
                  m: 1, 
                  width: '250px', 
                  borderRadius: "4px",
                  fontFamily: 'Poppins'
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#fff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#fff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff',
                  },
                }
              }}
              noValidate
              autoComplete="off"
            >
              <TextField label="Workspace URL" variant="outlined" sx={{
                  input: {
                      color: '#fff',
                  },
                  label: { color: '#fff' },
              }}/>
              <TextField label="Bounty" variant="outlined" sx={{
                  input: {
                      color: '#fff',
                  },
                  label: { color: '#fff' },
              }}/>
            </Box>
            </div>
            <CloseIcon  className="close-drag-drop" onClick={() => setIsDragDropVisible(false)}/>
          </div>
          <button className="card-drag-drop-submit" onClick={() => onConnectWalletClick()}>Submit Task</button>
        </>
        }
      </div>

      <div className="layout-wrapper">
        <div>
          <div>
            <p>Discover obrigado Tasks</p>
          </div>
        </div>

        <TempContainer></TempContainer>
      </div>

      {/* <LearnMoreModal open={isLearnModalOpen}/> */}
    </div>
  );
}

export default App;
