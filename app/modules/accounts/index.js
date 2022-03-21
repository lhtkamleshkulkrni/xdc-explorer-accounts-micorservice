import AccountManager from "./manager";
import Utils from "../../utils"
import {apiSuccessMessage,httpConstants} from "../../common/constants";

export default class AccountController{
    async getTotalAccounts(request,response){
        Utils.lhtLog("AccountController:getTotalAccounts", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, getTotalAccountResponse] = await Utils.parseResponse(new AccountManager().getTotalAccounts())
        if (error) {
            Utils.lhtLog("AccountController:getTotalAccounts", "getTotalAccounts end", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, getTotalAccountResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async getAccountDetailsUsingAddress(request,response){
        Utils.lhtLog("AccountController:getAccountDetailsUsingAddress", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, accountDetailsResponse] = await Utils.parseResponse(new AccountManager().getAccountDetailsUsingAddress(request.params.address));
        if (error) {
            Utils.lhtLog("AccountController:getAccountDetailsUsingAddress", "accountDetailsResponse end", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, accountDetailsResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }
    async getAccountRanking(request,response){
        Utils.lhtLog("AccountController:getAccountRanking", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, accountDetailsResponse] = await Utils.parseResponse(new AccountManager().getAccountRanking(request.params.address));
        if (error) {
            Utils.lhtLog("AccountController:getAccountRanking", "accountRankingResponse end", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, accountDetailsResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }
    async getLatestAccounts(request,response){
        Utils.lhtLog("AccountController:getLatestAccounts", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, latestAccountsResponse] = await Utils.parseResponse(new AccountManager().getLatestAccounts(request.query));
        if (error) {
            Utils.lhtLog("AccountController:getLatestAccounts", "latestAccountsResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, latestAccountsResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }

    async getAccountList(request, response) {
        Utils.lhtLog("AccountController:getAccountList", "", "");
        let [error, latestAccountsResponse] = await Utils.parseResponse(new AccountManager().getAccountList(request.body));
        if (error) {
            Utils.lhtLog("AccountController:getAccountList", "latestAccountsResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, latestAccountsResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }
    
    async getAccountListNew(request, response) {
        Utils.lhtLog("AccountController:getAccountList", "", "");
        let [error, latestAccountsResponse] = await Utils.parseResponse(new AccountManager().getAccountListNew(request.body));
        if (error) {
            Utils.lhtLog("AccountController:getAccountList", "latestAccountsResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.responseForAccountList(response, latestAccountsResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }
    async getSomeDaysAccounts(request,response){
        Utils.lhtLog("AccountController:getSomeDaysAccounts", "", "", '', httpConstants.LOG_LEVEL_TYPE.INFO);
        let [error, someDaysAccountsResponse] = await Utils.parseResponse(new AccountManager().getSomeDaysAccounts(request.params.numberOfDays));
        if (error) {
            Utils.lhtLog("AccountController:getSomeDaysAccounts", "someDaysAccountsResponse err", error, "", "ERROR")
            return Utils.handleError([error], request, response);
        }
        return Utils.response(response, someDaysAccountsResponse, apiSuccessMessage.TOTAL_ACCOUNTS_FETCH_SUCCESSFULLY, httpConstants.RESPONSE_STATUS.SUCCESS, httpConstants.RESPONSE_CODES.OK);
    }
}
