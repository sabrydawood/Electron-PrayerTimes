/* eslint-disable no-unused-vars */
//Used for parsing urls into correct format required by http.request
const http = require("http");
const url = require("url");
/**
 * Helper functions to determine request/response type
 */
//Parse json responses
function IsObject(value) {
    return value !== null && typeof value === "object";
}
var toString = Object.prototype.toString;
function IsFile(obj) {
    return toString.call(obj) === "[object File]";
}
function IsBlob(obj) {
    return toString.call(obj) === "[object Blob]";
}
function IsFormData(obj) {
    return toString.call(obj) === "[object FormData]";
}

/**
 * Default transforming of requests and responses (can be overrided by setting individual request options or phonix GlobalOptions)
 */
function TransformRequest(config) {
    return config;
}

function transformResponse(Xhr) {
    return Xhr;
}

function TransformRequestData(d) {
    if (IsObject(d) && !IsFile(d) && !IsBlob(d) && !IsFormData(d)) {
        return JSON.stringify(d);
    } else {
        return d;
    }
}

function TransformResponseData(req) {
    var result;
    var d = req.responseText;
    try {
        result = JSON.parse(d);
    } catch (e) {
        result = d;
    }
    return result;
}

var DefaultOptions = {
    TransformRequest,
    transformResponse,
    TransformRequestData,
    TransformResponseData,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
};
var GlobalOptions = {
    headers: {},
    timeout: 0,
    withCredentials: false,
};
function MergeHeaders(mergedHeaders, addHeaders) {
    for (var h in addHeaders) {
        if (Object.prototype.hasOwnProperty.call(addHeaders, h)) {
            mergedHeaders[h] = addHeaders[h];
        }
    }
}

function createHttpRequestOptions(config) {
    var parsedUrl = url.parse(config.url);
    return {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path,
        method: config.type,
        headers: config.headers,
    };
}

function convertHeadersObjectToString(headers) {
    var str = "";
    Object.keys(headers).forEach(function (key) {
        str = str + key + ": " + headers[key] + "\n";
    });
    return str;
}

function transformIntoFakeXHR(request, config, res, data) {
    return {
        type: config.type,
        url: config.url,
        status: res.statusCode,
        responseText: data,
        headers: res.headers,
        getAllResponseHeaders: function () {
            return convertHeadersObjectToString(res.headers);
        },
        getResponseHeader: function (str) {
            if (this.headers[str]) {
                return this.headers[str];
            } else {
                return this.headers[str.toLowerCase()];
            }
        },
    };
}
function Cache(name, options) {}
Cache.prototype.remove = function (key) {
    delete this.data[key];
};
Cache.prototype.clear = function () {
    this.data = {};
};
Cache.prototype.set = function (key, value, options) {};
Cache.prototype.get = function (key) {
    return this.data[key];
};
const CacheFactory = (function () {
    var instance = null;
    function Init() {
        var caches = { __default: new Cache("__default") };
        return {
            get: function (key, options) {
                if (caches[key]) {
                    return caches[key];
                } else {
                    var newCache = new Cache(key, options);
                    caches[key] = newCache;
                    return newCache;
                }
            },
        };
    }

    return {
        GetFactory: function () {
            if (!instance) {
                instance = Init();
            }
            return instance;
        },
    };
})();
var DefaultCacheFactory = CacheFactory.GetFactory();
var JSON_CONTENT_TYPE_HEADER = "application/json;charset=utf-8";
function Xhr(type, url, options, data) {
    if (!options) {
        options = {};
    }

    var callbacks = new Promise(function (resolve, reject) {
        var mergedHeaders = {};
        var defaultHeaders = {
            Accept: "application/json, text/plain, */*",
            Connection: "keep-alive",
            Local: options?.headers?.Local || "en",
        };
        MergeHeaders(mergedHeaders, defaultHeaders);
        if (type === "POST" || type === "PUT" || type === "PATCH") {
            if (IsObject(data) && !IsFile(data) && !IsBlob(data)) {
                if (!IsFormData(data)) {
                    MergeHeaders(mergedHeaders, {
                        "Content-Type": JSON_CONTENT_TYPE_HEADER,
                    });
                }
            }
        }
        MergeHeaders(mergedHeaders, GlobalOptions.headers);
        if (IsObject(options.headers)) {
            MergeHeaders(mergedHeaders, options.headers);
        }
        var mergedOptions = Object.assign(
            {},
            DefaultOptions,
            GlobalOptions,
            options,
        );
        var config = {
            headers: mergedHeaders,
            options: mergedOptions,
            type: type,
            url: url,
        };
        mergedOptions.TransformRequest(config);
        var cache = config.options.cache;
        if (config.type === "GET" && cache) {
            var parsedResponse;
            if (typeof cache === "boolean") {
                parsedResponse = DefaultCacheFactory.get("__default").get(url);
            } else {
                if (cache.constructor.name === "Cache") {
                    parsedResponse = cache.get(url);
                } else {
                    parsedResponse = cache.cache.get(url);
                }
            }
            if (parsedResponse) {
                //Need to have a timeout in order to return then go to callback. I think that setIntermediate is supposed to solve this problem
                //Note that apparently real promises have a similar issue
                setTimeout(function () {
                    if (options.details) {
                        resolve({
                            res: parsedResponse,
                            status: 304,
                            request: null,
                        });
                    } else {
                        resolve(parsedResponse);
                    }
                }, 0);
                return callbacks;
            }
        }

        //Create http.request options from config
        var httpRequestOptions = createHttpRequestOptions(config);
        //Create http.request
        var request = http.request(httpRequestOptions, function (res) {
            //HEAD requests will never return 'data'
            if (config.type === "HEAD") {
                var transformedResponse = transformIntoFakeXHR(
                    request,
                    config,
                    res,
                    null,
                );

                transformedResponse =
                    config.options.transformResponse(transformedResponse);
                var parsedResponse =
                    config.options.TransformResponseData(transformedResponse);

                if (
                    (transformedResponse.status >= 200 &&
                        transformedResponse.status < 300) ||
                    transformedResponse.status === 304
                ) {
                    if (options.details) {
                        resolve({
                            res: parsedResponse,
                            status: transformedResponse.status,
                            request: transformedResponse,
                        });
                    } else {
                        resolve(parsedResponse);
                    }
                } else {
                    if (options.details) {
                        reject({
                            err: parsedResponse,
                            status: transformedResponse.status,
                            request: transformedResponse,
                        });
                    } else {
                        reject(parsedResponse);
                    }
                }
                request = null;
                transformedResponse = null;
                parsedResponse = null;
                return;
            }

            //TODO: Fix up how cookies are set & sent
            //TODO: What about XSRF-TOKENS? How are those supposed to be handled?
            //TODO: phonix is also not dealing with how to handle multiple domain cookies

            //TODO: For Set-Cookie header, you need to set your cookies for this domain or for all subdomains of this domain (like *.domain.com) - (use httpRequestOptions.hostname)

            res.setEncoding("utf8");

            var str = "";
            res.on("data", function (chunk) {
                str += chunk;
            });

            res.on("end", function () {
                var transformedResponse = transformIntoFakeXHR(
                    request,
                    config,
                    res,
                    str,
                );

                config.options.transformResponse(transformedResponse);

                var parsedResponse =
                    config.options.TransformResponseData(transformedResponse);
                if (
                    (transformedResponse.status >= 200 &&
                        transformedResponse.status < 300) ||
                    transformedResponse.status === 304
                ) {
                    if (type === "GET" && cache) {
                        if (typeof cache === "boolean") {
                            DefaultCacheFactory.get("__default").set(
                                url,
                                parsedResponse,
                            );
                        } else {
                            if (cache.constructor.name === "Cache") {
                                cache.set(url, parsedResponse);
                            } else {
                                cache.cache.set(
                                    url,
                                    parsedResponse,
                                    cache.options,
                                );
                            }
                        }
                    }
                    if (options.details) {
                        resolve({
                            res: parsedResponse,
                            status: transformedResponse.status,
                            request: transformedResponse,
                        });
                    } else {
                        resolve(parsedResponse);
                    }
                } else {
                    if (options.details) {
                        reject({
                            err: parsedResponse,
                            status: transformedResponse.status,
                            request: transformedResponse,
                        });
                    } else {
                        reject(parsedResponse);
                    }
                }
                request = null;
                transformedResponse = null;
                parsedResponse = null;
            });
        });

        request.on("error", function (e) {
            if (options.details) {
                reject({ err: e, status: 500, request: null });
            } else {
                reject(e);
            }
        });

        if (data) {
            request.write(config.options.TransformRequestData(data));
        }
        request.end();

        //Timeout handling (abort request after timeout time in milliseconds)
        if (config.options.timeout > 0) {
            setTimeout(function () {
                if (request) {
                    request.abort();
                }
            }, config.options.timeout);
        }
    });

    return callbacks;
}
class Fetcher {
    static Get(src, options) {
        return Xhr("GET", src, options);
    }
    static Head(src, options) {
        return Xhr("HEAD", src, options);
    }
    static Put(src, options, data) {
        if (!data) {
            data = options;
            options = null;
        }
        return Xhr("PUT", src, options, data);
    }

    static Patch(src, options, data) {
        if (!data) {
            data = options;
            options = null;
        }
        return Xhr("PATCH", src, options, data);
    }

    static Post(src, options, data) {
        if (!data) {
            data = options;
            options = null;
        }
        return Xhr("POST", src, options, data);
    }
}

module.exports = Fetcher;
