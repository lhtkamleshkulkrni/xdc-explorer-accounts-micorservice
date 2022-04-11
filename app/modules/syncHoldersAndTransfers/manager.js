import TokenHolderModel from "../../models/TokenHolder";
import TransferTokenModel from "../../models/Transfer";
import ContractModel from "../../models/Contract";
const moment = require("moment");
import Utils from "../../utils";
import HttpService from "../../service/http-service";
import {httpConstants} from "../../common/constants";
import Web3 from "web3";

export default class SyncManager {
    updateTokenHoldersAndTokenTransfersForXRC20 = async () => {

        try{

            let tokenDetailsUrlDummy = "https://explorer.xinfin.network/api/tokens?page=1&limit=20&type=xrc20";

            let tokenDetailsResponseDummy = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrlDummy, '')

            let evalTokenDetailsResponseDummy = (tokenDetailsResponseDummy && (typeof tokenDetailsResponseDummy === 'string') && (tokenDetailsResponseDummy !== "") ) ? JSON.parse(tokenDetailsResponseDummy) : tokenDetailsResponseDummy;

            if(typeof evalTokenDetailsResponseDummy !== 'object'){
                return;
            }

            let totalPagesForTokens = evalTokenDetailsResponseDummy.pages;


            for(let y=0; y<totalPagesForTokens; y++){ //the loop needs to be called totalPagesForTokens times


                let tokenDetailsUrl = "https://explorer.xinfin.network/api/tokens?page=" + y+1 + "&limit=20&type=xrc20";

                let tokenDetailsResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrl, '')

                let evalTokenDetailsResponse;

                try{
                    evalTokenDetailsResponse = (tokenDetailsResponse && (typeof tokenDetailsResponse === 'string') && (tokenDetailsResponse !== "")) ? JSON.parse(tokenDetailsResponse) : tokenDetailsResponse;
                }
                catch(err){
                    break;
                }

                if(typeof evalTokenDetailsResponse !== 'object'){
                    break;
                }

                if(evalTokenDetailsResponse && evalTokenDetailsResponse.items && evalTokenDetailsResponse.items.length > 0){


                    console.log("tokenDetailsResponse =-=-=-==-", evalTokenDetailsResponse.items.length);

                    let numberOfTokens = evalTokenDetailsResponse.items.length;

                    let tokensArr = evalTokenDetailsResponse.items;

                    // let tokenHolderObjArray = [];

                    for(let i = 14; i < numberOfTokens; i++){  // i < numberOfTokens (number of tokens for which the details are fetched in 'tokenDetailsResponse')

                        //the loop starting from "WTK" token

                        await this.checkToken(tokensArr[i]);

                        let numberOfHolderApiCalls = (tokensArr[i].holderCount)/50;

                        for(let x = 1; x <= numberOfHolderApiCalls; x++){


                            let holderDataUrl = "https://xdc.blocksscan.io/api/token-holders?address=" + tokensArr[i].hash + "&page=" + x + "&limit=50"

                            let holderDetailsResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, holderDataUrl, '') //this api shpuld be called here in a loop for tokensArr[i].holderCount/50 times

                            let evalHolderDetailsResponse;

                            try{
                                evalHolderDetailsResponse = (holderDetailsResponse && (typeof holderDetailsResponse === 'string') && (holderDetailsResponse !== "")) ? JSON.parse(holderDetailsResponse) : holderDetailsResponse;
                            }
                            catch(err){
                                break;
                            }

                            if(typeof evalHolderDetailsResponse !== 'object'){
                                break;
                            }

                            if(evalHolderDetailsResponse && evalHolderDetailsResponse.items && evalHolderDetailsResponse.items.length > 0){


                                let holdersArr = evalHolderDetailsResponse.items;
                                let holdersCount = evalHolderDetailsResponse.items.length;

                                for(let j=0; j<holdersCount; j++){

                                    let tokenHolderObj = {
                                        "tokenContract": tokensArr[i].hash,
                                        "address": holdersArr[j].hash,
                                        "decimals": tokensArr[i].decimals,
                                        "symbol": tokensArr[i].symbol,
                                        "tokenName": tokensArr[i].name,
                                        "totalSupply": tokensArr[i].totalSupply
                                    }

                                    let tokenHolderTableData = await TokenHolderModel.findOne({
                                        address: tokenHolderObj.address,
                                        tokenContract: tokenHolderObj.tokenContract
                                    });

                                    if(tokenHolderTableData){ //the holder exists for the token
                                        console.log("Holder EXISTS =====", tokenHolderTableData.address, tokenHolderTableData.tokenName, x,  j)
                                    }
                                    else{ //the holder doesn't exist for the token
                                        console.log("Holder ADDING =====", j)
                                        let holder = new TokenHolderModel(tokenHolderObj)
                                        await holder.saveData();
                                        console.log("holder =====", holder)
                                    }

                                    // tokenHolderObjArray.push(tokenHolderObj);


                                    //logic for adding the transfers for the token

                                    let transferUrlDummy = "https://xdc.blocksscan.io/api/token-txs/xrc20?holder=" + tokenHolderObj.address + "&token=" + tokenHolderObj.tokenContract + "&page=1&limit=50"

                                    let transfersResponseDummy = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, transferUrlDummy, '')

                                    let parsedTransfersResponseDummy;

                                    try{
                                        parsedTransfersResponseDummy = (transfersResponseDummy && (typeof transfersResponseDummy === 'string') && (transfersResponseDummy !== "") ) ? JSON.parse(transfersResponseDummy) : transfersResponseDummy;
                                    }
                                    catch(err){
                                        break;
                                    }

                                    if(typeof parsedTransfersResponseDummy !== 'object'){
                                        break;
                                    }

                                    // let numberOfTransfersApiCalls = (parsedTransfersResponse.pages > 1) ?

                                    for(let z = 0; z<parsedTransfersResponseDummy.pages; z++){

                                        let transferUrl = "https://xdc.blocksscan.io/api/token-txs/xrc20?holder=" + tokenHolderObj.address + "&token=" + tokenHolderObj.tokenContract + "&page=" + z+1 + "&limit=50"

                                        let transfersResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, transferUrl, '')

                                        let evalTransfersResponse;

                                        try{
                                            evalTransfersResponse = (transfersResponse && (typeof transfersResponse === 'string') && (transfersResponse !== "")) ? JSON.parse(transfersResponse) : transfersResponse;
                                        }
                                        catch(err){
                                            break;
                                        }

                                        if(typeof evalTransfersResponse !== 'object'){
                                            break;
                                        }

                                        if(evalTransfersResponse && evalTransfersResponse.items && evalTransfersResponse.items.length > 0){

                                            let parsedTransfersResponse = evalTransfersResponse;

                                            let transfersCount = parsedTransfersResponse.items.length;
                                            let transfersArr = parsedTransfersResponse.items;

                                            for(let t=0; t<transfersCount; t++){

                                                let tokenTransferObj = {
                                                    "hash": transfersArr[t].transactionHash,
                                                    "blockNumber": transfersArr[t].blockNumber,
                                                    "method": transfersArr[t].data,
                                                    "from": transfersArr[t].from,
                                                    "to": transfersArr[t].to,
                                                    "contract": transfersArr[t].address,
                                                    "value": transfersArr[t].value,
                                                    "timestamp": Date.parse(transfersArr[t].timestamp)/1000, //conversion to epoch in seconds

                                                }

                                                let tokenTransferTableData = await TransferTokenModel.findOne({
                                                    hash: tokenTransferObj.hash,
                                                    contract: tokenTransferObj.contract
                                                });

                                                if(tokenTransferTableData){
                                                    console.log("Transfer EXISTS =====", tokenTransferTableData.hash, z, t)
                                                }
                                                else{
                                                    console.log("Transfer ADDING =====", t)
                                                    let transfer = new TransferTokenModel(tokenTransferObj)
                                                    await transfer.saveData();
                                                    console.log("transfer =====", transfer)
                                                }


                                            }

                                        }

                                    }






                                }
                            }


                        }

                    }



                }


            }

            return "Holders and Transfers updated successfully";
        }
        catch(err){
            console.log("errroooor=-=-=-=-", err);
        }
    };


    checkToken = async (token) => {

        let contractData = await ContractModel.findOne({
            address: token.hash
        });

        if(contractData){
            console.log("Token EXISTS =====", contractData.address)
        }
        else{
            console.log("Contract ADDING =====", token.hash)

            let web3 = new Web3("wss://LeewayHertzXDCWS.BlocksScan.io");

            let address = "0x" + token.hash.slice(3)

            let bytecode = await web3.eth.getCode(address, function(err, result){
                console.log("ERROR WHILE FETCHING THE BYTECODE OF THE TOKEN", err)
            })

            let newContract = {
                "address": token.hash,
                "holdersCount": token.holderCount,
                "ERC": 2,
                "contractName": token.name,
                "tokenName": token.name,
                "symbol": token.symbol,
                "decimals": token.decimals,
                "totalSupply": token.totalSupply,
                "byteCode": bytecode,
                "createdOn": Date.parse(token.createdAt)/1000
            }

            let contract = new ContractModel(newContract)
            await contract.saveData();
            console.log("contract =====", contract)
        }

    }







    updateTokenHoldersAndTokenTransfersForGivenToken = async (request) => {

        try{

            let tokenDetailsUrl = "https://explorer.xinfin.network/api/tokens/" + request.hash

            let tokenDetailsRes = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrl, '')
            let evalTokenDetailsRes;
            try{
                evalTokenDetailsRes = (tokenDetailsRes && (typeof tokenDetailsRes === 'string') && (tokenDetailsRes !== "")) ? JSON.parse(tokenDetailsRes) : tokenDetailsRes;
            }
            catch(err){
                throw err;
            }

            if(typeof evalTokenDetailsRes !== 'object'){
                throw 'Invalid response from token details API'
            }


            await this.checkToken(evalTokenDetailsRes);

            let numberOfHolderApiCalls = (evalTokenDetailsRes.holderCount)/50;

            for(let x = 1; x <= numberOfHolderApiCalls; x++){


                let holderDataUrl = "https://xdc.blocksscan.io/api/token-holders?address=" + evalTokenDetailsRes.hash + "&page=" + x + "&limit=50"

                let holderDetailsResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, holderDataUrl, '') //this api shpuld be called here in a loop for tokensArr[i].holderCount/50 times

                let evalHolderDetailsResponse;

                try{
                    evalHolderDetailsResponse = (holderDetailsResponse && (typeof holderDetailsResponse === 'string') && (holderDetailsResponse !== "")) ? JSON.parse(holderDetailsResponse) : holderDetailsResponse;
                }
                catch(err){
                    break;
                }

                if(typeof evalHolderDetailsResponse !== 'object'){
                    break;
                }

                if(evalHolderDetailsResponse && evalHolderDetailsResponse.items && evalHolderDetailsResponse.items.length > 0){


                    let holdersArr = evalHolderDetailsResponse.items;
                    let holdersCount = evalHolderDetailsResponse.items.length;

                    for(let j=0; j<holdersCount; j++){

                        let tokenHolderObj = {
                            "tokenContract": evalTokenDetailsRes.hash,
                            "address": holdersArr[j].hash,
                            "decimals": evalTokenDetailsRes.decimals,
                            "symbol": evalTokenDetailsRes.symbol,
                            "tokenName": evalTokenDetailsRes.name,
                            "totalSupply": evalTokenDetailsRes.totalSupply
                        }

                        let tokenHolderTableData = await TokenHolderModel.findOne({
                            address: tokenHolderObj.address,
                            tokenContract: tokenHolderObj.tokenContract
                        });

                        if(tokenHolderTableData){ //the holder exists for the token
                            console.log("Holder EXISTS **********", tokenHolderTableData.address, tokenHolderTableData.tokenName, x,  j)
                        }
                        else{ //the holder doesn't exist for the token
                            console.log("Holder ADDING **************", j)
                            let holder = new TokenHolderModel(tokenHolderObj)
                            await holder.saveData();
                            console.log("holder =====", holder)
                        }

                        // tokenHolderObjArray.push(tokenHolderObj);


                        //logic for adding the transfers for the token

                        let transferUrlDummy = "https://xdc.blocksscan.io/api/token-txs/xrc20?holder=" + tokenHolderObj.address + "&token=" + tokenHolderObj.tokenContract + "&page=1&limit=50"

                        let transfersResponseDummy = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, transferUrlDummy, '')

                        let parsedTransfersResponseDummy;

                        try{
                            parsedTransfersResponseDummy = (transfersResponseDummy && (typeof transfersResponseDummy === 'string') && (transfersResponseDummy !== "") ) ? JSON.parse(transfersResponseDummy) : transfersResponseDummy;
                        }
                        catch(err){
                            break;
                        }

                        if(typeof parsedTransfersResponseDummy !== 'object'){
                            break;
                        }

                        // let numberOfTransfersApiCalls = (parsedTransfersResponse.pages > 1) ?

                        for(let z = 0; z<parsedTransfersResponseDummy.pages; z++){

                            let transferUrl = "https://xdc.blocksscan.io/api/token-txs/xrc20?holder=" + tokenHolderObj.address + "&token=" + tokenHolderObj.tokenContract + "&page=" + z+1 + "&limit=50"

                            let transfersResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, transferUrl, '')

                            let evalTransfersResponse;

                            try{
                                evalTransfersResponse = (transfersResponse && (typeof transfersResponse === 'string') && (transfersResponse !== "")) ? JSON.parse(transfersResponse) : transfersResponse;
                            }
                            catch(err){
                                break;
                            }

                            if(typeof evalTransfersResponse !== 'object'){
                                break;
                            }

                            if(evalTransfersResponse && evalTransfersResponse.items && evalTransfersResponse.items.length > 0){

                                let parsedTransfersResponse = evalTransfersResponse;

                                let transfersCount = parsedTransfersResponse.items.length;
                                let transfersArr = parsedTransfersResponse.items;

                                for(let t=0; t<transfersCount; t++){

                                    let tokenTransferObj = {
                                        "hash": transfersArr[t].transactionHash,
                                        "blockNumber": transfersArr[t].blockNumber,
                                        "method": transfersArr[t].data,
                                        "from": transfersArr[t].from,
                                        "to": transfersArr[t].to,
                                        "contract": transfersArr[t].address,
                                        "value": transfersArr[t].value,
                                        "timestamp": Date.parse(transfersArr[t].timestamp)/1000, //conversion to epoch in seconds

                                    }

                                    let tokenTransferTableData = await TransferTokenModel.findOne({
                                        hash: tokenTransferObj.hash,
                                        contract: tokenTransferObj.contract
                                    });

                                    if(tokenTransferTableData){
                                        console.log("Transfer EXISTS ************", tokenTransferTableData.hash, z, t)
                                    }
                                    else{
                                        console.log("Transfer ADDING ***************", t)
                                        let transfer = new TransferTokenModel(tokenTransferObj)
                                        await transfer.saveData();
                                        console.log("transfer =====", transfer)
                                    }


                                }

                            }

                        }






                    }
                }


            }

        }
        catch(err){
            console.log("ERROR IN SCRIPT FOR 1 TOKEN **************", err);
        }
    };
}
