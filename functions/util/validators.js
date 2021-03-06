const isEmpty = (string) => {
  return string.trim() === "";
};

const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  return false;
};

exports.validateSignupData = (data) => {
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = "Must not be empty.";
  } else if (!isEmail(data.email)) {
    errors.email = "Must be a valid email address.";
  }

  if (isEmpty(data.password)) errors.password = "Must not be empty.";
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords must match";

  if (isEmpty(data.handle)) errors.handle = "Must not be empty.";

  return {
    errors,
    valid: Object.keys(errors).length === 0,
  };
};

exports.validateLoginData = (data) => {
  let errors = {};
  if (isEmpty(data.email)) errors.email = "Must not be empty.";
  if (isEmpty(data.password)) errors.password = "Must not be empty.";

  return {
    errors,
    valid: Object.keys(errors).length === 0,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (data.hasOwnProperty("bio")) userDetails.bio = data.bio;
  if (data.hasOwnProperty("website")) {
    let website = data.website;
    const website_trim = website.trim();
    if (!isEmpty(website_trim)) {
      if (!website_trim.startsWith("http")) {
        website = `http://${website_trim}`;
      } else website = website_trim;
    }
    userDetails.website = website;
  }
  if (data.hasOwnProperty("location")) userDetails.location = data.location;

  return userDetails;
};
