const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const customerProtect = async (req, res, next) => {
  let token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      token = auth.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.customer = await Customer.findById(decoded.id).select('-password');
      if (!req.customer) {
        return res.status(401).json({ message: 'Not authorized, customer not found' });
      }
      return next();
    } catch (e) {
      console.error(e);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { customerProtect };
