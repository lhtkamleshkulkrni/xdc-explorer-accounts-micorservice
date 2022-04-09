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
}
