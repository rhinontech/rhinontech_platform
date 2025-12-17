const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  const bearerToken = token.split(" ")[1]; // Extract token part from 'Bearer <token>'

  jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Failed to authenticate token" });
    }

    // If everything is good, save the decoded user info to request for use in other routes
    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
