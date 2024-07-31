
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
let db;

module.exports = {
    init: () => {
        open({
            filename: './db/sneaky.db',
            driver: sqlite3.Database
        }).then(dbCallback => {
            db = dbCallback;
            db.run('CREATE TABLE IF NOT EXISTS data (id TEXT, key TEXT, context TEXT, dateTime INTEGER, ip TEXT, headers TEXT, originalImageUrl TEXT)');
        });
    },
    save: async ({ id, key, context, dateTime, ip, headers, originalImageUrl }) => {
        console.log('going to save', { id, key, context, dateTime, ip, headers, originalImageUrl });
        const stmt = await db.prepare('INSERT INTO data (id, key, context, dateTime, ip, headers, originalImageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)');
        await stmt.run(id, key, context, dateTime, ip, headers, originalImageUrl);
        await stmt.finalize();
        console.log('saved', id, key, context);
    },

    getById: async (id) => {
        console.log('id', id);
        const stmt = await db.prepare('SELECT * FROM data WHERE id = ? and key is not null');
        const row = await stmt.get(id);
        await stmt.finalize();
        console.log('got row', row);
        return row;
    },
    getByIdAndKey: async (id, key) => {
        console.log(id, key);
        id = id.replace('.png', '')
        const stmt = await db.prepare('SELECT * FROM data WHERE id = ? AND key = ?');
        const row = await stmt.get(id, key);
        console.log('row,', row);
        await stmt.finalize();
        return row;
    },
    remove: async (id, key) => {
        const stmt = await db.prepare('DELETE FROM data WHERE id = ? AND key = ?');
        await stmt.run(id, key);
        await stmt.finalize();
    },
}