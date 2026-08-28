import dns from 'dns';
// Force Node's own DNS resolver to use Google's DNS servers. On some
// Windows setups, Node's internal resolver (separate from Windows'
// own DNS client, which is what `nslookup` uses) fails to resolve
// mongodb+srv:// SRV records even though everything else on the
// machine resolves DNS fine. This line fixes exactly that mismatch.
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the URI from environment variables.
 * We fail fast and loud if the connection fails at startup — a server
 * that "starts successfully" but can't reach its database is worse
 * than one that crashes immediately with a clear error.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1); // stop the whole process — don't run a server with no DB
  }
};

export default connectDB;