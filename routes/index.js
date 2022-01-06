/**
 * Created by Developer on 18/09/20.
 */
import * as ValidationManger from "../middleware/validation";
import AnalyticsController from "../app/modules/analytics";
import AccountController from "../app/modules/accounts";
import ContractController from "../app/modules/contracts";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../config/swagger.json";
import { stringConstants } from "../app/common/constants";
import JobController from "../app/modules/jobs";

module.exports = (app) => {
  app.get("/", (req, res) => res.send(stringConstants.SERVICE_STATUS_HTML));

  /**
   * create swagger UI
   * **/
  app.use("/swagger-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  /**
   * route definition
   */

  /**
   *Account APIs
   *
   */
  app.get("/getTotalAccounts", new AccountController().getTotalAccounts);
  app.get(
    "/getAccountDetailsUsingAddress/:address",
    new AccountController().getAccountDetailsUsingAddress
  );
  app.get(
    "/getLatestAccounts",
    ValidationManger.validateLatestAccounts,
    new AccountController().getLatestAccounts
  );
  app.get(
    "/getSomeDaysAccounts/:numberOfDays",
    ValidationManger.validateSomeDayAccounts,
    new AccountController().getSomeDaysAccounts
  );

  /**
   * Token APIs
   */
  app.get("/getTotalTokens", new ContractController().getTotalTokens);
  app.get(
    "/getListOfTokens",
    ValidationManger.validateLatestAccounts,
    new ContractController().getListOfTokens
  ); // It Takes some time
  app.get(
    "/getTokenUsingTokenNameAndAddress",
    ValidationManger.validateTokenNameAndAddress,
    new ContractController().getTokenUsingTokenNameAndAddress
  );
  // app.get("/getTokenDetailsUsingContractAddress", ValidationManger.validateUserLogin, new TestModule().testRoute);

  /**
   * Contract APIs
   */
  app.get("/getTotalContracts", new ContractController().getTotalContracts);
  app.get(
    "/getListOfContracts",
    ValidationManger.validateLatestAccounts,
    new ContractController().getListOfContracts
  );
  app.get(
    "/getContractDetailsUsingAddress/:contractAddress",
    ValidationManger.validateContractAddress,
    new ContractController().getContractDetailsUsingAddress
  );
  app.get(
    "/getContractSearch",
    ValidationManger.validateContractAddress,
    new ContractController().getContractSearch
  );

  /*
    Holder APIs
    */
  app.get(
    "/getListOfHoldersForToken/:address",
    ValidationManger.validateLatestAccounts,
    new ContractController().getListOfHoldersForToken
  );
  app.get(
    "/getHolderDetailsUsingAddress",
    ValidationManger.validateHolderDetailsUsingAddress,
    new ContractController().getHolderDetailsUsingAddress
  );
  app.get(
    "/someDaysHolders/:numberOfDays/:address",
    ValidationManger.validateSomeDayAccounts,
    new ContractController().someDaysHolders
  );
  // app.get("/totalHoldersForToken", ValidationManger.validateUserLogin, new TestModule().testRoute);

  app.post(
    "/get-token-balance",
    ValidationManger.validateGetTokeBalance,
    new AnalyticsController().getTokenBalance
  );

  app.post(
    "/get-token-overview",
    ValidationManger.validateGetTokenOveview,
    new AnalyticsController().getTokenOverview
  );
  app.post(
    "/get-token-transfer-count",
    ValidationManger.validateGetTokeBalance,
    new AnalyticsController().getTokenTransferCount
  );
  app.post(
    "/get-history-price",
    ValidationManger.validateGetTokenOveview,
    new AnalyticsController().getHistoryPrice
  );
};
