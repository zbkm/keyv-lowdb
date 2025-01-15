import type {KeyvOptions} from "keyv";
import type {Low} from "lowdb";

export type LowDBData = {
    __keyv: Record<string, Record<string, {
        value: any,
        expire: number | undefined
    }>>
}

export type Options = {
    lowdb: Low<LowDBData>
    dialect: "etcd"
} & KeyvOptions;