import KeyvLowDB from "../src/KeyvLowDB.ts";
import keyvTestSuite from "@keyv/test-suite";
import Keyv from "keyv";
import * as test from 'vitest';


const store = () => new KeyvLowDB();


keyvTestSuite(test, Keyv, store);