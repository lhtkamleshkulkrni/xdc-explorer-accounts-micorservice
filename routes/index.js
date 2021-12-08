/**
 * Created by Developer on 18/09/20.
 */
import * as ValidationManger from "../middleware/validation";
import TestModule from "../app/modules/testModule";
import AccountController from "../app/modules/accounts";
import ContractController from "../app/modules/contracts";
import {stringConstants} from "../app/common/constants";

module.exports = (app) => {
    app.get('/', (req, res) => res.send(stringConstants.SERVICE_STATUS_HTML));

    /**
     * route definition
     */

    /**
     *Account APIs
     *
     */
    app.get("/getTotalAccounts", new AccountController().getTotalAccounts);
    app.get("/getAccountDetailsUsingAddress/:address",  new AccountController().getAccountDetailsUsingAddress);
    app.get("/getLatestAccounts", ValidationManger.validateLatestAccounts, new AccountController().getLatestAccounts);
    app.get("/getSomeDaysAccounts/:numberOfDays", ValidationManger.validateSomeDayAccounts, new AccountController().getSomeDaysAccounts);

    /**
     * Token APIs
     */
    app.get("/getTotalTokens", new ContractController().getTotalTokens);
    app.get("/getListOfTokens", ValidationManger.validateLatestAccounts, new ContractController().getListOfTokens); // It Takes some time
    app.get("/getTokenUsingTokenNameAndAddress", ValidationManger.validateTokenNameAndAddress, new ContractController().getTokenUsingTokenNameAndAddress);
    app.get("/getTokenDetailsUsingContractAddress", ValidationManger.validateUserLogin, new TestModule().testRoute);

    /**
     * Contract APIs
     */
    app.get("/getTotalContracts", new ContractController().getTotalContracts)
    app.get("/getListOfContracts", ValidationManger.validateLatestAccounts, new ContractController().getListOfContracts);
    app.get("/getContractDetailsUsingAddress/:contractAddress", ValidationManger.validateContractAddress, new ContractController().getContractDetailsUsingAddress);


    /*
    Holder APIs
    */
    app.get("/getListOfHoldersForToken/:address", ValidationManger.validateLatestAccounts, new ContractController().getListOfHoldersForToken);
    app.get("/getHolderDetailsUsingAddress", ValidationManger.validateHolderDetailsUsingAddress, new ContractController().getHolderDetailsUsingAddress);
    app.get("/someDaysHolders/:numberOfDays/:address", ValidationManger.validateSomeDayAccounts, new ContractController().someDaysHolders);
    app.get("/totalHoldersForToken", ValidationManger.validateUserLogin, new TestModule().testRoute);
};
