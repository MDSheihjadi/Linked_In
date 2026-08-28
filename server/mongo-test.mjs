import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); // force Node's own resolver to use Google DNS

import mongoose from 'mongoose';

const uri =
  'mongodb+srv://mdsheihjadi2725_db_user:UNTILLISAY@cluster1.ykjzgvc.mongodb.net/?appName=Cluster1';

const clientOptions = {
  serverApi: { version: '1', strict: true, deprecationErrors: true },
};

async function run() {
  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.dir);
