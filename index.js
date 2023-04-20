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
    message: 'Hello from ChatMenuApi'
  })
})

// +jls+ 1-Apr-2023 ChatGPT with conversational memory
// +jls+ 22-Feb-2023 added chatbot: chatBotId to the body of our POST
// +jls+ modified per ChatBotJS/.../server.js 
app.post('/', async (req, res) => {
  try {
    const model = "gpt-3.5-turbo";
    const prompt = req.body.prompt;
    // console.log('prompt=' + prompt);

    // +jls+ 19-Apr-2023 uncomment; some bots have docs
    // const chatbot = req.body.chatbot;
    // console.log('chatbot=' + chatbot + 
    //   chatbot=='chatbot_perception'? ' Hey L00k!' : '');
    
    // +jls+ 1-Apr-2023 ChatGPT with conversational memory
    const response = await openai.createChatCompletion({
      model: model,
      messages: JSON.parse(prompt),
    });
    // +jls+ 16-Mar-2023 phase 1: simplest use of ChatGPT (gpt-3.5-turbo)
    // +jls+ evidently a tick-enclosed ${x} substitutes x's value 
    // const response = await openai.createChatCompletion({
    //   model: `${model}`,
    //   messages: [{role: "user", content: `${prompt}`}],
    // });

    // +jls+ 1-Apr-2023 ChatGPT with conversational memory
    // console.log('Model=' + model);
    // console.log('AI: ' + response.data.choices[0].message.content.trimStart());

    res.status(200).send({
      bot: response.data.choices[0].message.content.trimStart()
    });
    // const response = await openai.createCompletion({
    //     model: `${model}`,
    //     prompt: `${prompt}`,
    //     temperature: 0, // Higher values means the model will take more risks.
    //     max_tokens: 1000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
    //     top_p: 1, // alternative to sampling with temperature, called nucleus sampling
    //     frequency_penalty: 0.3, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
    //     presence_penalty: 0 // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
    // });
  
  } catch (error) {
      console.error(error)
      res.status(500).send(error || 'Something went wrong');
  }
})

app.listen(44444, () => {
    console.log('searchAIapi listening on port 44444');
});