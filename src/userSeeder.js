const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");
const { User } = require("../src/models");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function createRandomAccount() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    username: faker.internet.userName({ firstName, lastName }),
    email: faker.internet.email({ firstName, lastName }),
    password: "password123",
    role: "player",
    saldo: 0,
    coin: 0,
    totalPlay: 0,
    totalWin: 0,
    winrate: 0,
    inventory: [],
  };
}

const seedUsers = async (count = 10) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB terhubung untuk seeding...");

    // await User.deleteMany({});
    // console.log("User lama berhasil dihapus.");

    const usersToCreate = [];

    for (let i = 0; i < count; i++) {
      const fakeUserData = createRandomAccount();
      const hashedPassword = await bcrypt.hash(fakeUserData.password, 10);
      usersToCreate.push({
        ...fakeUserData,
        password: hashedPassword,
      });
    }

    await User.insertMany(usersToCreate);

    console.log(`Berhasil membuat ${count} user baru dengan data default!`);
  } catch (error) {
    console.error("Error saat seeding users:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedUsers(10);
