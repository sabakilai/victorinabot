var admin = require("firebase-admin");
var serviceAccount = require("../auth.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://victorina-3fb0a.firebaseio.com/"
});

var db = admin.database();
var ref = db.ref("/questions");

module.exports = function (id) {
  return new Promise ((resolve,reject)=>{
    ref.orderByChild("id").equalTo(id).on("value", function(snapshot) {
    snapshot.forEach(function(userSnapshot) {
          var data = userSnapshot.val();
          if (!data){
            reject('Error saving!')
          }
          resolve(data);
      });
    });
  })
}
