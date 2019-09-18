"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const tl = require("azure-pipelines-task-lib/task");
const util = require("util");
const request = require("request");
require("babel-polyfill");
class VaultReader {
    constructor() {
        this.global_vars = [];
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        tl.setResourcePath(path.join(__dirname, "task.json"));
        this.input_uri = tl.getInput("uri") || "";
        this.input_token = tl.getInput("token") || "";
        this.input_engine_name = tl.getInput("engineName") || "";
        this.input_version = tl.getInput("version") || "";
        this.input_namespace = tl.getInput("namespace") || "";
        this.input_path = tl.getInput("path") || "";
    }
    readVaultSecrets() {
        return __awaiter(this, void 0, void 0, function* () {
            this.print_vault_paths();
            yield this.get_keys_and_values();
            this.print_secrets();
        });
    }
    // Print the Vault Paths
    print_vault_paths() {
        console.log("URI: ........................ [%s]", this.input_uri);
        console.log("Token: ...................... [%s]", this.input_token);
        console.log("Version: .................... [%s]", this.input_version);
        if (this.input_version != "v1") {
            console.log("Engine Name: ................ [%s]", this.input_engine_name);
        }
        console.log("Namespace: .................. [%s]", this.input_namespace);
        console.log("Path: ....................... [%s]", this.input_path);
        console.log();
        console.log("Warning: All keys containing (password, token or secret) will be created as a secure variable");
        console.log();
    }
    get_keys_and_values() {
        if (this.input_version == "v1") {
            if (this.input_namespace == "") {
                var uri = util.format("%s/v1/%s", this.input_uri, this.input_path);
            }
            else {
                console.log("Using namespace");
                var uri = util.format("%s/v1/%s/%s", this.input_uri, this.input_namespace, this.input_path);
            }
        }
        else {
            if (this.input_namespace == "") {
                var uri = util.format("%s/v1/%s/data/%s", this.input_uri, this.input_engine_name, this.input_path);
            }
            else {
                console.log("Using namespace");
                var uri = util.format("%s/v1/%s/data/%s/%s", this.input_uri, this.input_engine_name, this.input_namespace, this.input_path);
            }
        }
        console.log("Uri (Get): ", uri);
        // initial request to get SUBSCRIPTION info and vault path for spn
        return new Promise((resolve, reject) => {
            request.get({
                headers: {
                    "content-type": "application/json",
                    "X-Vault-Token": this.input_token
                },
                url: uri,
                agentOptions: {
                    secureProtocol: "TLSv1_2_method"
                }
            }, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else {
                    // check if response body is empty
                    if (body === null || body === undefined) {
                        throw new Error("Response body is empty");
                    }
                    // parse body to JSON
                    var content = JSON.parse(body);
                    // check if data is empty
                    if (content.data === null || content.data === undefined) {
                        throw new Error(util.format("Response body [data] element is empty.  End point [%s] may be invalid", uri));
                    }
                    console.log("Successfully retrieved data");
                    // Get variable to create from array of data json
                    if (this.input_version == "v1") {
                        var vaultVariables = content.data;
                    }
                    else {
                        var vaultVariables = content.data.data;
                    }
                    // Loop through each element in json array and create Azure DevOps variable
                    for (let [key, value] of Object.entries(vaultVariables)) {
                        console.log("Key: ", key);
                        // Set Azure DevOps variable
                        if (key.toLowerCase().indexOf("password") != -1 ||
                            key.toLowerCase().indexOf("token") != -1 ||
                            key.toLowerCase().indexOf("secret") != -1) {
                            tl.setVariable(key.toUpperCase(), value.toString(), true);
                            console.log("Value: ", "***");
                        }
                        else {
                            tl.setVariable(key.toUpperCase(), value.toString(), false);
                            console.log("Value: ", value);
                        }
                        // Add to variables array
                        this.global_vars.push({ key: key.toUpperCase(), value: value });
                    }
                    resolve();
                }
            });
        });
    }
    print_secrets() {
        console.log();
        console.log("****************************************");
        console.log("Summary of Available Variables");
        console.log("****************************************");
        this.global_vars.forEach(element => {
            console.log("$(%s)", element.key);
        });
        console.log("****************************************");
        console.log("Note: Any of the above variables can be used in subsequent tasks");
    }
}
// Main function
function run() {
    process.on("uncaughtException", err => {
        //console.log(`Error: ${err.message}`);
        tl.setResult(tl.TaskResult.Failed, err.message);
    });
    process.on("unhandledRejection", (reason, p) => {
        console.log("Unhandled Rejection at:", p, "reason:", reason);
        tl.setResult(tl.TaskResult.Failed, util.format("Unhandled Rejection at:", p, "reason:", reason));
        // application specific logging, throwing an error, or other logic here
    });
    try {
        let vr = new VaultReader();
        vr.readVaultSecrets();
    }
    catch (error) {
        tl.setResult(tl.TaskResult.Failed, error);
    }
}
run();
