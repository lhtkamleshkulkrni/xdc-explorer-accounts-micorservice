import Utils from "../../utils";
import { apiSuccessMessage, httpConstants } from "../../common/constants";
import BLManager from "./manager";

export default class Index {
  async getTokenBalance(request, response) {
    const [error, getBalanceResponse] = await Utils.parseResponse(
      new BLManager().getTokenBalance(request.body)
    );
    if (!getBalanceResponse) {
      return Utils.handleError(error, request, response);
    }
    return Utils.response(
      response,
      getBalanceResponse,
      apiSuccessMessage.FETCH_SUCCESS,
      httpConstants.RESPONSE_STATUS.SUCCESS,
      httpConstants.RESPONSE_CODES.OK
    );
  }
}
