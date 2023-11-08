const contract = "obrigado.testnet";
const greeting = Near.view(contract, "get_tasks", {});

State.init({ tasks: [] });

const fontUrl = `https://ipfs.io/ipfs/bafkreicrs3gh7f77yhpw4xiejx35cd56jcczuhvqbwkn77g2ztkrjejopa`;

const css = `
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

.flex {
  display: flex;
  align-items: center;
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

.image-parent {
  position: relative;
  width: 100px;
  height: 100px;
  > .shadow {
    width: 80%;
    height: 80%;
    box-shadow: 0 0 32px rgba(255, 255, 255, 1) !important;
    position: absolute;
    top: 10%;
    left: 10%;
    z-index: 1;
  }
  > .eth-logo {
    z-index: 3;
    position: absolute;
    bottom: -10px;
    right: -10px;
    > img {

    width: 40px;
    height: 40px;
    }
  }
}

.image-container {
  z-index: 2;
  width: 100px;
  height: 100px;
  position: absolute;
  top: 0;
  left: 0;
 clip-path: polygon(
    0 10%,
    10% 10%,
    10% 0,
    90% 0,
    90% 10%,
    100% 10%,
    100% 90%,
    90% 90%,
    90% 100%,
    10% 100%,
    10% 90%,
    0% 90%,
    0% 10%
  );
 > img {
  height: 100%;
  object-fit: contain;
  overflow: hidden;
  background: white;
 }
}

.header {
  align-content: center;
  margin: 0 auto;
  background-color: red;
    overflow: hidden;
    height: 600px;
    filter: contrast(1.2);
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

const onBountyInputChange = ({ target }) => {
  State.update({ task_bounty: target.value });
};
const onTaskUrlInputChange = ({ target }) => {
  State.update({ task_url: target.value });
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
  // if (!state.new_greeting) {
  //   return;
  // }

  Near.call(contract, "submit_task", {
    task_url: state.task_url, 
    bounty: state.task_bounty
  });
};

// const greeting = Near.call(contract, "add_task", {});

const submitTaskComponent = (
  <>
    <div className="mb-2">
      <div className="border border-black p-3">
        <label>Task</label>
        <input className="p-2 m-2 rounded-full" placeholder="Wokspace location" onChange={onTaskUrlInputChange} />
        <input className="p-2 m-2 rounded-full" placeholder="Bounty" onChange={onBountyInputChange} />
        <button className="btn btn-primary mt-2" onClick={onSubmitTaskClick}>
          Submit
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
      <h3>Search tasks</h3>
      <p class="gray">
        Discover a range of fully decentralized frontends that leverage the
        power of BOS.
      </p>

      <div>
        {state.components && state.components.length > 0 && (
          <div class="apps">
            {state.components.map((component, i) => (
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
                            "https://bafybeicc3wlqrkisg2k7ibwss5wlusxfoq7intpgwmhcm4r7ck27fd5eym.ipfs.nftstorage.link/"
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
        )}
      </div>

      <div class="mt-5">
        <h3>Featured Apps</h3>
      </div>
      <div class="apps">
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
