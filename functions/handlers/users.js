const { admin, db } = require("../util/admin");

const firebase = require("firebase");

const config = require("../util/config");
firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails,
} = require("../util/validators");

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const { valid, errors } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(errors);

  const noImg = "no-img.png";

  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((user) => {
      if (user.exists) {
        return res
          .status(400)
          .json({ handle: "This handle is already taken." });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((userData) => {
      userId = userData.user.uid;
      return userData.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already in use." });
      } else {
        return res
          .status(500)
          .json({ general: "Something went wrong, please try again" });
      }
    });
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, errors } = validateLoginData(user);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((userData) => {
      return userData.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token: token });
    })
    .catch((err) => {
      console.log(err);
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-email" ||
        err.code === "auth/user-not-found"
      ) {
        return res
          .status(403)
          .json({ general: "Wrong credentials, please try again." });
      }
      return res.status(500).json({ error: err.code });
    });
};

// Add user details
exports.addUserDetails = (req, res) => {
  const userDetails = reduceUserDetails(req.body);
  if (Object.keys(userDetails).length == 0)
    return res.json({ message: "No details to update" });

  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Details added successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get any user's details
exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.params.handle}`)
    .get()
    .then((user) => {
      if (user.exists) {
        userData.user = user.data();
        return db
          .collection("screams")
          .where("userHandle", "==", req.params.handle)
          .orderBy("createdAt", "desc")
          .get();
      } else {
        return res.status(404).json({ errror: "User not found" });
      }
    })
    .then((screams) => {
      userData.screams = [];
      screams.forEach((scream) => {
        userData.screams.push({
          body: scream.data().body,
          createdAt: scream.data().createdAt,
          userHandle: scream.data().userHandle,
          userImage: scream.data().userImage,
          likeCount: scream.data().likeCount,
          commentCount: scream.data().commentCount,
          screamId: scream.id,
        });
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get own user details
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then((user) => {
      if (user.exists) {
        userData.credentials = user.data();
        return db
          .collection("likes")
          .where("userHandle", "==", req.user.handle)
          .get();
      }
    })
    .then((likes) => {
      userData.likes = [];
      likes.forEach((like) => {
        userData.likes.push(like.data());
      });
      return db
        .collection("notifications")
        .where("recipient", "==", req.user.handle)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
    })
    .then((notifications) => {
      userData.notifications = [];
      notifications.forEach((notif) => {
        userData.notifications.push({
          recipient: notif.data().recipient,
          sender: notif.data().sender,
          createdAt: notif.data().createdAt,
          screamId: notif.data().screamId,
          type: notif.data().type,
          read: notif.data().read,
          notificationId: notif.id,
        });
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");
  const { v4: uuidv4 } = require("uuid");

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ imageUrl: "Wrong file type submitted" });
    }
    const imageExtension = filename.split(".").pop();
    imageFileName = `${uuidv4()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          contentType: imageToBeUploaded.mimetype,
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: "something went wrong" });
      });
  });
  busboy.end(req.rawBody);
};

exports.markNotificationsRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach((notificationId) => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: "Notifications marked read" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
