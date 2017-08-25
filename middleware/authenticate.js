const {{Users}} = require('../server/models/user');
       
var authenticate = (req,res,next)=>{
  var token = req.header('x-auth');
  Users.findByToken
};