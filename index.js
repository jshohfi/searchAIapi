const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
const PINECONE_API_KEY = process.env.PINECONE_API_KEY ?? '';
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT ?? '';
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? '';
const PineconeClient = require('@pinecone-database/pinecone').PineconeClient;
const OpenAIEmbeddings = require('langchain/embeddings/openai').OpenAIEmbeddings;

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

// +jls+ 15-June-2023 initial test Langchain Pinecone
// **************************************************
// define initPinecone function to return pinecone
async function initPinecone() {
  try {
    const pinecone = new PineconeClient();
    await pinecone.init({
        environment: PINECONE_ENVIRONMENT,
        apiKey: PINECONE_API_KEY
    });
    return pinecone;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}
// **************************************************

// +jls+ 15-June-2023 initial test Langchain Pinecone
// **************************************************
// define queryPinecone function for initial testing
async function queryPinecone(uniPrompt, nameSpace) {
    // invoke the new function defined above that returns pinecone
    const pinecone = await initPinecone();
    // get the vectors for this message
    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: OPENAI_API_KEY,
    });
    const embeddedQuery = await embeddings.embedQuery(uniPrompt);
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    const queryRequest = {
        "topK": 3,
        "vector": embeddedQuery,
        "includeMetadata": true,
        "includeValues": true,
        "namespace": nameSpace
    }
    // Query the index and return multi-line response
    const queryResponse = await index.query({queryRequest});
    return (queryResponse);
    // **************************************************
    // *** DO THE STUFF NOTED ABOVE ***
}  
// **************************************************


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

    // +jls+ 16-June-2023 JSON.parsed messages array (with retrieved doc excerpts in final "user" element's content if namespace)
      let chatMessages = [];
    chatMessages = JSON.parse(messages);

    if (namespace != 'none') {
      // +jls+ 15-June-2023 initial test Langchain Pinecone
      // invoke the nested functions defined above
      const indexResponse = await queryPinecone(uniprompt, namespace);
      // console.log("indexResponse.matches[0].metadata.text=" + indexResponse.matches[0].metadata.text);
      // console.log("indexResponse.matches[1].metadata.text=" + indexResponse.matches[1].metadata.text);
      // console.log("indexResponse.matches[2].metadata.text=" + indexResponse.matches[2].metadata.text);
      // +jls+ 16-June-2023 Append retrieved doc excerpts to final "user" content in messages[] array
      console.log(JSON.stringify(chatMessages[chatMessages.length - 1]));

      // +jls+ 17-June-2023 change back to a string, use "\r\n"
      let docExcerpts = "\r\n\r\nDocuments:"
        + "\r\n\r\n1. " + indexResponse.matches[0].metadata.text
        + "\r\n\r\n2. " + indexResponse.matches[1].metadata.text
        + "\r\n\r\n3. " + indexResponse.matches[2].metadata.text;
      // +jls+ 17-June-2023 change string to a template literal
      // let docExcerpts = `
      // Documents:
      // 
      // 1. ${indexResponse.matches[0].metadata.text}
      //
      // 2. ${indexResponse.matches[1].metadata.text}
      //
      // 3. ${indexResponse.matches[2].metadata.text}`;

      let currentQuery = chatMessages[chatMessages.length - 1].content 
        + docExcerpts;
      // let currentQuery = chatMessages[chatMessages.length - 1].content;
      // currentQuery += ("\n\nDocuments:\n\n" + 
      //   "1. " + indexResponse.matches[0].metadata.text + "\n\n" +
      //   "2. " + indexResponse.matches[1].metadata.text + "\n\n" +
      //   "3. " + indexResponse.matches[2].metadata.text);

      chatMessages[chatMessages.length - 1].content = currentQuery;
      console.log(JSON.stringify(chatMessages[chatMessages.length - 1]));
    }

    // +jls+ 16-June-2023 chatMessages[] has messages array (with retrieved doc excerpts in final "user" element's content if namespace)
    const response = await openai.createChatCompletion({
      model: model,
      messages: chatMessages,
    });
    // +jls+ 12-June-2023 change "prompt" to "messages"
    // const response = await openai.createChatCompletion({
    //   model: model,
    //   messages: JSON.parse(messages),
    // });
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