var Sequelize = require("sequelize");
var sequelize = new Sequelize("ddg6gen02vnjki", "vibhiihldjoeks", "9838b357de38135b867180590c12619c41949bca0a39a866072fc16126d7e862", {
	host: "ec2-23-21-220-48.compute-1.amazonaws.com",
	dialect: "postgres"
});

var user = sequelize.define("user", {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	userId: Sequelize.INTEGER,
	ip: Sequelize.STRING,
	game: {
		type: Sequelize.BOOLEAN,
	    defaultValue: false
	},
	lastQuest:Sequelize.INTEGER,
	numQuest:Sequelize.INTEGER,
	chance: {
		type: Sequelize.BOOLEAN,
	    defaultValue: true
	}
})

user.sync().then(function() {});



module.exports = user;
