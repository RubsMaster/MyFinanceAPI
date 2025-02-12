import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Conectado a MongoDB: ${conn.connection.host}`);
  } catch (e) {
    console.error( `Error trying to create the connection to db. ${e}`)
    process.exit(1)
  }
};
