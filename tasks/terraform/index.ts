import fs = require("fs");
import path = require("path");
import tl = require("azure-pipelines-task-lib/task");
import tr = require("azure-pipelines-task-lib/toolrunner");
import util = require("util");
import request = require("request");
import "babel-polyfill";

async function run() {
  try {
    ////////////////////////////////////////
    // Get Vault inputs
    ////////////////////////////////////////
    //var input_uri: string = tl.getInput("uri") || "";
    //var input_token: string = tl.getInput("token") || "";
    //var input_tfe_info_vault_path: string = tl.getInput("tfepath") || "";
    //var input_add_prefix = tl.getBoolInput("addPrefix", true);
    //var input_variable_prefix: string = tl.getInput("variablePrefix") || "";

    // console.log("URI: ", input_uri);
    // console.log("Token: ", input_token);
    // console.log("Path: ", input_tfe_info_vault_path);
    // console.log("Add Prefix: ", input_add_prefix);
    // console.log("Variable Prefix: ", input_variable_prefix);

    ////////////////////////////////////////
    // Initialization items
    ////////////////////////////////////////
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    tl.setResourcePath(path.join(__dirname, "task.json"));
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err || "run() failed");
  }
}

run();
