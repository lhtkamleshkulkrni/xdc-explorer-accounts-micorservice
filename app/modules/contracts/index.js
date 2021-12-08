import ContractManager from "./manager";
import Utils from "../../utils"
import {apiSuccessMessage,httpConstants} from "../../common/constants";

export default class ContractController{
    async getTotalTokens(request,response){
        Utils.lhtLog("ContractController:getTotalTokens", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, getTotalTokenResponse] = await Utils.parseResponse(new ContractManager().getTotalTokens())
        if (error) {
            Utils.lhtLog("ContractController:getTotalAccounts", "getTotalTokens end", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, getTotalTokenResponse, apiSuccessMessage.TOTAL_TOKENS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async getTotalContracts(request,response){
        Utils.lhtLog("ContractController:getTotalContracts", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, totalContractsResponse] = await Utils.parseResponse(new ContractManager().getTotalContracts());
        if (error) {
            Utils.lhtLog("ContractController:getTotalContracts", "totalContractsResponse end", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, totalContractsResponse, apiSuccessMessage.TOTAL_TOKENS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async getListOfTokens(request,response){
        Utils.lhtLog("ContractController:getListOfTokens", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, listOfTokensResponse] = await Utils.parseResponse(new ContractManager().getListOfTokens(request.query));
        if (error) {
            Utils.lhtLog("ContractController:getListOfTokens", "listOfTokensResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, listOfTokensResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async getListOfContracts(request,response){
        Utils.lhtLog("ContractController:getListOfContracts", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, listOfContractsResponse] = await Utils.parseResponse(new ContractManager().getListOfContracts(request.query));
        if (error) {
            Utils.lhtLog("ContractController:getListOfContracts", "listOfContractsResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, listOfContractsResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async getContractDetailsUsingAddress(request,response){
        Utils.lhtLog("ContractController:getContractDetailsUsingAddress", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, contractDetailsUsingAddressResponse] = await Utils.parseResponse(new ContractManager().contractDetailsUsingAddressResponse(request.params));
        if (error) {
            Utils.lhtLog("ContractController:getContractDetailsUsingAddress", "contractDetailsUsingAddressResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, contractDetailsUsingAddressResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async getListOfHoldersForToken(request,response){
        Utils.lhtLog("ContractController:getListOfHoldersForToken", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, listOfHoldersResponse] = await Utils.parseResponse(new ContractManager().getListOfHoldersForToken(request));
        if (error) {
            Utils.lhtLog("ContractController:getListOfHoldersForToken", "listOfHoldersResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, listOfHoldersResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async someDaysHolders(request,response){
        Utils.lhtLog("ContractController:someDaysHolders", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, someDaysHoldersResponse] = await Utils.parseResponse(new ContractManager().someDaysHolders(request));
        if (error) {
            Utils.lhtLog("ContractController:someDaysHolders", "someDaysHoldersResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, someDaysHoldersResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async getHolderDetailsUsingAddress(request,response){
        Utils.lhtLog("ContractController:getHolderDetailsUsingAddress", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, holderDetailsResponse] = await Utils.parseResponse(new ContractManager().getHolderDetailsUsingAddress(request));
        if (error) {
            Utils.lhtLog("ContractController:someDaysHolders", "holderDetailsResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, holderDetailsResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async getTokenUsingTokenNameAndAddress(request,response){
        Utils.lhtLog("ContractController:getTokenUsingTokenNameAndAddress", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, tokenDetailResponse] = await Utils.parseResponse(new ContractManager().getTokenUsingTokenNameAndAddress(request));
        if (error) {
            Utils.lhtLog("ContractController:getTokenUsingTokenNameAndAddress", "tokenDetailResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, tokenDetailResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }
}