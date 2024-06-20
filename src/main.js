import { SigningArchwayClient } from '@archwayhq/arch3.js';
import BigNumber from 'bignumber.js';
import ChainInfo from './constantine.config.js';
import { coin } from "@cosmjs/stargate";

const REGISTRY_CONTRACT = "archway1lr8rstt40s697hqpedv2nvt27f4cuccqwvly9gnvuszxmcevrlns60xw4r";
const POKE_ARCH_CONTRACT = "archway1mg4wqfx7546d46ddss8tajkhscwc5dhrud494ct99zpusp9qqunssrgezp";
const NFT_CONTRACT = "archway19qhzpargg63xmdm0p3tt33u8f2t9t48hawddaz6a2kszvm0ekdrqu4udts";

const token_uri = "https://rose-melodic-felidae-510.mypinata.cloud/ipfs/Qmb6b429x7p2toSzmMZuQQ4823qQmxLLJeKzQGhkYsmD5J/"
const pokemon_list = ["bulbasaur", "mewtwo", "charmander", "pikachu", "squirtle", "hypno"]

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
    // console.log(await window.Godot())
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
            } catch(error) {
                alert(error)
                alert("Failed to suggest the chain");
            }
        } else {
            alert("Please use the recent version of keplr extension");
        }
    }
};

window.godotFunctions = {};
window.externalator = {
    addGodotFunction: (n,f) => {
        window.godotFunctions[n] = f;
    }
}

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
        query.names.map(name => {
            window.godotFunctions.renderName(name)
        }) 
    } catch(e) {
        return error
    }
}

// estimate cost and register name if it doesn't exist
window.registerName = async (name, expiration) => {
    const chainId = ChainInfo.chainId;
    console.log(name)
    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

    let cost = await window.registrationCost(expiration);
    // Convert cost to aarch (mainnet) or aconst (testnet)
    console.log(cost)
    let funds = [coin(String(cost), "aconst")];

    try {
        let entrypoint = {
          resolve_record: {
            name: name
          }
        };
        let query = await signingClient.queryContractSmart(
          REGISTRY_CONTRACT,
          entrypoint
        );
        console.log(query)
        if (query.address === accounts[0].address) {
            window.godotFunctions.continue("true")
            return
        }
        alert("Name not available")
      } catch(e) {
        console.log(e)
        try {
            let entrypoint = {
                register: {
                    name: name.split(".")[0]
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
            window.godotFunctions.continue("true")
            return
        } catch (err) {
            console.log(err)
            return;
        }
      }
}

window.register = async (id) => {
    console.log(id)
    var name = id.split("_").join(".")
    console.log(name)
    const chainId = ChainInfo.chainId;

    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

    let entrypoint = {
        check_allowance: {
            addr: accounts[0].address
        }
    };
    
    // Broadcast tx
    let allowed = await signingClient.queryContractSmart(
        POKE_ARCH_CONTRACT,
        entrypoint,
    );
    // if (!allowed) {
    //     console.log(accounts[0].address)
    //     entrypoint = {
    //         add_allowance: {
    //             addr: accounts[0].address
    //         }
    //     }
    //     let tx = await signingClient.execute(
    //         accounts[0].address,
    //         POKE_ARCH_CONTRACT,
    //         entrypoint,
    //         "auto",
    //         "Registering", // Memo
    //     );
    // }
    entrypoint = {
        get_player: {
            id: name
        }
    };
    try {
        let q = await signingClient.queryContractSmart(
            POKE_ARCH_CONTRACT,
            entrypoint,
        );
        console.log(q)
        window.godotFunctions.register("false")
        await Promise.all(q.player.pokemons.map(async pokemon => {
            entrypoint = {
                nft_info: {
                    token_id: pokemon["token_id"].toString()
                }
            };
            let nftData = await signingClient.queryContractSmart(
                NFT_CONTRACT,
                entrypoint,
            );
            console.log(nftData)
            const data = await fetch(nftData.token_uri.replace(/^htps:/, 'https:'))
            const jsonData = await data.json()
            console.log(jsonData)
            window.godotFunctions.addPokemon(jsonData["name"], pokemon["health"], pokemon["index"])
        }))
    } catch(e) {
        console.log("error")
        console.log(e)
        try {
            let entrypoint = {
                register: {
                id: name
                }
            };
    
            const msgExecuteContract = {
                typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
                value: {
                    sender: accounts[0].address,
                    contract: POKE_ARCH_CONTRACT,
                    msg: new TextEncoder().encode(JSON.stringify(entrypoint)),
                    funds: [], // Optionally specify funds to send with the message
                },
            };
            const fee = await signingClient.calculateFee(accounts[0].address, [msgExecuteContract], '', 1.5);
            
            const broadcastResult = await signingClient.signAndBroadcast(accounts[0].address, [msgExecuteContract], fee);
            console.log(broadcastResult)
            window.godotFunctions.register("true")
        } catch (e) {
            console.log(e)
        }
    }

}

window.catch = async (id, pokemon, health, curr_pokemon) => {
    console.log(id, pokemon, health, curr_pokemon)
    var name = id.split("_").join(".")
    const chainId = ChainInfo.chainId;

    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

    let entrypoint = {
        catch_pokemon: {
            id: name,
            token_uri: token_uri + pokemon.toLocaleLowerCase() + ".json",
            health: parseInt(health),
            curr_pokemon: parseInt(curr_pokemon)
        }
    };
    console.log(entrypoint)
    const msgExecuteContract = {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: {
            sender: accounts[0].address,
            contract: POKE_ARCH_CONTRACT,
            msg: new TextEncoder().encode(JSON.stringify(entrypoint)),
            funds: [], // Optionally specify funds to send with the message
        },
    };
    // const fee = await signingClient.calculateFee(accounts[0].address, [msgExecuteContract], '', 1.5);
    // console.log(fee)
    // Broadcast tx
    let amount = new BigNumber("0.42");
    amount = amount.multipliedBy(new BigNumber('1e18'));
    // let tx = await signingClient.execute(
    //     accounts[0].address,
    //     POKE_ARCH_CONTRACT,
    //     {
    //         amount: [{
    //             denom: "aconst",
    //             amount: amount.toString()
    //         }],
    //         gas: amount.toString()
    //     },
    //     "Catching Pokemon", // Memo
    // );
    const broadcastResult = await signingClient.signAndBroadcast(accounts[0].address, [msgExecuteContract], {
        amount: [{
            denom: "uconst",
            amount: "3000000"
        }],
        gas: "3000000"
    });

}

window.setDefault = async (name, pokemon) => {
    const chainId = ChainInfo.chainId;

    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

    let entrypoint = {
        set_default_pokemon: {
            id: name.split("_").join("."),
            pokemon: pokemon_list.indexOf(pokemon.toLocaleLowerCase())
        }
    };
    
    // Broadcast tx
    let tx = await signingClient.execute(
        accounts[0].address,
        POKE_ARCH_CONTRACT,
        entrypoint,
        "auto",
        "Changing Default Pokemon", // Memo
    );
}

window.battle = async (name) => {
    const chainId = ChainInfo.chainId;

    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

    let entrypoint = {
        get_player: {
            id: name,
        }
    };
    
    let query = await signingClient.queryContractSmart(
        POKE_ARCH_CONTRACT,
        entrypoint,
    );

    window.godotFunctions.startBattle(pokemon_list[query.player.default_pokemon].charAt(0).toUpperCase() + pokemon_list[query.player.default_pokemon].slice(1))
}

window.updateHealth = async (name, pokemon) => {
    const chainId = ChainInfo.chainId;

    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

    let entrypoint = {
        update_health: {
            id: name,
            token_id: pokemon
        }
    };
    
    // Broadcast tx
    let tx = await signingClient.execute(
        accounts[0].address,
        POKE_ARCH_CONTRACT,
        entrypoint,
        "auto",
        "Updating health", // Memo
    );
}

window.collectBerries = async (name) => {
    const chainId = ChainInfo.chainId;

    await window.keplr.enable(chainId);

    const offlineSigner = window.getOfflineSigner(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

    let entrypoint = {
        collect_berries: {
            id: name
        }
    };
    
    // Broadcast tx
    let tx = await signingClient.execute(
        accounts[0].address,
        POKE_ARCH_CONTRACT,
        entrypoint,
        "auto",
        "Collecting berries", // Memo
    );
}