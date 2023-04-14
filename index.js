const {Configuration, OpenAIApi} = require('openai');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const config = new Configuration({
    apiKey: process.env.API_TOKEN
});

const openai = new OpenAIApi(config);

// +jls+ added per ChatBotJS/.../server.js 
app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from searchAIapi'
  })
})

// +jls+ 22-Feb-2023 added chatbot: chatBotId to the body of our POST
// +jls+ modified per ChatBotJS/.../server.js 
// +jls+ evidently a tick-enclosed ${x} substitutes x's value 
app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const chatbot = req.body.chatbot;
    var model;

    // +jls+ 16-Mar-2023 phase 1: simplest use of ChatGPT (gpt-3.5-turbo)
    model = "gpt-3.5-turbo";
    const response = await openai.createChatCompletion({
      model: `${model}`,
      messages: [{role: "user", content: `${prompt}`}],
    });
    res.status(200).send({
      bot: response.data.choices[0].message.content.trimStart()
    });

    // +jls+
    console.log('Chatbot=' + chatbot);
    console.log('Model=' + model);
    // console.log('Prompt=' + prompt);

    // +jls+ 16-Mar-2023 phase 1: simplest use of ChatGPT (gpt-3.5-turbo)
    // console.log('Response=' + 
    //   response.data.choices[0].message.content.trimStart());
    // console.log('Response=' + response.data.choices[0].text.trimStart());
  
  } catch (error) {
      console.error(error)
      res.status(500).send(error || 'Something went wrong');
  }
})

app.listen(44444, () => {
    console.log('searchAIapi listening on port 44444');
});