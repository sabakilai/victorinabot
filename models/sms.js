var config = require('../config.js');
var request=require("request");

module.exports=function(message, chatId, ip, callback){
	var token = config.token.production;
  var url = "https://api.namba1.co/chats/";

	var data={
	url: url + chatId + "/write",
	method:"POST",
	headers:{
		'X-Namba-Auth-Token': token
	},
	body:{
		"type":"text/plain",
		"content":message
	},
	json: true
	}
	request(data,callback);
};
