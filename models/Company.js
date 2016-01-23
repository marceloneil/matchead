var mongoose = require('mongoose');

var CompanySchema = new mongoose.Schema({
   twittername: String,
   sentiment: Number,
   political: Object,
   personality: Object

});


mongoose.model('Company', CompanySchema);