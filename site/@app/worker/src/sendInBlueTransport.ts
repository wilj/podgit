import { result } from "lodash";

var fs            = require("fs");
var stream        = require("stream");
var http          = require("http");
var https         = require("https");
var url           = require("url");
var addressparser = require("addressparser");
var pkg           = require("../package.json");

//
// Constants
//
var STATUS_OKS = [200, 201];

//
// Helper
//
function isUndefined(v:any) {
    return typeof v === "undefined";
}

function isString(v:any) {
    return typeof v === "string" || v instanceof String;
}

function isObject(v:any) {
    return !isUndefined(v) && v.toString() === "[object Object]";
}

function isArray(v:any) {
    return v instanceof Array;
}

function isEmpty(v:any) {
    return !(v.length || Object.keys(v).length);
}

function prefixedErr(err:any, prefix:any) {
    err.message = `${prefix}: ${err.message}`;
    return err;
}

function flattenGroups(addresses:any) {
    var flattened :any = [];

    function traverse(obj:any) {
        if (obj.group) {
            obj.group.forEach(traverse);
        } else {
            flattened.push(obj);
        }
    }

    addresses.forEach(traverse);

    return flattened;
}

function transformAddress(a:any) {
    if (isString(a)) {
        return addressparser(a);
    }

    if (isObject(a)) {
        return [a];
    }

    throw new Error(`invalid address: ${a}`);
}

function transformAddresses(addresses:any) {
    if (!addresses) {
        return undefined;
    }

    var parsed :any = [];
    if (isString(addresses)) {
        parsed = addressparser(addresses);
    } else if (isArray(addresses)) {
        addresses.forEach((address:any) => {
            parsed = parsed.concat(transformAddress(address));
        });
    } else if (isObject(addresses)) {
        parsed.push(addresses);
    } else {
        throw new Error(`invalid address: ${addresses}`);
    }

    return flattenGroups(parsed).map(({address, name}:any) => {
        const result = {email: address} as any
        if (name) {
          result.name = name
        }
        return result
      });
}

// const filterEmptyNameProps = (addresses:any[]) => addresses.map(a => a.name ? a : {email: a.email})

function transformFromAddresses(addresses:any) {
    if (!addresses) {
        return undefined;
    }

    var transformed = transformAddresses(addresses);

    return transformed[0];
}

function buildAttachment(attachment:any, remote:any, generated:any) : any{
    return new Promise((resolve, reject) => {
        // Raw -> not supported
        if (!isUndefined(attachment.raw)) {
            return reject(new Error("raw attachments not supported"));
        }

        // Remote attachment.
        if (isString(attachment.href)) {
            if (!isEmpty(generated)) {
                return reject(new Error("mixed remote and generated attachments"));
            }
            remote.push(attachment.href);
            return resolve(true);
        }

        // Generated attachment.
        if (!isEmpty(remote)) {
            return reject(new Error("mixed remote and generated attachments"));
        }

        var filename = attachment.filename;
        if (!isString(filename)) {
            return reject(new Error("missing filename for attachment"));
        }

        // Local file.
        if (isString(attachment.path)) {
            fs.readFile(attachment.path, (err:any, data:any) => {
                if (err) {
                    return reject(err);
                }
                generated[filename] = data.toString("base64");
                resolve(true);
            });
            return;
        }

        var content = attachment.content;
        var encoding = attachment.encoding;

        if (isString(content)) {
            generated[filename] = encoding === "base64" ? content
                : (new Buffer(content, encoding).toString("base64"));
            return resolve(true);
        }

        if (Buffer.isBuffer(content)) {
            generated[filename] = content.toString("base64");
            return resolve(true);
        }

        if (content instanceof stream.Readable) {
            var chunks :any = [];
            content.on("data", (chunk:any) => {
                chunks.push(chunk);
            }).on("close", () => {
                generated[filename] = Buffer.concat(chunks).toString("base64");
                resolve(true);
            }).on("error", reject);
            return;
        }

        reject(new Error("invalid attachment format"));
    });
}

function buildAttachments(attachments:any) {
    var remote:any = [];
    var generated :any = {};

    var promises = attachments.map((attachment:any) => {
        return buildAttachment(attachment, remote, generated);
    });

    return Promise.all(promises).then(() => {
        if (remote.length > 0) {
            return remote;
        }

        return generated;
    });
}

function isErrorResponse(response:any) {
  return STATUS_OKS.indexOf(response.statusCode) === -1
}

function responseError(response:any, body:any) {
    return new Error(
        `${body.message || "server error"} (${body.code || "-"}, ${response.statusCode})`);
}

function makeInfo(body:any) {
    return {
        messageId: body?.data?.messageId || "",
        code: body.code,
        message: body.message
    };
}

//
// Transport class
//
export class SendinBlueTransport {
    name: string;
    version: string;
    reqOptions: any;
    reqBuilder: any;

    constructor(apiKey:string, apiUrl = "https://api.sendinblue.com/v3") {
        this.name    = "SendinBlue";
        this.version = pkg.version;

        this.reqOptions = url.parse(apiUrl + "/smtp/email");
        this.reqOptions.method = "POST";
        this.reqOptions.headers = {
            "api-key": apiKey || "",
            "Content-Type": "application/json"
        };

        this.reqBuilder = this.reqOptions.protocol === "https:" ? https.request : http.request;
    }

    send(mail:any, callback:any) {
        var req = this.reqBuilder(this.reqOptions, (res:any) => {
            res.setEncoding("utf-8");

            var chunks:any = [];
            res.on("data", (chunk:any) => {
                chunks.push(chunk);
            }).on("end", () => {
                var body = {};

                try {
                    var data = chunks.join("");
                    body = JSON.parse(data);
                } catch (err) { /* Ignore error */ }

                if (isErrorResponse(res)) {
                    return callback(responseError(res, body));
                }

                callback(undefined, makeInfo(body));
            });
        });

        req.on("error", (err:any) => {
            callback(prefixedErr(err, "error sending request"));
        });

        SendinBlueTransport.buildBody(mail).then((body) => {
            req.write(JSON.stringify(body));
            req.end();
        }).catch((err) => {
            callback(prefixedErr(err, "unable to build body"));
        });
    }

    static buildBody(mail:any) {
        var data = mail.data;
        var body = {
            sender: transformFromAddresses(data.from),
            to:      transformAddresses(data.to),
            cc:      transformAddresses(data.cc),
            bcc:     transformAddresses(data.bcc),
            replyto: transformFromAddresses(data.replyTo),
            subject: data.subject,
            text:    data.text,
            htmlContent:    data.html
        } as any;
        if (data.headers && Object.keys(data.headers).length > 0) {
          body.headers = data.headers
        }

        if (!data.attachments) {
            return Promise.resolve(body);
        }

        return buildAttachments(data.attachments).then((attachments) => {
            body.attachment = attachments;
            return body;
        });
    }
}

