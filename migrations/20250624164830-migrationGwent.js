module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Fungsi 'up' akan dijalankan saat kita menjalankan migrasi
    console.log("Menerapkan migrasi: initial_collections_setup (UP)");

    const collectionsToCreate = [
      "abilities",
      "cards",
      "decks",
      "factions",
      "historyplays",
      "historytopups",
      "leaders",
      "powerups",
      "typecards",
      "users",
    ];

    // Menggunakan Promise.all untuk menjalankan semua pembuatan collection secara paralel
    await Promise.all(
      collectionsToCreate.map((collectionName) => {
        console.log(`- Membuat collection: ${collectionName}`);
        return db.createCollection(collectionName);
      })
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    console.log("Membatalkan migrasi: initial_collections_setup (DOWN)");

    const collectionsToDrop = [
      "abilities",
      "cards",
      "decks",
      "factions",
      "historyplays",
      "historytopups",
      "leaders",
      "powerups",
      "typecards",
      "users",
    ];

    await Promise.all(
      collectionsToDrop.map((collectionName) => {
        console.log(`- Menghapus collection: ${collectionName}`);
        return db.collection(collectionName).drop();
      })
    );
  },
};
