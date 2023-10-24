const sqlite3 = require('sqlite3');

module.exports = (db) => {
    async function save({ id, key, context }) {
        const stmt = await db.prepare('INSERT INTO data (id, key, context) VALUES (?, ?, ?)');
        await stmt.run(id, key, context);
        await stmt.finalize();
    }
    async function getById(id) {
        const stmt = await db.prepare('SELECT * FROM data WHERE id = ?');
        const row = await stmt.get(id);
        await stmt.finalize();
        return row;
    }
    async function getByIdAndKey(id, key) {
        const stmt = await db.prepare('SELECT * FROM data WHERE id = ? AND key = ?');
        const row = await stmt.get(id, key);
        await stmt.finalize();
        return row;
    }
    async function remove(id, key) {
        const stmt = await db.prepare('DELETE FROM data WHERE id = ? AND key = ?');
        await stmt.run(id, key);
        await stmt.finalize();
    }
    return {
        save,
        remove,
        getById,
        getByIdAndKey,
    }   

}