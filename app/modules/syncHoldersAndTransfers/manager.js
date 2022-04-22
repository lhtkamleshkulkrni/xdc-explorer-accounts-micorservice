import TokenHolderModel from "../../models/TokenHolder";
import TransferTokenModel from "../../models/Transfer";
import ContractModel from "../../models/Contract";
const moment = require("moment");
import Utils from "../../utils";
import HttpService from "../../service/http-service";
import {httpConstants} from "../../common/constants";
import Web3 from "web3";
let tokenProcessed=0;
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

            console.log("totalPagesForTokens",totalPagesForTokens);
            for(let y=1; y<totalPagesForTokens; y++){ //the loop needs to be called totalPagesForTokens times
                console.log("inside loop",y);
                let num=y+1;
                let tokenDetailsUrl = "https://explorer.xinfin.network/api/tokens?page=" + num + "&limit=20&type=xrc20";

                // console.log("tokenDetailsUrl ", tokenDetailsUrl);

                let tokenDetailsResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrl, '')

                let evalTokenDetailsResponse;

                try{
                    evalTokenDetailsResponse = (tokenDetailsResponse && (typeof tokenDetailsResponse === 'string') && (tokenDetailsResponse !== "")) ? JSON.parse(tokenDetailsResponse) : tokenDetailsResponse;
                }
                catch(err){
                    console.log(err,"catch err BREAK");
                }
                console.log("evalTokenDetailsResponse ", evalTokenDetailsResponse);


                if(typeof evalTokenDetailsResponse !== 'object'){
                    console.log("evalTokenDetailsResponse not object BREAK");
                    continue;
                }

                if(evalTokenDetailsResponse && evalTokenDetailsResponse.items && evalTokenDetailsResponse.items.length > 0){


                    console.log("tokenDetailsResponse ", evalTokenDetailsResponse.items.length);

                    let numberOfTokens = evalTokenDetailsResponse.items.length;

                    let tokensArr = evalTokenDetailsResponse.items;

                    // let tokenHolderObjArray = [];

                    for(let i = 0; i < numberOfTokens; i++){  // i < numberOfTokens (number of tokens for which the details are fetched in 'tokenDetailsResponse')

                        //the loop starting from "WTK" token

                        // await this.checkToken(tokensArr[i]);
                        // console.log("token checked",tokensArr[i].hash)
                        // continue;
                        // console.log("token checked after continue",tokensArr[i].hash)
                        let numberOfHolderApiCalls = (tokensArr[i].holderCount)/20;

                        for(let x = 1; x <= numberOfHolderApiCalls; x++){


                            // let holderDataUrl = "https://xdc.blocksscan.io/api/token-holders?address=" + tokensArr[i].hash + "&page=" + x + "&limit=50"

                            let holderDataUrl = "https://explorer.xinfin.network/api/token-holders?page=" + x + "&limit=20&address=" + tokensArr[i].hash

                            let holderDetailsResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, holderDataUrl, '') //this api shpuld be called here in a loop for tokensArr[i].holderCount/50 times

                            let evalHolderDetailsResponse;

                            try{
                                evalHolderDetailsResponse = (holderDetailsResponse && (typeof holderDetailsResponse === 'string') && (holderDetailsResponse !== "")) ? JSON.parse(holderDetailsResponse) : holderDetailsResponse;
                            }
                            catch(err){
                                continue;
                            }

                            if(typeof evalHolderDetailsResponse !== 'object'){
                                continue;
                            }

                            if(evalHolderDetailsResponse && evalHolderDetailsResponse.items && evalHolderDetailsResponse.items.length > 0){


                                let holdersArr = evalHolderDetailsResponse.items;
                                let holdersCount = evalHolderDetailsResponse.items.length;

                                for(let j=0; j<holdersCount; j++){

                                    let tokenHolderObj = {
                                        "tokenContract": tokensArr[i].hash ? tokensArr[i].hash : "",
                                        "address": holdersArr[j].hash ? holdersArr[j].hash : "",
                                        "decimals": tokensArr[i].decimals ? tokensArr[i].decimals : 0,
                                        "symbol": tokensArr[i].symbol ? tokensArr[i].symbol : "",
                                        "tokenName": tokensArr[i].name ? tokensArr[i].name : "",
                                        "totalSupply": tokensArr[i].totalSupply ? tokensArr[i].totalSupply : 0,
                                        "balance": holdersArr[j].quantity ? holdersArr[j].quantity : 0,
                                        "modifiedOn":Date.now(),
                                        "createdOn":Date.now(),
                                        "isDeleted":false,
                                        "isActive":true
                                    }

                                    let tokenHolderTableData = await TokenHolderModel.findOne({
                                        address: tokenHolderObj.address,
                                        tokenContract: tokenHolderObj.tokenContract
                                    });


                                    if(tokenHolderTableData){ //the holder exists for the token
                                        let tokenHolderTableDataUpdated = await TokenHolderModel.updateHolder({
                                            address: tokenHolderObj.address,
                                            tokenContract: tokenHolderObj.tokenContract
                                        },tokenHolderObj);
                                        console.log("Holder EXISTS =====", tokenHolderTableDataUpdated.address, tokenHolderTableDataUpdated.tokenName, x,  j)
                                    }
                                    else{ //the holder doesn't exist for the token
                                        console.log("Holder ADDING =====", j)
                                        let holder = new TokenHolderModel(tokenHolderObj)
                                        await holder.saveData();
                                        console.log("holder =====", holder)
                                    }

                                    // tokenHolderObjArray.push(tokenHolderObj);


                                    //logic for adding the transfers for the token

                                    // let transferUrlDummy = "https://xdc.blocksscan.io/api/token-txs/xrc20?holder=" + tokenHolderObj.address + "&token=" + tokenHolderObj.tokenContract + "&page=1&limit=50"

                                    let transferUrlDummy = "https://explorer.xinfin.network/api/token-txs/xrc20?page=1&limit=20&token=" + tokenHolderObj.tokenContract + "&holder=" + tokenHolderObj.address

                                    let transfersResponseDummy = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, transferUrlDummy, '')

                                    let parsedTransfersResponseDummy;

                                    try{
                                        parsedTransfersResponseDummy = (transfersResponseDummy && (typeof transfersResponseDummy === 'string') && (transfersResponseDummy !== "") ) ? JSON.parse(transfersResponseDummy) : transfersResponseDummy;
                                    }
                                    catch(err){
                                        continue;
                                    }

                                    if(typeof parsedTransfersResponseDummy !== 'object'){
                                        continue;
                                    }

                                    // let numberOfTransfersApiCalls = (parsedTransfersResponse.pages > 1) ?

                                    for(let z = 0; z<parsedTransfersResponseDummy.pages; z++){

                                        let nums=z+1;
                                        // let transferUrl = "https://xdc.blocksscan.io/api/token-txs/xrc20?holder=" + tokenHolderObj.address + "&token=" + tokenHolderObj.tokenContract + "&page=" + nums + "&limit=50"

                                        let transferUrl = "https://explorer.xinfin.network/api/token-txs/xrc20?page=" + nums + "&limit=20&token=" + tokenHolderObj.tokenContract + "&holder=" + tokenHolderObj.address

                                        let transfersResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, transferUrl, '')

                                        let evalTransfersResponse;

                                        try{
                                            evalTransfersResponse = (transfersResponse && (typeof transfersResponse === 'string') && (transfersResponse !== "")) ? JSON.parse(transfersResponse) : transfersResponse;
                                        }
                                        catch(err){
                                            continue;
                                        }

                                        if(typeof evalTransfersResponse !== 'object'){
                                            continue;
                                        }

                                        if(evalTransfersResponse && evalTransfersResponse.items && evalTransfersResponse.items.length > 0){

                                            let parsedTransfersResponse = evalTransfersResponse;

                                            let transfersCount = parsedTransfersResponse.items.length;
                                            let transfersArr = parsedTransfersResponse.items;

                                            for(let t=0; t<transfersCount; t++){

                                                let tokenTransferObj = {
                                                    "hash": transfersArr[t].transactionHash ? transfersArr[t].transactionHash : "",
                                                    "blockNumber": transfersArr[t].blockNumber ? transfersArr[t].blockNumber : "",
                                                    "method": transfersArr[t].data ? transfersArr[t].data : "",
                                                    "from": transfersArr[t].from ? transfersArr[t].from : "",
                                                    "to": transfersArr[t].to ? transfersArr[t].to : "",
                                                    "contract": transfersArr[t].address ? transfersArr[t].address : "",
                                                    "value": transfersArr[t].value ? transfersArr[t].value : "",
                                                    "timestamp": transfersArr[t].timestamp ? Date.parse(transfersArr[t].timestamp)/1000 : 0, //conversion to epoch in seconds
                                                    "modifiedOn": Date.now(),
                                                    "createdOn":  Date.now(),
                                                    "isDeleted":  false ,
                                                    "isActive":  true
                                                }

                                                let tokenTransferTableData = await TransferTokenModel.findOne({
                                                    hash: tokenTransferObj.hash,
                                                    contract: tokenTransferObj.contract
                                                });


                                                if(tokenTransferTableData){
                                                    let tokenTransferTableDataUpdated = await TransferTokenModel.updateToken({
                                                        hash: tokenTransferObj.hash,
                                                        contract: tokenTransferObj.contract
                                                    },tokenTransferObj);
                                                    console.log("Transfer EXISTS =====", tokenTransferTableDataUpdated.hash, z, t)
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
            address: token.hash,
        });
        if(contractData){

            let updatedToken = await ContractModel.updateContract({
                 address: token.hash
            },{ERC:721})

            console.log("Token EXISTS =====", updatedToken.address)
            return true;
        }
        else{
            console.log("Contract ADDING =====", token.hash)

            let web3 = new Web3("wss://LeewayHertzXDCWS.BlocksScan.io");

            let address = "0x" + token.hash.slice(3)
            console.log("address ===========================>", address, token.hash);
            let bytecode;

            try{
                bytecode = await web3.eth.getCode(address, function(err, result){
                    if(err){
                        console.log("INSIDE BYTECODE ERROR =-=-=-=-=-=", err);
                    }
                })
            }
            catch(err){
                console.log("BYTECODE ERROR =-=-=-=-=-=-=-=-=-=", err)
            }

            let newContract = {
                "address": token.hash ? token.hash : "",
                "holdersCount": token.holderCount ? token.holderCount : 0,
                "ERC": 721,
                "contractName": token.name ? token.name : "",
                "tokenName": token.name ? token.name : "",
                "symbol": token.symbol ? token.symbol : "",
                "decimals": token.decimals ? token.decimals : 0,
                "totalSupply": token.totalSupply ? token.totalSupply : 0,
                "byteCode": bytecode ? bytecode : "",
                "createdOn": token.createdAt ? Date.parse(token.createdAt)/1000 : 0
            }

            let contract = new ContractModel(newContract)
            let res = await contract.saveData();

            console.log("contract saved====================", res);

        }

    }







    updateTokenHoldersAndTokenTransfersForGivenToken = async (request) => {

        try{

            let tokenDetailsUrl = "https://explorer.xinfin.network/api/tokens/" + request.hash;
            let startPage=request.startPage;
            let endPage=request.endPage;

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

            console.log("sgdsgcxbnsvanbvb yehgvbvnb")

            let numberOfHolderApiCalls = (evalTokenDetailsRes.holderCount)/50;

            for(let x = startPage; x <= endPage; x++){

                console.log("x =-============", x);
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
                            "tokenContract": request.hash ? request.hash : "",
                            "address": holdersArr[j].hash ? holdersArr[j].hash : "",
                            "decimals": evalTokenDetailsRes.decimals ? evalTokenDetailsRes.decimals : 0,
                            "symbol": evalTokenDetailsRes.symbol ? evalTokenDetailsRes.symbol : "",
                            "tokenName": evalTokenDetailsRes.name ? evalTokenDetailsRes.name : "",
                            "totalSupply": evalTokenDetailsRes.totalSupply ? evalTokenDetailsRes.totalSupply : 0,
                            "balance":holdersArr[j].quantity ? holdersArr[j].quantity : 0,
                            "modifiedOn":Date.now(),
                            "createdOn":Date.now(),
                            "isDeleted":false,
                            "isAcive":true
                        }
                        let tokenHolderTableData = await TokenHolderModel.updateHolder({
                            address: tokenHolderObj.address,
                            tokenContract: tokenHolderObj.tokenContract
                        },tokenHolderObj);
                        console.log("Holder **********", tokenHolderTableData.address, tokenHolderTableData.tokenName, x,  j)
                        // if(tokenHolderTableData){ //the holder exists for the token
                        //     console.log("Holder EXISTS **********", tokenHolderTableData.address, tokenHolderTableData.tokenName, x,  j)
                        // }
                        // else{ //the holder doesn't exist for the token
                        //     console.log("Holder ADDING **************", j)
                        //     let holder = new TokenHolderModel(tokenHolderObj)
                        //     await holder.saveData();
                        //     console.log("holder =====", holder)
                        // }

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
                            let num1=z+1;
                            let transferUrl = "https://xdc.blocksscan.io/api/token-txs/xrc20?holder=" + tokenHolderObj.address + "&token=" + tokenHolderObj.tokenContract + "&page=" + num1 + "&limit=50"

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
                                        "hash": transfersArr[t].transactionHash ? transfersArr[t].transactionHash : "",
                                        "blockNumber": transfersArr[t].blockNumber ? transfersArr[t].blockNumber : "",
                                        "method": transfersArr[t].data ? transfersArr[t].data : "",
                                        "from": transfersArr[t].from ? transfersArr[t].from : "",
                                        "to": transfersArr[t].to ? transfersArr[t].to : "",
                                        "contract": transfersArr[t].address ? transfersArr[t].address : "",
                                        "value": transfersArr[t].value ? transfersArr[t].value : "",
                                        "timestamp": transfersArr[t].timestamp ? Date.parse(transfersArr[t].timestamp)/1000 : 0, //conversion to epoch in seconds
                                        "modifiedOn": Date.now(),
                                        "createdOn":  Date.now(),
                                        "isDeleted":  false ,
                                        "isActive":  true
                                    }

                                    let tokenTransferTableData = await TransferTokenModel.updateToken({
                                        hash: tokenTransferObj.hash,
                                        contract: tokenTransferObj.contract
                                    },tokenTransferObj);

                                    console.log("tokenTransferTableData",tokenTransferTableData);
                                    // if(tokenTransferTableData){
                                    //     console.log("Transfer EXISTS ************", tokenTransferTableData.hash, z, t)
                                    // }
                                    // else{
                                    //     console.log("Transfer ADDING ***************", t)
                                    //     let transfer = new TransferTokenModel(tokenTransferObj)
                                    //     await transfer.saveData();
                                    //     console.log("transfer =====", transfer)
                                    // }


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






    //new APIs

    updateTokenHoldersForOneToken = async (request) => {
        try {

            let tokenDetailsUrl = "https://explorer.xinfin.network/api/tokens/" + request.hash;
            let startPage = request.startPage;
            let endPage = request.endPage;

            let tokenDetailsRes = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrl, '')
            let evalTokenDetailsRes;

            try {
                evalTokenDetailsRes = (tokenDetailsRes && (typeof tokenDetailsRes === 'string') && (tokenDetailsRes !== "")) ? JSON.parse(tokenDetailsRes) : tokenDetailsRes;
            } catch (err) {
                throw err;
            }

            if (typeof evalTokenDetailsRes !== 'object') {
                throw 'Invalid response from token details API'
            }


            for (let x = startPage; x <= endPage; x++) {

                console.log("x =-============", x);

                let holderDataUrl = "https://explorer.xinfin.network/api/token-holders?page=" + x + "&limit=50&address=" + evalTokenDetailsRes.hash

                let holderDetailsResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, holderDataUrl, '')

                let evalHolderDetailsResponse;

                try {
                    evalHolderDetailsResponse = (holderDetailsResponse && (typeof holderDetailsResponse === 'string') && (holderDetailsResponse !== "")) ? JSON.parse(holderDetailsResponse) : holderDetailsResponse;
                } catch (err) {
                    continue;
                }

                if (typeof evalHolderDetailsResponse !== 'object') {
                    continue;
                }

                console.log("Holder's API response =============================================>", evalHolderDetailsResponse)

                if (evalHolderDetailsResponse && evalHolderDetailsResponse.items && evalHolderDetailsResponse.items.length > 0) {

                    let holdersArr = evalHolderDetailsResponse.items;
                    let holdersCount = evalHolderDetailsResponse.items.length;

                    for (let j = 0; j < holdersCount; j++) {

                        let tokenHolderObj = {
                            "tokenContract": request.hash ? request.hash : "",
                            "address": holdersArr[j].hash ? holdersArr[j].hash : "",
                            "decimals": evalTokenDetailsRes.decimals ? evalTokenDetailsRes.decimals : 0,
                            "symbol": evalTokenDetailsRes.symbol ? evalTokenDetailsRes.symbol : "",
                            "tokenName": evalTokenDetailsRes.name ? evalTokenDetailsRes.name : "",
                            "totalSupply": evalTokenDetailsRes.totalSupply ? evalTokenDetailsRes.totalSupply : 0,
                            "balance": holdersArr[j].quantity ? holdersArr[j].quantity : 0,
                            "modifiedOn": Date.now(),
                            "createdOn": Date.now(),
                            "isDeleted": false,
                            "isAcive": true
                        }

                        let tokenHolderTableData = await TokenHolderModel.findOne({
                            address: tokenHolderObj.address,
                            tokenContract: tokenHolderObj.tokenContract
                        });

                        if (tokenHolderTableData) { //the holder exists for the token
                            let tokenHolderTableDataUpdated = await TokenHolderModel.updateHolder({
                                address: tokenHolderObj.address,
                                tokenContract: tokenHolderObj.tokenContract
                            }, tokenHolderObj);
                            console.log("Holder EXISTS **********", tokenHolderTableDataUpdated.address, tokenHolderTableDataUpdated.tokenName, x, j)
                        } else { //the holder doesn't exist for the token
                            console.log("Holder ADDING **************", j)
                            let holder = new TokenHolderModel(tokenHolderObj)
                            await holder.saveData();
                            console.log("holder =====", holder)
                        }

                    }

                }

            }
        }
        catch(err){
            console.log("PARENT TRY/CATCH BLOCK ERROR =======>", err);
        }
    }




    updateTokenTransfersForOneToken = async (request) => {
        try{

            let tokenDetailsUrl = "https://explorer.xinfin.network/api/tokens/" + request.hash;
            let startPage = request.startPage;
            let endPage = request.endPage;

            let tokenDetailsRes = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrl, '')
            let evalTokenDetailsRes;

            try {
                evalTokenDetailsRes = (tokenDetailsRes && (typeof tokenDetailsRes === 'string') && (tokenDetailsRes !== "")) ? JSON.parse(tokenDetailsRes) : tokenDetailsRes;
            } catch (err) {
                throw err;
            }

            if (typeof evalTokenDetailsRes !== 'object') {
                throw 'Invalid response from token details API'
            }

            for (let x = startPage; x <= endPage; x++) {

                console.log("x =-============", x);

                let transferUrl = "https://explorer.xinfin.network/api/token-txs/xrc20?page=" + x + "&limit=50&token=" + evalTokenDetailsRes.hash

                let transfersResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, transferUrl, '')

                let evalTransfersResponse;

                try{
                    evalTransfersResponse = (transfersResponse && (typeof transfersResponse === 'string') && (transfersResponse !== "")) ? JSON.parse(transfersResponse) : transfersResponse;
                }
                catch(err){
                    continue;
                }

                if(typeof evalTransfersResponse !== 'object'){
                    continue;
                }

                console.log("TRANSFERS API RESPONSE ================================================>", evalTransfersResponse)

                if(evalTransfersResponse && evalTransfersResponse.items && evalTransfersResponse.items.length > 0){

                    let parsedTransfersResponse = evalTransfersResponse;

                    let transfersCount = parsedTransfersResponse.items.length;
                    let transfersArr = parsedTransfersResponse.items;

                    for(let t=0; t<transfersCount; t++){

                        let tokenTransferObj = {
                            "hash": transfersArr[t].transactionHash ? transfersArr[t].transactionHash : "",
                            "blockNumber": transfersArr[t].blockNumber ? transfersArr[t].blockNumber : "",
                            "method": transfersArr[t].data ? transfersArr[t].data : "",
                            "from": transfersArr[t].from ? transfersArr[t].from : "",
                            "to": transfersArr[t].to ? transfersArr[t].to : "",
                            "contract": transfersArr[t].address ? transfersArr[t].address : "",
                            "value": transfersArr[t].value ? transfersArr[t].value : "",
                            "timestamp": transfersArr[t].timestamp ? Date.parse(transfersArr[t].timestamp)/1000 : 0, //conversion to epoch in seconds
                            "modifiedOn": Date.now(),
                            "createdOn":  Date.now(),
                            "isDeleted":  false ,
                            "isActive":  true
                        }

                        let tokenTransferTableData = await TransferTokenModel.findOne({
                            hash: tokenTransferObj.hash,
                            contract: tokenTransferObj.contract
                        });

                        if(tokenTransferTableData){
                            let tokenTransferTableDataUpdated = await TransferTokenModel.updateToken({
                                hash: tokenTransferObj.hash,
                                contract: tokenTransferObj.contract
                            },tokenTransferObj);
                            console.log("Transfer EXISTS ************", tokenTransferTableDataUpdated.hash, x, t)
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
        catch(err){

        }
    }


    updateTokenHoldersForAllTokens = async () => {
        try{

            let tokenDetailsUrlDummy = "https://explorer.xinfin.network/api/tokens?page=1&limit=20&type=xrc721";

            let tokenDetailsResponseDummy = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrlDummy, '')

            let evalTokenDetailsResponseDummy = (tokenDetailsResponseDummy && (typeof tokenDetailsResponseDummy === 'string') && (tokenDetailsResponseDummy !== "") ) ? JSON.parse(tokenDetailsResponseDummy) : tokenDetailsResponseDummy;

            if(typeof evalTokenDetailsResponseDummy !== 'object'){
                return;
            }

            console.log("")

            let totalPagesForTokens = evalTokenDetailsResponseDummy.pages;

            // console.log("totalPagesForTokens -=-=-=-=-=-=-=-=-=-=>",totalPagesForTokens);

            for(let y=1; y<=totalPagesForTokens; y++){

                console.log("TOKENS API PAGE NUMBER (Y) ===========>", y)

                let tokenDetailsUrl = "https://explorer.xinfin.network/api/tokens?page=" + y + "&limit=20&type=xrc721";


                let tokenDetailsResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrl, '')

                let evalTokenDetailsResponse;

                try{
                    evalTokenDetailsResponse = (tokenDetailsResponse && (typeof tokenDetailsResponse === 'string') && (tokenDetailsResponse !== "")) ? JSON.parse(tokenDetailsResponse) : tokenDetailsResponse;
                }
                catch(err){
                    console.log(err,"catch err BREAK");
                }

                if(typeof evalTokenDetailsResponse !== 'object'){
                    console.log("evalTokenDetailsResponse not object BREAK");
                    continue;
                }

                if(evalTokenDetailsResponse && evalTokenDetailsResponse.items && evalTokenDetailsResponse.items.length > 0) {

                    let numberOfTokens = evalTokenDetailsResponse.items.length;

                    let tokensArr = evalTokenDetailsResponse.items;

                    for(let i = 0; i < numberOfTokens; i++){
                        // let numberOfHolderApiCalls = Math.ceil((tokensArr[i].holderCount)/20);

                        let holderDataUrlDummy = "https://explorer.xinfin.network/api/token-holders/nft?page=1&limit=20&address=" + tokensArr[i].hash

                        let holderDetailsResponseDummy = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, holderDataUrlDummy, '')

                        let evalHolderDetailsResponseDummy;

                        try{
                            evalHolderDetailsResponseDummy = (holderDetailsResponseDummy && (typeof holderDetailsResponseDummy === 'string') && (holderDetailsResponseDummy !== "")) ? JSON.parse(holderDetailsResponseDummy) : holderDetailsResponseDummy;
                        }
                        catch(err){
                            console.log("i loop continue =-=-=-=-==-", err)
                            continue;
                        }

                        if(typeof evalHolderDetailsResponseDummy !== 'object'){
                            console.log("evalHolderDetailsResponse continueeeee =-=-=-=-=-=", evalHolderDetailsResponseDummy )
                            continue;
                        }

                        for(let x = 1; x <= evalHolderDetailsResponseDummy.pages; x++){
                            console.log("i and x ========================================", i, "and" , x, tokensArr[i].hash);
                            // let holderDataUrl = "https://explorer.xinfin.network/api/token-holders?page=" + x + "&limit=20&address=" + tokensArr[i].hash

                            let holderDataUrl = "https://explorer.xinfin.network/api/token-holders/nft?page=" + x + "&limit=20&address=" + tokensArr[i].hash

                            let holderDetailsResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, holderDataUrl, '')

                            let evalHolderDetailsResponse;

                            try{
                                evalHolderDetailsResponse = (holderDetailsResponse && (typeof holderDetailsResponse === 'string') && (holderDetailsResponse !== "")) ? JSON.parse(holderDetailsResponse) : holderDetailsResponse;
                            }
                            catch(err){
                                console.log("i loop continue =-=-=-=-==-", err)
                                continue;
                            }

                            if(typeof evalHolderDetailsResponse !== 'object'){
                                console.log("evalHolderDetailsResponse continueeeee =-=-=-=-=-=", evalHolderDetailsResponse )
                                continue;
                            }

                            // console.log("HOLDERS API RESPONSE FOR PAGE", x , " FOR TOKEN ===========> ",  evalHolderDetailsResponse)

                            if(evalHolderDetailsResponse && evalHolderDetailsResponse.items && evalHolderDetailsResponse.items.length > 0) {

                                let holdersArr = evalHolderDetailsResponse.items;
                                let holdersCount = evalHolderDetailsResponse.items.length;

                                for(let j=0; j<holdersCount; j++) {

                                    let tokenHolderObj = {
                                        "tokenContract": tokensArr[i].hash ? tokensArr[i].hash : "",
                                        "address": holdersArr[j].holder ? holdersArr[j].holder : "",
                                        "decimals": tokensArr[i].decimals ? tokensArr[i].decimals : 0,
                                        "symbol": tokensArr[i].symbol ? tokensArr[i].symbol : "",
                                        "tokenName": tokensArr[i].name ? tokensArr[i].name : "",
                                        "totalSupply": tokensArr[i].totalSupply ? tokensArr[i].totalSupply : 0,
                                        "balance": holdersArr[j].quantity ? holdersArr[j].quantity : 0,
                                        "modifiedOn": Date.now(),
                                        "createdOn": Date.now(),
                                        "isDeleted": false,
                                        "isActive": true
                                    }

                                    let tokenHolderTableData = await TokenHolderModel.findOne({
                                        address: tokenHolderObj.address,
                                        tokenContract: tokenHolderObj.tokenContract
                                    });


                                    if (tokenHolderTableData) { //the holder exists for the token
                                        let tokenHolderTableDataUpdated = await TokenHolderModel.updateHolder({
                                            address: tokenHolderObj.address,
                                            tokenContract: tokenHolderObj.tokenContract
                                        }, tokenHolderObj);
                                        console.log("Holder EXISTS =====", tokenHolderTableDataUpdated.address, tokenHolderTableDataUpdated.tokenName, x, j)
                                    } else { //the holder doesn't exist for the token
                                        console.log("Holder ADDING =====", j)
                                        let holder = new TokenHolderModel(tokenHolderObj)
                                        await holder.saveData();
                                        console.log("holder =====", holder)
                                    }
                                }
                            }
                        }
                    }

                }


            }

        }
        catch(err){
            console.log("PARENT TRY/CATCH BLOCK ERROR =====>", err)
        }
    }




    updateTokenTransfersForAllTokens = async () => {
        try{

            let tokenDetailsUrlDummy = "https://explorer.xinfin.network/api/tokens?page=1&limit=20&type=xrc721";

            let tokenDetailsResponseDummy = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrlDummy, '')

            let evalTokenDetailsResponseDummy = (tokenDetailsResponseDummy && (typeof tokenDetailsResponseDummy === 'string') && (tokenDetailsResponseDummy !== "") ) ? JSON.parse(tokenDetailsResponseDummy) : tokenDetailsResponseDummy;

            if(typeof evalTokenDetailsResponseDummy !== 'object'){
                return;
            }

            console.log("")

            let totalPagesForTokens = evalTokenDetailsResponseDummy.pages;

            console.log("totalPagesForTokens -=-=-=-=-=-=-=-=-=-=>",totalPagesForTokens);

            for(let y=1; y<=totalPagesForTokens; y++){

                // let num=y+1;

                console.log("TOKENS API PAGE NUMBER (Y) ===========>", y)

                let tokenDetailsUrl = "https://explorer.xinfin.network/api/tokens?page=" + y + "&limit=20&type=xrc721";


                let tokenDetailsResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrl, '')

                let evalTokenDetailsResponse;

                try{
                    evalTokenDetailsResponse = (tokenDetailsResponse && (typeof tokenDetailsResponse === 'string') && (tokenDetailsResponse !== "")) ? JSON.parse(tokenDetailsResponse) : tokenDetailsResponse;
                }
                catch(err){
                    console.log(err,"catch err BREAK");
                }

                if(typeof evalTokenDetailsResponse !== 'object'){
                    console.log("evalTokenDetailsResponse not object BREAK");
                    continue;
                }

                if(evalTokenDetailsResponse && evalTokenDetailsResponse.items && evalTokenDetailsResponse.items.length > 0) {

                    let numberOfTokens = evalTokenDetailsResponse.items.length;

                    let tokensArr = evalTokenDetailsResponse.items;

                    for(let i = 0; i < numberOfTokens; i++) {

                        console.log("LOOP FOR TOKEN =============================================================>", tokensArr[i].name)

                        let transferUrlDummy = "https://explorer.xinfin.network/api/token-txs/xrc721?page=1&limit=20&token=" + tokensArr[i].hash


                        let transfersResponseDummy = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, transferUrlDummy, '')

                        let parsedTransfersResponseDummy;

                        try{
                            parsedTransfersResponseDummy = (transfersResponseDummy && (typeof transfersResponseDummy === 'string') && (transfersResponseDummy !== "") ) ? JSON.parse(transfersResponseDummy) : transfersResponseDummy;
                        }
                        catch(err){
                            continue;
                        }

                        if(typeof parsedTransfersResponseDummy !== 'object'){
                            continue;
                        }

                        // let numberOfTransfersApiCalls = (parsedTransfersResponse.pages > 1) ?

                        for(let z = 0; z<parsedTransfersResponseDummy.pages; z++){

                            let nums=z+1;

                            let transferUrl = "https://explorer.xinfin.network/api/token-txs/xrc721?page=" + nums + "&limit=20&token=" + tokensArr[i].hash

                            let transfersResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, transferUrl, '')

                            let evalTransfersResponse;

                            try{
                                evalTransfersResponse = (transfersResponse && (typeof transfersResponse === 'string') && (transfersResponse !== "")) ? JSON.parse(transfersResponse) : transfersResponse;
                            }
                            catch(err){
                                continue;
                            }

                            if(typeof evalTransfersResponse !== 'object'){
                                continue;
                            }

                            if(evalTransfersResponse && evalTransfersResponse.items && evalTransfersResponse.items.length > 0){

                                let parsedTransfersResponse = evalTransfersResponse;

                                let transfersCount = parsedTransfersResponse.items.length;
                                let transfersArr = parsedTransfersResponse.items;

                                for(let t=0; t<transfersCount; t++){

                                    let tokenTransferObj = {
                                        "hash": transfersArr[t].transactionHash ? transfersArr[t].transactionHash : "",
                                        "blockNumber": transfersArr[t].blockNumber ? transfersArr[t].blockNumber : "",
                                        "method": transfersArr[t].data ? transfersArr[t].data : "",
                                        "from": transfersArr[t].from ? transfersArr[t].from : "",
                                        "to": transfersArr[t].to ? transfersArr[t].to : "",
                                        "contract": transfersArr[t].address ? transfersArr[t].address : "",
                                        "value": transfersArr[t].value ? transfersArr[t].value : "",
                                        "timestamp": transfersArr[t].timestamp ? Date.parse(transfersArr[t].timestamp)/1000 : 0, //conversion to epoch in seconds
                                        "modifiedOn": Date.now(),
                                        "createdOn":  Date.now(),
                                        "isDeleted":  false ,
                                        "isActive":  true
                                    }

                                    let tokenTransferTableData = await TransferTokenModel.findOne({
                                        hash: tokenTransferObj.hash,
                                        contract: tokenTransferObj.contract
                                    });


                                    if(tokenTransferTableData){
                                        let tokenTransferTableDataUpdated = await TransferTokenModel.updateToken({
                                            hash: tokenTransferObj.hash,
                                            contract: tokenTransferObj.contract
                                        },tokenTransferObj);
                                        console.log("Transfer EXISTS =====", tokenTransferTableDataUpdated.hash, z, t)
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
        catch(err){
            console.log("PARENT TRY/CATCH BLOCK ERROR =====>", err)
        }
    }


    updateXrc721Tokens = async () => {
        try{

            let tokenDetailsUrlDummy = "https://explorer.xinfin.network/api/tokens?page=1&limit=20&type=xrc721";

            let tokenDetailsResponseDummy = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrlDummy, '')

            let evalTokenDetailsResponseDummy = (tokenDetailsResponseDummy && (typeof tokenDetailsResponseDummy === 'string') && (tokenDetailsResponseDummy !== "") ) ? JSON.parse(tokenDetailsResponseDummy) : tokenDetailsResponseDummy;

            if(typeof evalTokenDetailsResponseDummy !== 'object'){
                return;
            }

            let totalPagesForTokens = evalTokenDetailsResponseDummy.pages;

            console.log("totalPagesForTokens",totalPagesForTokens);
            for(let y=1; y<=totalPagesForTokens; y++){


                let tokenDetailsUrl = "https://explorer.xinfin.network/api/tokens?page=" + y + "&limit=20&type=xrc721";

                // console.log("tokenDetailsUrl ", tokenDetailsUrl);

                let tokenDetailsResponse = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, tokenDetailsUrl, '')

                let evalTokenDetailsResponse;

                try{
                    evalTokenDetailsResponse = (tokenDetailsResponse && (typeof tokenDetailsResponse === 'string') && (tokenDetailsResponse !== "")) ? JSON.parse(tokenDetailsResponse) : tokenDetailsResponse;
                }
                catch(err){
                    console.log(err,"catch err BREAK");
                }

                if(typeof evalTokenDetailsResponse !== 'object'){
                    console.log("evalTokenDetailsResponse not object BREAK");
                    continue;
                }

                console.log("evalTokenDetailsResponse ============================>", evalTokenDetailsResponse);

                if(evalTokenDetailsResponse && evalTokenDetailsResponse.items && evalTokenDetailsResponse.items.length > 0){

                    console.log("tokenDetailsResponse ", evalTokenDetailsResponse.items.length);

                    let numberOfTokens = evalTokenDetailsResponse.items.length;

                    let tokensArr = evalTokenDetailsResponse.items;

                    // let tokenHolderObjArray = [];

                    console.log("numberOfTokens ====================", numberOfTokens)

                    for(let i = 0; i < numberOfTokens; i++){
                        await this.checkToken(tokensArr[i]);
                    }

                }

            }

        }
        catch(err){

        }
    }


}
