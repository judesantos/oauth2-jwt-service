const validateEmail = (email) => {
  if (!email) return false;
  const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return email.match(mailformat);
};

module.exports = {
  validateEmail: validateEmail,
};
