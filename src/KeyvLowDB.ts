import type {KeyvStoreAdapter, StoredData} from "keyv";
import type {LowDBData, Options} from "./types.ts";
import {Low, Memory} from "lowdb";
import EventEmitter from "events";


export const defaultOpts: Options = {
    lowdb: new Low<LowDBData>(new Memory(), {__keyv: {}}),
    namespace: "cache",
    dialect: "etcd" // for iteration to work
};

export class KeyvLowDB extends EventEmitter implements KeyvStoreAdapter {
    namespace: string;
    opts: Options;

    constructor(options?: Partial<Options>) {
        super();
        this.namespace = options?.namespace ?? "cache";
        this.opts = Object.assign({}, defaultOpts, options);
    }

    public async clear(): Promise<void> {
        this.opts.lowdb.data.__keyv[this.namespace] = {};
        await this.opts.lowdb.write();
    }

    public async delete(key: string): Promise<boolean> {
        if (!await this.has(key)) {
            return false;
        }
        delete this.opts.lowdb.data.__keyv[this.namespace][key];
        await this.opts.lowdb.write();
        return true;
    }

    public async deleteMany(keys: string[]): Promise<boolean> {
        const deletePromises: Promise<boolean>[] = keys.map((key) =>
            this.delete(key)
        );
        const results = await Promise.all(deletePromises);
        return results.every((result) => result);
    }

    public async disconnect(): Promise<void> {
        return;
    }

    public async get<Value>(key: string): Promise<StoredData<Value> | undefined> {
        const value = this.opts.lowdb.data.__keyv[this.namespace][key];
        if (!value) {
            return undefined;
        } else if (this.isExpired(key)) {
            await this.delete(key);
            return undefined;
        } else {
            return this.opts.lowdb.data.__keyv[this.namespace][key].value as StoredData<Value>;
        }
    }

    public async getMany<Value>(keys: string[]): Promise<StoredData<Value | undefined>[]> {
        return await Promise.all(
            keys.map(async (key) => {
                return await this.get(key);
            })
        );
    }

    public async has(key: string): Promise<boolean> {
        return this.opts.lowdb.data.__keyv[this.namespace].hasOwnProperty(key);
    }

    public async set(key: string, value: any, ttl?: number): Promise<void> {
        const expire = ttl ? Date.now() + ttl : undefined;
        this.opts.lowdb.data.__keyv[this.namespace][key] = {
            value,
            expire
        };
        await this.opts.lowdb.write();
    }

    protected isExpired(key: string): boolean {
        return typeof this.opts.lowdb.data.__keyv[this.namespace][key].expire === "number" && (this.opts.lowdb.data.__keyv[this.namespace][key].expire! <= Date.now());
    }

    public async* iterator<Value>(namespace?: string): AsyncGenerator<[string, Value | undefined], void, unknown> {
        for (const key of Object.keys(this.opts.lowdb.data.__keyv[namespace ?? this.namespace])) {
            const value = await this.get(key) as Value;

            if (value === undefined) {
                continue;
            }

            yield [key, value];
        }
    }
}

export default KeyvLowDB;