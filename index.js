const {Configuration, OpenAIApi} = require('openai');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());


// +jls+ 14-June-2023 rename API_TOKEN to OPENAI_API_KEY
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(config);

// +jls+ added per ChatBotJS/.../server.js 
app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from searchAIapi'
  })
})

// +jls+ 1-Apr-2023 ChatGPT with conversational memory
// +jls+ 22-Feb-2023 added chatbot: chatBotId to the body of our POST
// +jls+ modified per ChatBotJS/.../server.js 
app.post('/', async (req, res) => {
  try {
    const model = "gpt-3.5-turbo";

    // +jls+ 12-June-2023 change "prompt" to "messages"
    const messages = req.body.messages;
    // const prompt = req.body.prompt;
    // console.log('prompt=' + prompt);

    // +jls+ 19-Apr-2023 
    const chatbot = req.body.chatbot;
    console.log('chatbot=' + chatbot);

    // +jls+ 9-June-2023 some bots use Pinecone
    const namespace = req.body.namespace;
    console.log('namespace=' + namespace);

    // +jls+ 13-June-2023 if docs to search to get citations
    // - submit the value of uniprompt, received from searchAI, 
    //   to openAI's text-embedding-ada-002 to get its vectors.
    // - search Pinecone to retrieve relevant doc excerpts
    //   (ideally each will include a hyperlink to the doc),  
    //   and append them to messages[]'s final "user" element.
    const uniprompt = req.body.uniprompt;
    // console.log('uniprompt=' + uniprompt);
    if (namespace != 'none') {
      // *** DO THE STUFF NOTED ABOVE ***
      // something like this?? maybe??
      // openai = new OpenAIApi(this.configuration)
      // const parameters = {
      //   model: 'text-embedding-ada-002',
      //   input: uniprompt
      // }
      // Make the embedding request and return the result
      // const resp = await openai.createEmbedding(parameters)
      // const embeddings = embeddings?.data.data[0].embedding
      // *** DO THE STUFF NOTED ABOVE ***
    }

    // +jls+ 12-June-2023 change "prompt" to "messages"
    const response = await openai.createChatCompletion({
      model: model,
      messages: JSON.parse(messages),
    });
    // +jls+ 1-Apr-2023 ChatGPT with conversational memory
    // const response = await openai.createChatCompletion({
    //   model: model,
    //   messages: JSON.parse(prompt),
    // });
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