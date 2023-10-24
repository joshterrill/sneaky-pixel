module.exports = {
    db: null,
    save: async ({ id, key, context }) => {
        const stmt = await this.db.prepare('INSERT INTO data (id, key, context) VALUES (?, ?, ?)');
        await stmt.run(id, key, context);
        await stmt.finalize();
    },

    getById: async (id) => {
        const stmt = await db.prepare('SELECT * FROM data WHERE id = ?');
        const row = await stmt.get(id);
        await stmt.finalize();
        return row;
    },
    getByIdAndKey: async (id, key) => {
        const stmt = await db.prepare('SELECT * FROM data WHERE id = ? AND key = ?');
        const row = await stmt.get(id, key);
        await stmt.finalize();
        return row;
    },
    remove: async (id, key) => {
        const stmt = await db.prepare('DELETE FROM data WHERE id = ? AND key = ?');
        await stmt.run(id, key);
        await stmt.finalize();
    },
}