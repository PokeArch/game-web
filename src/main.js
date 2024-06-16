import { SigningArchwayClient } from '@archwayhq/arch3.js';
import BigNumber from 'bignumber.js';
import ChainInfo from './constantine.config.js';
import { coin } from "@cosmjs/stargate";

const REGISTRY_CONTRACT = "archway1lr8rstt40s697hqpedv2nvt27f4cuccqwvly9gnvuszxmcevrlns60xw4r";

window.config = async () => {
    const chainId = ChainInfo.chainId;

    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);
    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);
    try {
      let entrypoint = {
        config: {}
      };
      let query = await signingClient.queryContractSmart(
        REGISTRY_CONTRACT,
        entrypoint
      );
      return query;
    } catch(e) {
      return {error: e};
    }
  }

// Calculate registration cost for 1, 2 or 3 year domain lifetimes
window.registrationCost = async (years = 1) =>{
    if (typeof years !== 'number') years = 1;
    if (years < 1) years = 1;
    if (years > 3) years = 3;
    const config = await window.config();
    // `base_cost` is a value in `aarch` (mainnet) or `aconst` (testnet) 
    // it's stored in the registry contract as a string
    let base_cost = Number(config.base_cost);
    // Calculate registration cost
    let registration_cost = base_cost * years;
    return parseInt(registration_cost);
}

window.onload = async () => {
    if (!window.getOfflineSignerAuto || !window.keplr) {
        alert("Please install keplr extension");
    } else {
        if (window.keplr.experimentalSuggestChain) {
            try {
                await window.keplr.experimentalSuggestChain(ChainInfo);

                window.keplr.defaultOptions = {
                    sign: {
                        preferNoSetFee: true,
                    }
                }
                await window.getNames()
                alert(await window.registerName("pokearch"))
            } catch(error) {
                alert(error)
                alert("Failed to suggest the chain");
            }
        } else {
            alert("Please use the recent version of keplr extension");
        }
    }
};

window.getNames = async () => {
    const chainId = ChainInfo.chainId;

    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);
    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);
    const accounts = await offlineSigner.getAccounts();

    try {
        let entrypoint = {
            resolve_address: {
                address: accounts[0].address
            }
        };
        let query = await signingClient.queryContractSmart(
            REGISTRY_CONTRACT,
            entrypoint
        );
        alert(query.names[0]);
        return query.names
    } catch(e) {
        alert(e)
        return error
    }
}

window.registerName = async (name, expiration) => {
    const chainId = ChainInfo.chainId;

    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

    let cost = await window.registrationCost(expiration); // 2 year registration
    // Convert cost to aarch (mainnet) or aconst (testnet)
    console.log(cost)
    let funds = [coin(String(cost), "aconst")];

    try {
        let entrypoint = {
          resolve_record: {
            name: name+".arch"
          }
        };
        let query = await signingClient.queryContractSmart(
          REGISTRY_CONTRACT,
          entrypoint
        );
        console.log(query)
        if (query.address === accounts[0].address) {
            return true
        }
        return false
      } catch(e) {
        console.log(e)
        try {
            let entrypoint = {
                register: {
                    name: name
                }
            };
            
            // Broadcast tx
            let tx = await signingClient.execute(
                accounts[0].address,
                REGISTRY_CONTRACT,
                entrypoint,
                "auto",
                "Registering domain", // Memo
                funds
            );
            // Tx result
            return true;
        } catch (err) {
            console.log(err)
            return false;
        }
      }
}


// document.sendForm.onsubmit = () => {
//     (async () => {
//         const chainId = ChainInfo.chainId;

//         await window.keplr.enable(chainId);

//         const offlineSigner = window.getOfflineSigner(chainId);
//         const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

//         const accounts = await offlineSigner.getAccounts();
//         const destinationAddress = document.sendForm.recipient.value;

//         let amount = new BigNumber(document.sendForm.amount.value);
//         amount = amount.multipliedBy(new BigNumber('1e18'));

//         const amountFinal = {
//             denom: 'aconst',
//             amount: amount.toString(),
//         }

//         const memo = "Transfer token to another account";

//         const broadcastResult = await signingClient.sendTokens(
//             accounts[0].address,
//             destinationAddress,
//             [amountFinal],
//             "auto",
//             memo,
//         );

//         if (broadcastResult.code !== undefined &&
//             broadcastResult.code !== 0) {
//             alert("Failed to send tx: " + broadcastResult.log || broadcastResult.rawLog);
//         } else {
//             alert("Succeed to send tx:" + broadcastResult.transactionHash);
//         }
//     })();

//     return false;
// };