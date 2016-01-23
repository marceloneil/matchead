var mongoose = require('mongoose');

var CompanySchema = new mongoose.Schema({
   twittername: String,
   sentiment: Object,
   political: Object,
   personality: Object

});


mongoose.model('Company', CompanySchema);