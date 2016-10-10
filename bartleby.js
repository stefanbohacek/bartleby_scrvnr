var express = require('express'),
    exphbs  = require('express-handlebars'),
    http = require('http'),
    RiveScript = require('rivescript'),
    app = express(),
    server = http.Server(app),
    bartleby = new RiveScript(),
    config = require('./config'),
    Twit = require('twit'),
    tweetQueue = [];

var loggingEnabled = false;

bartleby.loadDirectory("brain", loading_done, loading_error);
 
bartleby.loadFile([
  "brain/begin.rive",
  "brain/main.rive"
], loading_done, loading_error);

function loading_done (batch_num) {
  bartleby.sortReplies();
}
 
function loading_error (batch_num, error) {
  console.log("Error when loading files: " + error);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkTweetQueue(){
  if (tweetQueue.length > 0){
    var newTweet = tweetQueue.shift();
    if (loggingEnabled === true){
      console.log('Posting new tweet:');
      console.log(newTweet);    
    }

    twitter.post('statuses/update',
    {
      status: newTweet.text,
      in_reply_to_status_id: newTweet.id
    }, function(err, data, response) {
      if (loggingEnabled === true){
        if (err){
          console.log('ERROR');
          console.log(err);          
        }
        else{
          console.log('NO ERROR');          
        }
      }
    });
  }

  setTimeout(function(){
    checkTweetQueue();
  }, getRandomInt(3000, 60000));

}

var twitter = new Twit(config.twitter);

var stream = twitter.stream('statuses/filter', { track: '@bartleby_scrvnr' });

stream.on('tweet', function (tweet) {
  var reply = bartleby.reply("local-user", tweet.text);
  if (loggingEnabled === true){
    console.log('New Tweet!');
    console.log(tweet.id + ': ' + tweet.text);
    console.log('Adding response to queue:');
    console.log('@' + tweet.user.screen_name + ' ' + reply);
  }

  tweetQueue.push({
    id: tweet.id_str,
    text: '@' + tweet.user.screen_name + ' ' + reply
  });
});

checkTweetQueue();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
  res.render('index');
});

app.use(express.static(__dirname + '/public'));

server.listen(3006, function(){
  console.log('Express server listening on port 3006');
});
