const contract = "obrigado.testnet";
// const tasks = Near.view(contract, "get_tasks_from_queue", {})

const fontUrl = `https://ipfs.io/ipfs/bafkreicrs3gh7f77yhpw4xiejx35cd56jcczuhvqbwkn77g2ztkrjejopa`;

const css = `

body {
  display: inline-block;
}

@font-face {
    font-family: "Pixter";
    src: url("${fontUrl}");
}

a, a:focus, a:visited, a:hover {
  color: white !important;
}

.apps {
  margin-top: 32px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.flex-right {
  padding-left: 16px;
  > p {
    margin-bottom: 2px;
  }
  > .subtle {
    font-size: 0.8rem;
  }
}
.gray {
  color: #888 !important;
}

.header {
  align-content: center;
  flex: 1;
  margin: 100px auto auto auto;
    overflow: hidden;
    height: 600px;
    background-image: url('https://bafybeicc3wlqrkisg2k7ibwss5wlusxfoq7intpgwmhcm4r7ck27fd5eym.ipfs.nftstorage.link/');
    background-size: cover;
    > div {
        padding: 32px;
        h1 {
        font-size: 3rem;
        }
        h2 {
            color: #ddd;
        }
        > div {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
        }
    }
}

.logo {
    width: 350px;
    margin: 200px auto auto auto;
    height: 80px;
}

 .main {
     padding: 32px;
     p {
         color: #ddd;
     }
 }

 footer {
  padding-top: 2rem;
  height: 2rem;
}

footer a, span {
  color: rgba(255, 255, 255, 0.2);
}


@media only screen and (max-width: 700px) {
  .header {
    flex-direction: column;
  }
  .header-left {
    transform: skew(0);
  }
  .header-left, .header-right {
    width: 100%;
    margin-left: 0;
    border: none;
  }
  .header-content-right {
    top: 260px;
  }
  .noise {
    height: 520px;
  }
}
`;

if (!state.theme) {
  State.update({
    theme: styled.div`
    font-family: Pixter;
    background: black;
    color: white;
    ${css}
`,
  });
}
const Theme = state.theme;

// const featured = [
//   {
//     widgetSrc: "mm-near.near/widget/zkSyncExp",
//     accountId: "mm-near.near",
//     widgetName: "zkSyncExp",
//     alt: "zkSyncExp",
//   },
// ];
const featured = [];

State.init({ tasks: [], task_bounty: Number(10), task_url: ""});

const onBountyInputChange = ({ target }) => {
  State.update({ task_bounty: Number(target.value) });
};
const onTaskUrlInputChange = ({ target }) => {
  State.update({ task_url: target.value });
  console.log(tasks)
};

// const onBtnClick = () => {
//   if (!state.new_greeting) {
//     return;
//   }

//   Near.call(contract, "set_greeting", {
//     greeting: state.new_greeting,
//   });
// };

const onSubmitTaskClick = () => {
  Near.call(contract, "create_task", {
    repository_url: state.task_url, 
    bounty: state.task_bounty
  },
  30000000000000,
  1000000000000000000000000); 
};

const onClearQueueClick = () => {
  Near.call(contract, "clear_queue", {});
};
const onRefreshQueueClick = () => {
  const res = Near.view(contract, "get_tasks_from_queue", {});
  console.log(res);
  State.update({ tasks: res });
};


// const greeting = Near.call(contract, "add_task", {});

const submitTaskComponent = (
  <>
    <div className="mb-2 center flex">
      <div className="border border-black p-3">
        <label>Task</label>
        <input className="p-2 m-2 rounded-full" placeholder="Wokspace location" onChange={onTaskUrlInputChange} value={state.task_url}/>
        <input className="p-2 m-2 rounded-full" placeholder="Bounty" onChange={onBountyInputChange} value={state.bounty}/>
        <button className="btn btn-primary mt-2" onClick={onSubmitTaskClick}>
          Submit
        </button>
        <button className="btn btn-primary mt-2" onClick={onClearQueueClick}>
          Clear Queue
        </button>
      </div>
    </div>
  </>
);

const notLoggedInWarning = () => {
  return (<>
    <button class="btn btn-primary mt-2" onClick={onBtnClick}>
      Connect wallet
    </button>
  </>);
};

return (
  <Theme>
    <div class="header">
      <img
        class="logo"
        src="https://bafkreidsq3r5xof4umfa5mmsfem2kmsfh2nyxo22e5kj7bsqtr6pl3zdke.ipfs.nftstorage.link/"
      />
      <p>
        Start earning crypto tokens for your hard work today! Join now and
        prosper with Web3 technology.
      </p>
      {context.accountId ? submitTaskComponent : notLoggedInWarning}
    </div>

    <div class="main">
      {/* <h3>Search tasks</h3>
      <p class="gray">
        Discover a range of fully decentralized frontends that leverage the
        power of BOS.
      </p> */}

      <div class="mt-5">
        <h3>Task Queue</h3>
      </div>
      <div class="apps">

      <button className="btn btn-primary mt-2" onClick={onRefreshQueueClick}>
          Refresh Task Queue
        </button>
        {featured.map((component, i) => (
          <div key={i} class="widget">
            <div class="flex">
              <a href={`#/${component.widgetSrc}`} target="_blank">
                <div class="image-parent">
                  <Widget
                    src="mob.near/widget/WidgetImage"
                    props={{
                      accountId: component.accountId,
                      widgetName: component.widgetName,
                      alt: component.widgetName,
                      className,
                      style: {},
                      fallbackUrl:
                        "https://ipfs.near.social/ipfs/bafkreido7gsk4dlb63z3s5yirkkgrjs2nmyar5bxyet66chakt2h5jve6e",
                    }}
                  />
                  <div class="shadow"></div>
                  <div class="eth-logo">
                    <img
                      src={
                        "https://ipfs.near.social/ipfs/bafkreibkkypb3zybzlwfotwa6tdmelalfnfucmvgzzeqwge4e75mkpq6dq"
                      }
                    />
                  </div>
                </div>
              </a>
              <div class="flex-right">
                <p>{component.widgetName}</p>
                <p class="subtle gray">Ethereum</p>
              </div>
            </div>
            <p>{component.description}</p>

            <a
              href={`#/mob.near/widget/WidgetSource?src=${component.widgetSrc}`}
              target="_blank"
            >
              <i className="bi bi-file-earmark-code me-1"></i>Source
            </a>
          </div>
        ))}
      </div>
    </div>

    <div class="footer">
      <div className="text-center">
        <a href="/#/thebos.near/widget/Terms">Terms of Use</a> <span>|</span>{" "}
        <a href="/#/thebos.near/widget/Privacy">Privacy Policy</a>
      </div>
    </div>
  </Theme>
);
