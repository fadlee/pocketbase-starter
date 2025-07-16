/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const superusersCollection = app.findCollectionByNameOrId("_superusers");
  
  // Create a new superuser
  const superuser = new Record(superusersCollection, {
    email: "admin@example.com",
    password: "password1234",
    passwordConfirm: "password1234",
    verified: true,
    emailVisibility: false
  });
  
  return app.save(superuser);
}, (app) => {
  // Revert: Delete the created superuser
  const superusersCollection = app.findCollectionByNameOrId("_superusers");
  try {
    const superuser = app.findFirstRecordByData(
      superusersCollection.id,
      "email",
      "admin@example.com"
    );
    
    if (superuser) {
      return app.delete(superuser);
    }
  } catch (err) {
    // Record might not exist, silently continue
  }
  
  return null;
})