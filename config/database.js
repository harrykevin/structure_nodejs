import { config } from "dotenv";

config();

const dbConfig = {
  // MongoDB connection string
  // eslint-disable-next-line no-undef
  db: process.env.dbURI,
 
};


export default dbConfig;
