const adminMiddleware = (req, res, next) => {
  try{
    const user = req.user; // Assuming you have user data from auth middleware
    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    next();
  }catch(error){
    console.log(user);
  }
    
  };
  
  module.exports = adminMiddleware;