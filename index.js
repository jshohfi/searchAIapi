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
    // switch(chatbot) {
    //     case 'chatbot01':
    //       model = 'text-davinci-003';
    //       break;
    //     case 'chatbot02':
    //       model = 'text-curie-001';
    //       break;
    //     case 'chatbot03':
    //       model = 'code-davinci-002';
    //       break;
    //     default:
    //       model = 'text-davinci-003';
    //     }

    // +jls+ 16-Mar-2023 phase 1: simplest use of ChatGPT (gpt-3.5-turbo)
    const response = await openai.createChatCompletion({
      model: `${model}`,
      messages: [{role: "user", content: `${prompt}`}],
    });
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
    // res.status(200).send({
    //     bot: response.data.choices[0].text.trimStart()
    // });

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
  
// app.post('/message', (req, res) => {
//     // {prompt: "This is the message"}
//     const response = openai.createCompletion({
//         model: 'text-davinci-003',
//         prompt: req.body.prompt,
//         temperature: 0,
//         top_p: 1,
//         frequency_penalty: 0,
//         presence_penalty: 0,
//         max_tokens: 256
//     });

//     response.then((data) => {
//         res.send({message: data.data.choices[0].text})
//     }).catch((err) => {
//         res.send({message: err})
//     })

// });

app.listen(44444, () => {
    console.log('askAIapi listening on port 44444');
});