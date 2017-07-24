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
      return "Пришлите мне одну из команд: \n'Играть' - начать играть.\n'Инфо' - FAQ по игре.\n'Статистика' - позиция в игре.\n'Топ' - топ игроков."
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
        var coinsAll = user.coinsAll;
        var coinsGame = user.coinsGame;
        var help = user.help;
        var anotherQuestion = user.anotherQuestion;
        //var askedQuest = user.askedQuest;
      	if(req.body.data.type != 'text/plain') {
      		console.log(errMessage);
      		sms(errMessage, chatId, ip);
      		return;
      	}
        if (user.game){
          var correctAnswer = ["А","а","Б","б","В","в","Г","г", "Забрать", "Помощь", "Сменить"];
          if (correctAnswer.indexOf(content)>= 0) {
            if (content == "Забрать") {
              var message = "Вы решили выйти из игры. Вы заработали " + coinsGame + " монет."
              db.update({ numQuest:0, chance:true, game:false, coinsGame:0, coinsAll: coinsAll + coinsGame, help:true, anotherQuestion:true}, {where: {userId: userId}}).then((user)=>{
                sms(message,chatId,ip, function () {
                  setTimeout(function () {
                    sms(allComands(), chatId, ip);
                  },2000)
                })
              })
            } else if (content=="Помощь") {
              if (help) {
                getQuestion(lastQuest).then((question)=>{
                  var message = 'Эксперт считает, что правильный ответ: "' +question.r_answer + '".'
                  db.update({ help:false}, {where: {userId: userId}}).then((user)=>{
                    sms(message,chatId,ip)
                  })
                })
              } else {
                var message = "Вы больше не можете использовать помощь эксперта."
                sms(message, chatId, ip);
              }
            } else if (content == "Сменить") {
              if (anotherQuestion) {
                getQuestion(randomId([])).then((question)=>{
                  var answers = shuffle([question.w_answer1,question.w_answer2,question.w_answer3,question.r_answer]);
                  db.update({lastQuest:question.id ,rightAnswer:answers.index, anotherQuestion:false}, {where: {userId: userId}}).then((user)=>{
                    sms(message, chatId, ip,function () {
                      setTimeout(function () {
                        sms(question.question+"\nА) "+answers.array[0]+"\nБ) "+answers.array[1]+"\nВ) "+answers.array[2]+"\nГ) "+answers.array[3], chatId, ip);
                      },2000)
                    });
                  })
                });
              } else {
                var message = "За кон можно сменить только один вопрос."
                sms(message, chatId, ip);
              }
            } else {
              var answerApplied;
              switch(content) {
                  case 'A': case 'a': answerApplied = 0; break;
                  case 'B': case 'b': answerApplied = 1; break;
                  case 'C': case 'c': answerApplied = 2; break;
                  case 'D': case 'd': answerApplied = 3; break;
              }
              if (answerApplied == rightAnswer) {
                var monets;
                switch(numQuest) {
                    case 1: monets = 5; break;
                    case 2: monets = 10; break;
                    case 3: monets = 15; break;
                    case 4: monets = 30; break;
                    case 5: monets = 50; break;
                    case 6: monets = 75; break;
                    case 7: monets = 100; break;
                    case 8: monets = 150; break;
                    case 9: monets = 200; break;
                    case 10: monets = 300; break;
                    case 11: monets = 400; break;
                    case 12: monets = 500; break;
                }
                var message = "Ответ верный! Вы заработали " + monets + " монет";
                var coins = coinsGame + monets;
                if (numQuest == 12) {
                  db.update({numQuest:0, coinsGame:0, chance:true,game:false, coinsAll:coins + coinsAll,help:true, anotherQuestion:true}, {where: {userId: userId}}).then((user)=>{
                    sms(message, chatId, ip,function () {
                      setTimeout(function () {
                        sms("Вы выиграли! За эту игру Вы заработали " + coins + " монет.", chatId, ip, function () {
                          setTimeout(function () {
                            sms(allComands(), chatId, ip);
                          },2000)
                        });
                      },2000)
                    });
                  })
                } else {
                  getQuestion(randomId([])).then((question)=>{
                    var answers = shuffle([question.w_answer1,question.w_answer2,question.w_answer3,question.r_answer]);
                    db.update({lastQuest:question.id ,rightAnswer:answers.index, numQuest:numQuest+1, coinsGame:coins}, {where: {userId: userId}}).then((user)=>{
                      sms(message, chatId, ip,function () {
                        setTimeout(function () {
                          sms(question.question+"\nА) "+answers.array[0]+"\nБ) "+answers.array[1]+"\nВ) "+answers.array[2]+"\nГ) "+answers.array[3], chatId, ip);
                        },2000)
                      });
                    })
                  });
                }
              } else {
                if (chance) {
                  var message = "Ответ неверный, но Вы можете ошибиться один раз за игру."
                    db.update({chance:false}, {where: {userId: userId}}).then((user)=>{
                      sms(message, chatId, ip)
                    })
                } else {
                  var message = "Ответ неверный. Вы проиграли. За эту игру Вы заработали 0 монет."
                  db.update({ numQuest:0, chance:true, game:false, coinsGame:0,help:true, anotherQuestion:true}, {where: {userId: userId}}).then((user)=>{
                    sms(message,chatId,ip, function () {
                      setTimeout(function () {
                        sms(allComands(), chatId, ip);
                      },2000)
                    })
                  })
                }
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
                    sms(question.question+"\nА) "+answers.array[0]+"\nБ) "+answers.array[1]+"\nВ) "+answers.array[2]+"\nГ) "+answers.array[3], chatId, ip);
                  },2000)
                })
              })
            });
          }
          else if (content == "Инфо") {
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
