# keyv-lowdb

[LowDB](https://github.com/typicode/lowdb) storage adapter for [Keyv](https://github.com/jaredwray/keyv)


### Installation
```bash
npm install --save keyv lowdb keyv-lowdb
```

### Usage
```typescript
import {KeyvLowDB} from "keyv-lowdb";
import {Low} from "lowdb";
import {JSONFile} from "lowdb/node";

const initialStorage = {
    __keyv: {} // must be in the database for store data
};

const keyv = new KeyvLowDB({
    lowdb:  new Low(new JSONFile("file.json"), initialStorage)
});

await keyv.set("name", "value", 1000);

// iterator also available
for await (const [key, value] of keyv.iterator()) {
    console.log(key, value);
}
```
