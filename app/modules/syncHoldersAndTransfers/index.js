import SyncManager from "./manager";
import Utils from "../../utils";
import { apiSuccessMessage, httpConstants } from "../../common/constants";

export default class SyncController {
    async updateTokenHoldersAndTokenTransfersForXRC20(request, response) {
        Utils.lhtLog(
            "SyncController:updateTokenHolders",
            "",
            "",
            "",
            httpConstants.LOG_LEVEL_TYPE.INFO
        );
        let [error, migrateTokenTransferResponse] = await Utils.parseResponse(
            new SyncManager().updateTokenHoldersAndTokenTransfersForXRC20()
        );
        if (error) {
            Utils.lhtLog(
                "SyncController:updateTokenHolders",
                "updateTokenHolders err",
                error,
                "",
                "ERROR"
            );
            return Utils.handleError([error], request, response);
        }
        return Utils.response(
            response,
            migrateTokenTransferResponse,
            apiSuccessMessage.HOLDERS_UPDATED_SUCCESSFULLY,
            httpConstants.RESPONSE_STATUS.SUCCESS,
            httpConstants.RESPONSE_CODES.OK
        );
    }



    async updateTokenHoldersAndTokenTransfersForGivenToken(request, response) {
        Utils.lhtLog(
            "SyncController:updateTokenHoldersAndTokenTransfersForGivenToken",
            "",
            "",
            "",
            httpConstants.LOG_LEVEL_TYPE.INFO
        );
        let [error, migrateTokenTransferResponse] = await Utils.parseResponse(
            new SyncManager().updateTokenHoldersAndTokenTransfersForGivenToken(request.query)
        );
        if (error) {
            Utils.lhtLog(
                "SyncController:updateTokenHoldersAndTokenTransfersForGivenToken",
                "updateTokenHoldersAndTokenTransfersForGivenToken err",
                error,
                "",
                "ERROR"
            );
            return Utils.handleError([error], request, response);
        }
        return Utils.response(
            response,
            migrateTokenTransferResponse,
            apiSuccessMessage.HOLDERS_UPDATED_SUCCESSFULLY,
            httpConstants.RESPONSE_STATUS.SUCCESS,
            httpConstants.RESPONSE_CODES.OK
        );
    }


    // new APIs

    async updateTokenHoldersForOneToken(request, response) {
        Utils.lhtLog(
            "SyncController:updateTokenHoldersForOneToken",
            "",
            "",
            "",
            httpConstants.LOG_LEVEL_TYPE.INFO
        );
        let [error, updateTokenHoldersResponse] = await Utils.parseResponse(
            new SyncManager().updateTokenHoldersForOneToken(request.query)
        );
        if (error) {
            Utils.lhtLog(
                "SyncController:updateTokenHoldersForOneToken",
                "updateTokenHoldersForOneToken err",
                error,
                "",
                "ERROR"
            );
            return Utils.handleError([error], request, response);
        }
        return Utils.response(
            response,
            updateTokenHoldersResponse,
            apiSuccessMessage.HOLDERS_UPDATED_SUCCESSFULLY,
            httpConstants.RESPONSE_STATUS.SUCCESS,
            httpConstants.RESPONSE_CODES.OK
        );
    }



    async updateTokenTransfersForOneToken(request, response) {
        Utils.lhtLog(
            "SyncController:updateTokenTransfers",
            "",
            "",
            "",
            httpConstants.LOG_LEVEL_TYPE.INFO
        );
        let [error, updateTokenTransfersResponse] = await Utils.parseResponse(
            new SyncManager().updateTokenTransfersForOneToken(request.query)
        );
        if (error) {
            Utils.lhtLog(
                "SyncController:updateTokenTransfers",
                "updateTokenTransfers err",
                error,
                "",
                "ERROR"
            );
            return Utils.handleError([error], request, response);
        }
        return Utils.response(
            response,
            updateTokenTransfersResponse,
            apiSuccessMessage.HOLDERS_UPDATED_SUCCESSFULLY,
            httpConstants.RESPONSE_STATUS.SUCCESS,
            httpConstants.RESPONSE_CODES.OK
        );
    }




    async updateTokenHoldersForAllTokens(request, response) {
        Utils.lhtLog(
            "SyncController:updateTokenHoldersForAllTokens",
            "",
            "",
            "",
            httpConstants.LOG_LEVEL_TYPE.INFO
        );
        let [error, updateTokenHoldersResponse] = await Utils.parseResponse(
            new SyncManager().updateTokenHoldersForAllTokens()
        );
        if (error) {
            Utils.lhtLog(
                "SyncController:updateTokenHoldersForAllTokens",
                "updateTokenHoldersForAllTokens err",
                error,
                "",
                "ERROR"
            );
            return Utils.handleError([error], request, response);
        }
        return Utils.response(
            response,
            updateTokenHoldersResponse,
            apiSuccessMessage.HOLDERS_UPDATED_SUCCESSFULLY,
            httpConstants.RESPONSE_STATUS.SUCCESS,
            httpConstants.RESPONSE_CODES.OK
        );
    }


    async updateTokenTransfersForAllTokens(request, response) {
        Utils.lhtLog(
            "SyncController:updateTokenTransfersForAllTokens",
            "",
            "",
            "",
            httpConstants.LOG_LEVEL_TYPE.INFO
        );
        let [error, updateTokenTransfersResponse] = await Utils.parseResponse(
            new SyncManager().updateTokenTransfersForAllTokens()
        );
        if (error) {
            Utils.lhtLog(
                "SyncController:updateTokenTransfersForAllTokens",
                "updateTokenTransfersForAllTokens err",
                error,
                "",
                "ERROR"
            );
            return Utils.handleError([error], request, response);
        }
        return Utils.response(
            response,
            updateTokenTransfersResponse,
            apiSuccessMessage.HOLDERS_UPDATED_SUCCESSFULLY,
            httpConstants.RESPONSE_STATUS.SUCCESS,
            httpConstants.RESPONSE_CODES.OK
        );
    }



    async updateXrc721Tokens(request, response) {
        Utils.lhtLog(
            "SyncController:updateXrc721Tokens",
            "",
            "",
            "",
            httpConstants.LOG_LEVEL_TYPE.INFO
        );
        let [error, updateTokenTransfersResponse] = await Utils.parseResponse(
            new SyncManager().updateXrc721Tokens()
        );
        if (error) {
            Utils.lhtLog(
                "SyncController:updateXrc721Tokens",
                "updateXrc721Tokens err",
                error,
                "",
                "ERROR"
            );
            return Utils.handleError([error], request, response);
        }
        return Utils.response(
            response,
            updateTokenTransfersResponse,
            apiSuccessMessage.HOLDERS_UPDATED_SUCCESSFULLY,
            httpConstants.RESPONSE_STATUS.SUCCESS,
            httpConstants.RESPONSE_CODES.OK
        );
    }
}
