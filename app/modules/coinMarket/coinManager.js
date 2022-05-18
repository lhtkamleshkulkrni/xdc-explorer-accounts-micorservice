import HttpService from "../../service/http-service";
import {httpConstants} from "../../common/constants";
import Config from "../../../config";
import CoinMasterModel from '../../models/coinMaster';
import moment from "moment";
import Utils from "../../utils";

export default class CoinMarketManager {
    async saveData() {
        const URL = `${Config.COIN_MARKET_API_URL_LATEST}?symbol=${Config.SYMBOL}&CMC_PRO_API_KEY=${Config.CMC_API_KEY}`;

        let response = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, URL, "", {}, {});
        let responseINR = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, URL + "&convert=INR", "", {}, {});
        let responseEUR = await HttpService.executeHTTPRequest(httpConstants.METHOD_TYPE.GET, URL + "&convert=EUR", "", {},{});
        response = JSON.stringify(response);
        responseINR = JSON.stringify(responseINR);
        responseEUR = JSON.stringify(responseEUR);    
        const coinMarketUSD = await this.parseExchangeData(JSON.parse(response), "USD");
        Utils.lhtLog("CoinMarketManager", `CoinMarketManager:saveData coinMarketUSD`, coinMarketUSD, "", httpConstants.LOG_LEVEL_TYPE.INFO);
        const coinMasterModelUSD = new CoinMasterModel(coinMarketUSD);
        await coinMasterModelUSD.saveData();


        const coinMarketEUR = await this.parseExchangeData(JSON.parse(responseEUR), "EUR");
        Utils.lhtLog("CoinMarketManager", `CoinMarketManager:saveData coinMarketEUR`, coinMarketEUR, "", httpConstants.LOG_LEVEL_TYPE.INFO);
        const coinMasterModelEUR = new CoinMasterModel(coinMarketEUR);
        await coinMasterModelEUR.saveData();

        const coinMarketINR = await this.parseExchangeData(JSON.parse(responseINR), "INR");
        Utils.lhtLog("CoinMarketManager", `CoinMarketManager:saveData coinMarketINR`, coinMarketINR, "", httpConstants.LOG_LEVEL_TYPE.INFO);
        const coinMasterModelINR = new CoinMasterModel(coinMarketINR);
        await coinMasterModelINR.saveData();
    }

    async parseExchangeData(response, fiat) {
        if (!response || !fiat || !response.data || !response.data.XDC || !response.status)
            return;
        let price = await this.getPrice(response, fiat);
        let pricePercentChangePerHour = await this.getPricePercentChangePerHour(response, fiat);
        let marketCap = await this.getMarketCap(response, fiat);
        let fullyDilutedMarketCap = await this.getFullyDilutedMarketCap(
            response,
            fiat
        );
        let volume = await this.getVolume(response, fiat);
        let volumeMarketCap = await this.getVolumeMarketCap(volume, marketCap);
        return {
            id: response.data.XDC.id,
            name: response.data.XDC.name,
            symbol: response.data.XDC.symbol,
            slug: response.data.XDC.slug,
            numMarketPairs: response.data.XDC.num_market_pairs,
            dateAdded: moment(response.data.XDC.date_added).utc().valueOf()/1000,
            lastUpdated: moment(response.data.XDC.last_updated).utc().valueOf()/1000,
            errorCode: response.status.error_code,
            errorMessage: response.status.error_message,
            creditCount: response.status.credit_count,
            maxSupply: response.data.XDC.max_supply,
            circulatingSupply: response.data.XDC.circulating_supply,
            totalSupply: response.data.XDC.total_supply,
            cmcRank: response.data.XDC.cmc_rank,
            isFiat: response.data.XDC.is_fiat,
            fiatValue: fiat,
            price: price,
            pricePercentChangePerHour: pricePercentChangePerHour,
            marketCap: marketCap,
            fullyDilutedMarketCap: fullyDilutedMarketCap,
            volume: volume,
            volumeMarketCap: volumeMarketCap,
            quote: response.data.XDC.quote,
            createdOn: Date.now(),
            modifiedOn:  Date.now(),
            isDeleted:  false
        };
    }

    async getPrice(response, fiat) {
        if (!response || !fiat || !response.data || !response.data.XDC)
            return;
        if (fiat === "USD") {
            return response.data.XDC.quote.USD.price;
        }
        if (fiat === "EUR") {
            return response.data.XDC.quote.EUR.price;
        }
        if (fiat === "INR") {
            return response.data.XDC.quote.INR.price;
        }
    }

    async getPricePercentChangePerHour(response, fiat) {
        if (!response || !fiat || !response.data || !response.data.XDC)
            return;
        if (fiat === "USD") {
            return response.data.XDC.quote.USD.percent_change_1h;
        }
        if (fiat === "EUR") {
            return response.data.XDC.quote.EUR.percent_change_1h;
        }
        if (fiat === "INR") {
            return response.data.XDC.quote.INR.percent_change_1h;
        }
    }

    async getMarketCap(response, fiat) {
        if (!response || !fiat || !response.data || !response.data.XDC)
            return;
        if (fiat === "USD") {
            return response.data.XDC.quote.USD.market_cap;
        }
        if (fiat === "EUR") {
            return response.data.XDC.quote.EUR.market_cap;
        }
        if (fiat === "INR") {
            return response.data.XDC.quote.INR.market_cap;
        }
    }

    async getFullyDilutedMarketCap(response, fiat) {
        if (!response || !fiat || !response.data || !response.data.XDC)
            return;
        if (fiat === "USD") {
            if (response.data.XDC.max_supply === null) {
                return response.data.XDC.quote.USD.price * response.data.XDC.total_supply;
            } else {
                return response.data.XDC.quote.USD.price * response.data.XDC.max_supply;
            }
        }
        if (fiat === "EUR") {
            if (response.data.XDC.max_supply === null) {
                return response.data.XDC.quote.EUR.price * response.data.XDC.total_supply
            } else {
                return response.data.XDC.quote.EUR.price * response.data.XDC.max_supply;
            }
        }
        if (fiat === "INR") {
            if (response.data.XDC.max_supply === null) {
                return response.data.XDC.quote.INR.price * response.data.XDC.total_supply
            } else {
                return response.data.XDC.quote.INR.price * response.data.XDC.max_supply;
            }
        }
    }

    async getVolume(response, fiat) {
        if (!response || !fiat || !response.data || !response.data.XDC)
            return;
        if (fiat === "USD") {
            return response.data.XDC.quote.USD.volume_24h;
        }
        if (fiat === "EUR") {
            return response.data.XDC.quote.EUR.volume_24h;
        }
        if (fiat === "INR") {
            return response.data.XDC.quote.INR.volume_24h;
        }
    }

    async getVolumeMarketCap(volume, marketCap) {
        if (!volume || !marketCap) return;
        return volume / marketCap;
    }
}
