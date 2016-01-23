var mongoose = require('mongoose');

var CompanySchema = new mongoose.Schema({
   twittername: String,
   libertarian: Number,
   green: Number,
   liberal: Number,
   conservative: Number
      

});


mongoose.model('Company', CompanySchema);