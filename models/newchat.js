var request=require("request");
var config = require('../config.js');

module.exports=function(userId, ip, callback)
{
  var token = config.token.production;
  var url = "https://api.namba1.co/chats/create";
  var data={
  url: url,
  method:"POST",
  headers: {
			'X-Namba-Auth-Token': token
		},
		body: {
        "name":"Курсы валют",
        "members":[userId],
        'image':'YzU2OWM3YWY0YzcyZmYxZWEyODcyYmJlOTJhM2VkMjE2MDFjMDRhZWNhZDk3ODFiYzk0NDVkNjQzMDI0YjBlZjkyNWNhZWMxODkwYmZlYTRkNjY5NjQwYjNhNGY4MDUxNmJlYjg3OGQ0MTQxNWZiODNmZDBhOGViZDFlNTg3M2RlNzMyMzc1NTVjY2JmZWY4MmU0ODhiMjhjMjIyYjkxZDgyZWExZTdhMGE4N2E1NDcyNTIzYWM1YzM4NTNlYjczMDE2N2E1OGY0OWI4ZTUyMzJmNjE1OGI0YjNhOTI0MmU='

		},
		json: true
}
console.log("chat created");
	request(data,callback);
}
