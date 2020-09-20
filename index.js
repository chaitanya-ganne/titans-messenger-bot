'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  app = express().use(bodyParser.json()); // creates express http server

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GET_STARTED = "Get Started";
const FACEBOOK_GRAPH_API_BASE_URL = 'https://graph.facebook.com/v2.6/';
const JOIN_YES = "JOIN_YES";
const JOIN_NO = "JOIN_NO";
const TM_YES = "TM_YES";
const TM_NO = "TM_NO";
const IBCT_YES = "IBCT_YES";
const IBCT_NO = "IBCT_NO";
const TALK_YES = "TALK_YES";
const TALK_NO = "TALK_NO";
const MARK_SEEN = "mark_seen";
const TYPING_ON = "typing_on";
const MENU_TIMINGS = "MENU_TIMINGS";

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {

  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    if (body.entry && body.entry.length <= 0) {
      return;
    }

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (pageEntry) {

      pageEntry.messaging.forEach((messagingEvent) => {
        console.log({ messagingEvent });
        if (messagingEvent.postback) {
          handlePostback(messagingEvent.sender.id, messagingEvent.postback);
        } else if (messagingEvent.message) {
          if (messagingEvent.message.quick_reply) {
            handlePostback(messagingEvent.sender.id, messagingEvent.message.quick_reply);
          } else {
            handleMessage(messagingEvent.sender.id, messagingEvent.message);
          }
        } else {
          console.log(
            'Webhook received unknown messagingEvent: ',
            messagingEvent
          );
        }
      });
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.VERIFICATION_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

function handlePostback(sender_psid, received_postback) {
  // Get the payload for the postback
  const payload = received_postback.payload;
  callSenderActionsAPI(sender_psid, MARK_SEEN);
  callSenderActionsAPI(sender_psid, TYPING_ON);

  // Set the response and udpate db based on the postback payload
  switch (payload) {
    case GET_STARTED:
      handleGreetingPostback(sender_psid);
      break;
    case TM_YES:
      handleTmYesPostback(sender_psid);
      break;
    case TM_NO:
      handleTmNoPostback(sender_psid);
      break;
    case IBCT_YES:
      handleIbctYesPostback(sender_psid);
      break;
    case IBCT_NO:
      handleIbctNoPostback(sender_psid);
      break;
    case TALK_YES:
      handleTalkYesPostBack(sender_psid);
      break;
    case TALK_NO:
      handleTalkNoPostback(sender_psid);
      break;
    case JOIN_YES:
      handleJoinYesPostback(sender_psid);
      break;
    case JOIN_NO:
      handleJoinNoPostback(sender_psid);
      break;
    case MENU_TIMINGS:
      handleMenuTimingsPostback(sender_psid);
      break;
    default:
      console.log('Cannot differentiate the payload type');
  }
}

function handleMessage(sender_psid, received_message) {
  const messagePayload = {
    "text": "Thanks for your Message. One of our members will reply back to you shortly."
  };
  callSendAPI(sender_psid, messagePayload);
}

function handleGreetingPostback(sender_psid) {
  request({
    url: `${FACEBOOK_GRAPH_API_BASE_URL}${sender_psid}`,
    qs: {
      access_token: PAGE_ACCESS_TOKEN,
      fields: "first_name"
    },
    method: "GET"
  }, function (error, response, body) {
    var greeting = "";
    if (error) {
      console.log("Error getting user's name: " + error);
    } else {
      var bodyObj = JSON.parse(body);
      const name = bodyObj.first_name;
      greeting = "Hi " + name + ". ";
    }
    const message = greeting + "I am Titan, the official messenger bot of IBC Titans. Would you like to know about Toastmasters?";
    const greetingPayload = {
      "text": message,
      "quick_replies": [
        {
          "content_type": "text",
          "title": "Yes!",
          "payload": TM_YES
        },
        {
          "content_type": "text",
          "title": "No, thanks.",
          "payload": TM_NO
        }
      ]
    };
    callSendAPI(sender_psid, greetingPayload);
  });
}

function handleTmYesPostback(sender_psid) {
  const tmYesPayload = {
    "text": "Toastmasters International is a non-profit educational organization that teaches public speaking and leadership skills through a worldwide network of clubs. It was started by Ralph C. Smedley on October 22, 1924. For more information, visit: https://www.toastmasters.org/about. Would you like to know about IBC Titans?",
    "quick_replies": [
      {
        "content_type": "text",
        "title": "Yes!",
        "payload": IBCT_YES
      },
      {
        "content_type": "text",
        "title": "No, thanks.",
        "payload": IBCT_NO
      }
    ]
  };
  callSendAPI(sender_psid, tmYesPayload);
}

function handleTmNoPostback(sender_psid) {
  const tmNoPayload = {
    "text": "That's ok my friend, would you like to know about IBC Titans?",
    "quick_replies": [
      {
        "content_type": "text",
        "title": "Yes!",
        "payload": IBCT_YES
      },
      {
        "content_type": "text",
        "title": "No, thanks.",
        "payload": IBCT_NO
      }
    ]
  };
  callSendAPI(sender_psid, tmNoPayload);
}

function handleIbctYesPostback(sender_psid) {
  const ibctYesPayload = {
    "text": "IBC Titans is a corporate club from Oracle, Krishna Magnum Building, Bengaluru. It is a part of Toastmasters International and started in April 2014. For more information visit: https://ibctitans.wordpress.com/. We meet every Thursday from 12.20 PM - 2 PM. Would you like to join our meeting?",
    "quick_replies": [
      {
        "content_type": "text",
        "title": "Yes!",
        "payload": JOIN_YES
      },
      {
        "content_type": "text",
        "title": "No, thanks.",
        "payload": JOIN_NO
      }
    ]
  };
  callSendAPI(sender_psid, ibctYesPayload);
}

function handleIbctNoPostback(sender_psid) {
  const ibctNoPayload = {
    "text": "No problem, my friend. Would you like to talk to any of our club members?",
    "quick_replies": [
      {
        "content_type": "text",
        "title": "Yes!",
        "payload": TALK_YES
      },
      {
        "content_type": "text",
        "title": "No, thanks.",
        "payload": TALK_NO
      }
    ]
  };
  callSendAPI(sender_psid, ibctNoPayload);
}

function handleJoinYesPostback(sender_psid) {
  const joinYesPayload = {
    "text": "That's wonderful. This is our Zoom meeting link: bit.ly/ibctonline. Looking forward to see you in our next meeting...!!!"
  };
  callSendAPI(sender_psid, joinYesPayload);
}

function handleJoinNoPostback(sender_psid) {
  const joinNoPayload = {
    "text": "No problem, my friend. Would you like to talk to any of our club members?",
    "quick_replies": [
      {
        "content_type": "text",
        "title": "Yes!",
        "payload": TALK_YES
      },
      {
        "content_type": "text",
        "title": "No, thanks.",
        "payload": TALK_NO
      }
    ]
  };
  callSendAPI(sender_psid, joinNoPayload);
}

function handleTalkYesPostBack(sender_psid) {
  const talkYesPayload = {
    "text": "Great, this is the contact of our club's Vice-President Public Relations, Chaitanya Sai Ganne. He is my creator and a very great person to talk to. Please call him on: +91-9439961772. He would love to talk to you."
  };
  callSendAPI(sender_psid, talkYesPayload);
}

function handleTalkNoPostback(sender_psid) {
  const talkNoPayload = {
    "text": "No problem, my friend. Please enter your message, I will try to answer it or one of our members will reply back to you shortly."
  };
  callSendAPI(sender_psid, talkNoPayload);
}

function handleMenuTimingsPostback(sender_psid) {
  const timingsPayload = {
    "text": "We meet every Thursday online on Zoom from 12.20 PM - 2 PM. Zoom link: bit.ly/ibctonline."
  };
  callSendAPI(sender_psid, timingsPayload);
}


function callSendAPI(sender_psid, response) {
  // Construct the message body
  console.log('message to be sent: ', response);
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "url": `${FACEBOOK_GRAPH_API_BASE_URL}me/messages`,
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    console.log("Message Sent Response body:", body);
    if (err) {
      console.error("Unable to send message:", err);
    }
  });
}

function callSenderActionsAPI(sender_psid, action) {
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "sender_action": action
  };

    // Send the HTTP request to the Messenger Platform
    request({
      "url": `${FACEBOOK_GRAPH_API_BASE_URL}me/messages`,
      "qs": { "access_token": PAGE_ACCESS_TOKEN },
      "method": "POST",
      "json": request_body
    }, (err, res, body) => {
      console.log("Message Sent Response body:", body);
      if (err) {
        console.error("Unable to send message:", err);
      }
    });

}