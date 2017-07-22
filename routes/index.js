"use stricts";
var express = require('express');
var db = require("../data/db.js");
var sms = require("../models/sms.js");
var newChat = require("../models/newchat.js");
var async = require('async');
var router = express.Router();
var pg = require('pg');
let getQuestion = require('../libs/getQuestion');



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/", function(req, res, next) {
  var ip = req.connection.remoteAddress;
    var event = req.body.event;

    var randomId = function (arr) {
      var x = Math.floor((Math.random() * 2630) + 1);;
      while (arr.indexOf(x)>-1) {
        x = Math.floor((Math.random() * 2630) + 1);
      }
      return x;
    }

    var shuffle = function (array) {
      var currentIndex = array.length, temporaryValue, randomIndex;
      var rightAnswer = array[3];
      var indexRight;
      while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
      indexRight = array.indexOf(rightAnswer);

      return {array:array,index:indexRight};
    }

    var allComands = function () {
      return "Пришлите мне одну из команд: \n'Играть' - начать играть.\n'Помощь' - инфо по игре.\n'Статистика' - позиция в игре.\n'Топ' - топ игроков."
    }

    if(event == "user/unfollow") {
    	var userId = req.body.data.id;
    	db.destroy({where:{userId: userId}}).then(function(err) {
        console.log("db destroyed");
      });
    }
    if(event == "user/follow") {
      var userId = req.body.data.id;
      db.create({userId: userId, ip: ip}).then(function(user) {
        console.log("user follows");
        newChat(userId, ip, function(err, res, body) {
          var chatId = body.data.id;
          var message = "Добро пожаловать на викторину!\n\n" + allComands();
          sms(message, chatId, ip);
        })
      });
    }
    if(event == "message/new") {
      var userId = req.body.data.sender_id;
      db.find({where: {userId: userId}})
      .then(function(user) {
      	var content = req.body.data.content;
      	var chatId = req.body.data.chat_id;
        var lastQuest = user.lastQuest;
        var numQuest = user.numQuest;
        var chance = user.chance;
        var rightAnswer = user.rightAnswer;
        //var askedQuest = user.askedQuest;
      	if(req.body.data.type != 'text/plain') {
      		console.log(errMessage);
      		sms(errMessage, chatId, ip);
      		return;
      	}
        if (user.game){
          var correctAnswer = ["A","a","B","b","C","c","D","d"];
          if (correctAnswer.indexOf(content)>= 0) {
            var answerApplied;
            switch(content) {
                case 'A': case 'a': answerApplied = 0; break;
                case 'B': case 'b': answerApplied = 1; break;
                case 'C': case 'c': answerApplied = 2; break;
                case 'D': case 'd': answerApplied = 3; break;
            }
            if (answerApplied == rightAnswer) {
              var message = "Ответ верный! Вы заработали N монет";
              getQuestion(randomId([])).then((question)=>{
                var answers = shuffle([question.w_answer1,question.w_answer2,question.w_answer3,question.r_answer]);
                db.update({lastQuest:question.id ,rightAnswer:answers.index, numQuest:numQuest+1}, {where: {userId: userId}}).then((user)=>{
                  sms(message, chatId, ip,function () {
                    setTimeout(function () {
                      sms(question.question+"\na) "+answers.array[0]+"\nb) "+answers.array[1]+"\nc) "+answers.array[2]+"\nd) "+answers.array[3], chatId, ip);
                    },2000)
                  });
                })
              });
            } else {
              if (chance) {
                var message = "Ответ не верный, но ты можешь ошибиться один раз за игру."
                //getQuestion(lastQuest).then((question)=>{
                  db.update({chance:false}, {where: {userId: userId}}).then((user)=>{
                    sms(message, chatId, ip)
                      //,function () {
                      //setTimeout(function () {
                      //  sms(question.question+"\na) "+question.w_answer1+"\nb) "+question.w_answer2+"\nc) "+question.w_answer3+"\nd) "+question.r_answer, chatId, ip);
                      //},2000)
                    //});
                  })
                //});
              } else {
                var message = "Ответ не верный. Ты проиграл."
                db.update({ numQuest:0, chance:true, game:false}, {where: {userId: userId}}).then((user)=>{
                  sms(message,chatId,ip, function () {
                    setTimeout(function () {
                      sms(allComands(), chatId, ip);
                    },2000)
                  })
                })
              }
            }
          }
        } else {
          var errMessage = "Некорректный ввод. " + allComands();
          if(content == "Играть"){
            var message = 'Игра началась!'
            getQuestion(randomId([])).then((question)=>{
              var answers = shuffle([question.w_answer1,question.w_answer2,question.w_answer3,question.r_answer]);
              db.update({game: true, lastQuest:question.id , rightAnswer:answers.index, numQuest:1}, {where: {userId: userId}}).then(function(user) {
                sms(message,chatId,ip,function () {
                  setTimeout(function () {
                    sms(question.question+"\na) "+answers.array[0]+"\nb) "+answers.array[1]+"\nc) "+answers.array[2]+"\nd) "+answers.array[3], chatId, ip);
                  },2000)
                })
              })
            });
          }
          else if (content == "Помощь") {
            sms("FAQ", chatId, ip);
          }
          else if (content == "Статистика"){
            sms("Users stat", chatId, ip);
          }
          else if (content == "Топ") {
            sms("TOP - 5", chatId, ip);
          } else {
      		sms(errMessage, chatId, ip);
          }
        }
     })
    }
  res.end();
});



module.exports = router;
