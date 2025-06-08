const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateOwners() {
  const usersSnap = await db.collection('users').where('role', 'in', ['owner', 'restaurant_owner']).get();
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    await db.collection('owners').doc(doc.id).set(data);
    console.log(`Migrated owner: ${data.email || doc.id}`);
  }
  console.log('Migration complete!');
}

migrateOwners().catch(console.error); 