import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

export const onUserDelete = onDocumentDeleted("users/{userId}", async (event) => {
  const userId = event.params.userId;
  console.log(`User ${userId} deleted. Deleting their messages...`);

  // Query the messages collection for documents that belong to the user
  const messagesRef = admin.firestore().collection("messages").where("userID", "==", userId);
  const messagesSnapshot = await messagesRef.get();

  // Delete all messages in a batch for efficiency
  const batch = admin.firestore().batch();
  messagesSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Deleted ${messagesSnapshot.size} messages for user ${userId}`);
});
