import KeyvLowDB from "../src";
import keyvTestSuite, {keyvIteratorTests} from "@keyv/test-suite";
import Keyv from "keyv";
import * as test from 'vitest';

const store = () => new KeyvLowDB();

keyvTestSuite(test, Keyv, store);
keyvIteratorTests(test, Keyv, store);