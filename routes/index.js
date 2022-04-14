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
import SyncController from "../app/modules/syncHoldersAndTransfers";

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
    "/accountRanking",
    new AccountController().getAccountRanking
  );
  app.get(
    "/getLatestAccounts",
    ValidationManger.validateLatestAccounts,
    new AccountController().getLatestAccounts
  );

  app.get(
      "/updateAccountBalance",
      ValidationManger.validateLatestAccounts,
      new AccountController().updateAccountBalance
  );

  app.post("/accounts-list", new AccountController().getAccountList);
  app.post("/getListOfAccounts", new AccountController().getAccountListNew);
  app.get(
    "/getSomeDaysAccounts/:numberOfDays",
    ValidationManger.validateSomeDayAccounts,
    new AccountController().getSomeDaysAccounts
  );

  /**
   * Token APIs
   */
  app.get("/getTotalTokens", new ContractController().getTotalTokens);
  app.post(
    "/getListOfTokens",
    ValidationManger.validateSkipAndLimit,
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
  app.post(
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
  app.post(
    "/update-contracts/:contractAddress",
    ValidationManger.validateContractAddress,
    new ContractController().updateContracts
  );

  /*
    Holder APIs
    */
  app.post(
    "/getListOfHoldersForToken/:address",
    ValidationManger.validateLatestAccountsPost,
    new ContractController().getListOfHoldersForToken
  );
  app.post(
    "/getHolderDetailsUsingAddress",
    ValidationManger.validateHolderDetailsUsingAddress,
    new ContractController().getHolderDetailsUsingAddress
  );
  app.get(
    "/someDaysHolders/:numberOfDays/:address",
    ValidationManger.validateSomeDayAccounts,
    new ContractController().someDaysHolders
  );
  app.get(
    "/getListOfTokenForAddress/:address",
    new ContractController().getListOfTokenForAddress
  );
  app.get(
    "/api/accountByTranche",
    new ContractController().getAccountByTranche
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
  app.post(
    "/get-address-analytics",
    ValidationManger.validateGetAddressAnalytics,
    new AnalyticsController().getAddressAnalytics
  );

  app.post(
    "/get-address-balance-analytics",
    ValidationManger.validateGetAddressAnalytics,
    new AnalyticsController().getAddressBalanceAnalytics
  );

  app.get("/token-info/:symbol", new AnalyticsController().getTokenInfo);

  app.get(
    "/migrate-transfer-count",
    new ContractController().migrateTokenTransfer
  );

  // APIs for updating holders and transfers for each token

  app.get(
      "/update-token-holders-and-transfers",
      new SyncController().updateTokenHoldersAndTokenTransfersForXRC20
  );

  app.get(
      "/update-token-holders-and-transfers-for-one-token/",
      new SyncController().updateTokenHoldersAndTokenTransfersForGivenToken
  );

  //new Scripts

  app.get(
      "/update-token-holders-for-one-token/",
      new SyncController().updateTokenHoldersForOneToken
  );

  app.get(
      "/update-token-transfers-for-one-token/",
      new SyncController().updateTokenTransfersForOneToken
  );




  app.get(
      "/update-token-holders-for-all-tokens/",
      new SyncController().updateTokenHoldersForAllTokens
  );

  app.get(
      "/update-token-transfers-for-all-tokens/",
      new SyncController().updateTokenTransfersForAllTokens
  );

  app.get(
      "/update-xrc721-tokens/",
      new SyncController().updateXrc721Tokens
  );

};
