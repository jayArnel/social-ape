const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./util/fbAuth");
const { db } = require("./util/admin");
const {
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream,
} = require("./handlers/screams");

const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/users");

// Scream routes
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postOneScream);
app.get("/scream/:screamId", getScream);
app.delete("/scream/:screamId", FBAuth, deleteScream);
app.get("/scream/:screamId/like", FBAuth, likeScream);
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream);
app.post("/scream/:screamId/comment", FBAuth, commentOnScream);

// User routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

const region = "asia-east2";

exports.api = functions.region(region).https.onRequest(app);

exports.createNotificationOnLike = functions
  .region(region)
  .firestore.document("/likes/{id}")
  .onCreate((like) => {
    db.doc(`/screams/${like.data().screamId}`)
      .get()
      .then((scream) => {
        if (
          scream.exists &&
          scream.data().userHandle !== like.data().userHandle
        ) {
          return db.doc(`/notifications/${like.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: scream.data().userHandle,
            sender: like.data().userHandle,
            type: "like",
            read: false,
            screamId: scream.id,
          });
        }
      })
      .catch((err) => console.error(err));
  });

exports.deleteNotificationOnUnLike = functions
  .region(region)
  .firestore.document("likes/{id}")
  .onDelete((like) => {
    return db
      .doc(`/notifications/${like.id}`)
      .delete()
      .catch((err) => console.error(err));
  });

exports.createNotificationOnComment = functions
  .region(region)
  .firestore.document("comments/{id}")
  .onCreate((comment) => {
    return db
      .doc(`/screams/${comment.data().screamId}`)
      .get()
      .then((scream) => {
        if (
          scream.exists &&
          scream.data().userHandle !== comment.data().userHandle
        ) {
          return db.doc(`/notifications/${comment.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: scream.data().userHandle,
            sender: comment.data().userHandle,
            type: "comment",
            read: false,
            screamId: scream.id,
          });
        }
      })
      .catch((err) => console.error(err));
  });

exports.onUserImageChange = functions
  .region(region)
  .firestore.document("/users/{userId}")
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection("screams")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then((screams) => {
          screams.forEach((scream) => {
            const screamData = db.doc(`/screams/${scream.id}`);
            batch.update(screamData, {
              userImage: change.after.data().imageUrl,
            });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onScreamDelete = functions
  .region(region)
  .firestore.document("/screams/{screamId}")
  .onDelete((scream) => {
    const screamId = scream.id;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("screamId", "==", screamId)
      .get()
      .then((comments) => {
        comments.forEach((comment) => {
          batch.delete(db.doc(`/comments/${comment.id}`));
        });
        return db.collection("likes").where("screamId", "==", screamId).get();
      })
      .then((likes) => {
        likes.forEach((like) => {
          batch.delete(db.doc(`/likes/${like.id}`));
        });
        return db
          .collection("notifications")
          .where("screamId", "==", screamId)
          .get();
      })
      .then((notifications) => {
        notifications.forEach((notif) => {
          batch.delete(db.doc(`/notifications/${notif.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
