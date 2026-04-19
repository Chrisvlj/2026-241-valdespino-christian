import mongoose from "mongoose";

export async function connectDB(uri: string) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  await mongoose.connect(uri);
  return mongoose.connection;
}
