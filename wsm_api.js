
var rp = require('request-promise');

// Main api class
class WSM {

    constructor(key, secret) {
        this.baseUrl = 'https://www.wallstreetmagnate.com'
        this.authToken = null
        this.key = key
        this.secret = secret
    }

    _buildEndpoint(resource) {
        let fullUri = this.baseUrl + "/rest/" + resource.join("/")
        // Chop off final '/'
        return fullUri; 
    }

    _buildUri(uri, parameters) {
        var qs = '';
        for (var key in parameters) {
            if (parameters.hasOwnProperty(key)) {
                var value = parameters[key];
                qs += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
            }
        }
        if (qs.length > 0) {
            // remove last '&'
            qs = qs.substring(0, qs.length - 1);
            uri = uri + '?' + qs;
        }
        return uri;
    }

    _buildHeaders() {
        var headers = {}

        if (this.authToken !== null) {
            headers["Authorization"] = "Bearer " + this.authToken;
        }

        headers["Accept"] = "application/json";
        headers["Content-Type"] = "application/json";

        return headers
    }

    _buildBody(params) {
        if (params.body) {
            return params.body;
        } else {
            return {
                "key": this.key,
                "secret": this.secret
            }
        }
    }

    makeRequest(method, resource, params = {}) {
        // resource = extension e.g. /auth, /balance
        // params = any request params
        // method = HTTP method
        var options = {
            "method": method,
            json: true
        };

        options.uri = (params.query !== null) ? this._buildUri(this._buildEndpoint(resource), params.query) : this._buildEndpoint(resource);
        options.headers = this._buildHeaders();
        options.body = this._buildBody(params);

        return rp(options);
    }

    static async createClient(key, secret) {
        var resource = ["auth"]
        var method = "POST"
        var newClient = new WSM(key, secret);

        var authToken = await newClient.makeRequest(method, resource);
        newClient.authToken = authToken.access_token;

        return newClient;
    }

    getPositionsOpen() {
        var resource = ["positions"]
        var method = "GET"

        return this.makeRequest(method, resource);
    }

    getPositionsClosed() {
        var resource = ["positions", "closed"];
        var method = "GET"

        return this.makeRequest(method, resource);
    }

    _validateTransaction(symbol, quantity) {
        if (symbol === null) {
            throw "Enter the symbol of what you would like to buy";
        }
        if (quantity === null) {
            throw `Enter a quantity of ${symbol} you would like to buy`;
        }
        if (quantity <= 0) {
            throw `Enter a positive quantity of ${symbol} to buy`;
        }
    }

    positionBuy(symbol, quantity) {
        this._validateTransaction(symbol, quantity);

        var resource = ["positions", "buy"];
        var method = "POST";
        var params = {
            body: {
                "symbol": symbol,
                "quantity": quantity
            }
        }

        return this.makeRequest(method, resource, params);
    }

    positionSell(symbol, quantity, positionId) {
        this._validateTransaction(symbol, quantity);

        if (positionId === null) {
            throw "You must specify a positionId";
        }

        var resource = ["positions", "sell"];
        var method = "POST";
        var params = {
            body: {
                "symbol": symbol,
                "quantity": quantity,
                "positionId": positionId
            }
        }

        return this.makeRequest(method, resource, params);
    }

    searchSymbol(symbol) {
        if (symbol === null) {
            throw "You must specify a position to search";
        }

        var resource = ["symbols"];
        var method = "GET";
        var params = {
            query: {
                "symbol": symbol
            }
        }

        return this.makeRequest(method, resource, params);
    }

    getUsersTotals() {
        var resource = ["users", "totals"]
        var method = "GET";

        return this.makeRequest(method, resource);
    }
}

module.exports = WSM;