import type {KeyvStoreAdapter, StoredData} from "keyv";
import type {LowDBData, Options} from "./types.ts";
import {Low, Memory} from "lowdb";
import EventEmitter from "events";


const defaultOpts: Options = {
    lowdb: new Low<LowDBData>(new Memory(), {__keyv: {}}),
    namespace: "cache",
    dialect: "etcd" // for iteration to work
};

/**
 * @name KeyvLowDB
 * @description LowDB adapter for Keyv storage
 */
export class KeyvLowDB extends EventEmitter implements KeyvStoreAdapter {
    namespace: string;
    opts: Options;

    constructor(options?: Partial<Options>) {
        super();
        this.namespace = options?.namespace ?? "cache";
        this.opts = Object.assign({}, defaultOpts, options);
    }

    /**
     * Clear base
     */
    public async clear(): Promise<void> {
        this.opts.lowdb.data.__keyv[this.namespace] = {};
        await this.opts.lowdb.write();
    }

    /**
     * Delete element from base
     * @param key element key
     * @returns Whether the element was deleted. False if the element does not exist
     */
    public async delete(key: string): Promise<boolean> {
        if (!await this.has(key)) {
            return false;
        }
        delete this.opts.lowdb.data.__keyv[this.namespace][key];
        await this.opts.lowdb.write();
        return true;
    }

    /**
     * Delete many elements from base
     * @param keys elements keys
     * @returns Whether the all elements was deleted. False if any element does not exist
     */
    public async deleteMany(keys: string[]): Promise<boolean> {
        const deletePromises: Promise<boolean>[] = keys.map((key) =>
            this.delete(key)
        );
        const results = await Promise.all(deletePromises);
        return results.every((result) => result);
    }

    /**
     * @inheritDoc
     */
    public async disconnect(): Promise<void> {
        return;
    }

    /**
     * Get element from base
     * @param key element key
     * @returns element value
     */
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

    /**
     * Get many elements from base
     * @param keys elements keys
     * @returns elements values
     */
    public async getMany<Value>(keys: string[]): Promise<StoredData<Value | undefined>[]> {
        return await Promise.all(
            keys.map(async (key) => {
                return await this.get(key);
            })
        );
    }

    /**
     * Check if an element exists in the database
     * @param key element key
     * @returns
     */
    public async has(key: string): Promise<boolean> {
        return this.opts.lowdb.data.__keyv[this.namespace].hasOwnProperty(key);
    }

    /**
     * Set the value of an element
     * @param key element key
     * @param value element value
     * @param ttl ttl element lifespan (optional)
     */
    public async set(key: string, value: any, ttl?: number): Promise<void> {
        const expire = ttl ? Date.now() + ttl : undefined;
        this.opts.lowdb.data.__keyv[this.namespace][key] = {
            value,
            expire
        };
        await this.opts.lowdb.write();
    }

    /**
     * @param namespace namespace name
     */
    public async* iterator<Value>(namespace?: string): AsyncGenerator<[string, Value | undefined], void, unknown> {
        for (const key of Object.keys(this.opts.lowdb.data.__keyv[namespace ?? this.namespace])) {
            const value = await this.get(key) as Value;

            if (value === undefined) {
                continue;
            }

            yield [key, value];
        }
    }

    /**
     * Check if the element is expired
     * @param key element key
     * @protected
     */
    protected isExpired(key: string): boolean {
        return typeof this.opts.lowdb.data.__keyv[this.namespace][key].expire === "number" && (this.opts.lowdb.data.__keyv[this.namespace][key].expire! <= Date.now());
    }
}

export default KeyvLowDB;