const OPENAI_API_KEY = process.env['OPENAI_API_KEY'] ?? '';
const PINECONE_API_KEY = process.env['PINECONE_API_KEY'] ?? '';
const PINECONE_ENVIRONMENT = process.env['PINECONE_ENVIRONMENT'] ?? '';
const PINECONE_INDEX_NAME = process.env['PINECONE_INDEX_NAME'] ?? '';

// +jls+ 7-July-2023 import instead of require 
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
// const OpenAIEmbeddings = require('langchain/embeddings/openai').OpenAIEmbeddings;

// +jls+ 7-July-2023 import instead of require 
// +jls+ 7-July-2023 importing makechain.ts and pinecone-client.ts 
// +jls+ 6-July-2023 from gptPdfLangChainPinecone
// +jls+ 6-July-2023 imports in makechain.ts
// const OpenAI = require('langchain/llms/openai');


import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from './utils/makechain';

// +jls+ we'll incorporate pinecone-client.ts code in index.ts
import { PineconeClient } from '@pinecone-database/pinecone';
// import { pinecone } from './utils/pinecone-client';

// const PineconeStore = require('langchain/vectorstores/pinecone');
// const makeChain = require('./utils/makechain');
// const pinecone = require('./utils/pinecone-client');

// +jls+ 7-July-2023 No, we'll be getting namespace in the post
// const PINECONE_NAME_SPACE = require('./config/pinecone');

const {Configuration, OpenAIApi} = require('openai');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// +js+ 6-July-2023 comment out -- change homemade to LangChain
// +js+ 17-June-2023 declare global var indexResponse as an object
// var indexResponse = {};

const config = new Configuration({
  apiKey: process.env['OPENAI_API_KEY']
});

const openai = new OpenAIApi(config);

app.get('/', async (req: any, res: any) => {
  res.status(200).send({
    message: 'Hello from searchAIapi'
  })
})

app.post('/', async (req: any, res: any) => {
  try {
    // +jls+ 30-June-2023 searchAI individual bots optionally specify a model ID,
    //    else searchAI/bot-io.services.ts sets default model to gpt-3.5-turbo
    // +jls+ 4-July-2023 they also optional specify temperature (0 to 2, def .3),
    //     max_tokens (8192 gpt-4, def 4096), frequency_penalty (-2 to 2, def .3)
    const model = req.body.model;
    const max_tokens = Number(req.body.max_tokens);
    const temperature = Number(req.body.temperature);
    const frequency_penalty = Number(req.body.frequency_penalty);
    const messages = req.body.messages;
    const chatbot = req.body.chatbot;
    const namespace = req.body.namespace;

    // +js+ 6-July-2023 changing to LangChain, it needs this alias
    const PINECONE_NAME_SPACE = namespace; 

    // +jls+ 13-June-2023 if docs to search to get citations
    // - submit the value of uniprompt, received from searchAI, 
    //   to openAI's text-embedding-ada-002 to get its vectors.
    // - search Pinecone to retrieve relevant doc excerpts
    //   and append them to messages[]'s final "user" element.

    // +jls+ 6-July-2023 searchAI no longer posts uniprompt
    // const uniprompt = req.body.uniprompt;
    // console.log('uniprompt=' + uniprompt);

    // +jls+ 6-July-2023 searchAI now posts a history array --
    // history[] is a 2-dimensional array, with a row for each Q&A,
    // and in each row 2 columns, for the question and the answer,
    // for example here's history array with 3 Q&As in its history:
    //  [['What is a puppy?', 'A puppy is a young dog.'], 
    //   ['What is a kitten?', 'A kitten is a young cat.'],
    //   ['What is a bunny?', 'A bunny is a young rabbit.']] 
    let historyQA = [];
    historyQA = JSON.parse(req.body.history);
    
    // +jls+ 16-June-2023 JSON.parsed messages array (with retrieved doc excerpts in final "user" element's content if namespace)
    let chatMessages = [] as any[];
    chatMessages = JSON.parse(messages);

    // +js+ 6-July-2023 per change homemade to LangChain
    var botResponse;

    // +jls+ 17-June-2023 if docs to search to get citations
    if (namespace != 'none') {
      // +js+ 6-July-2023 comment out -- change homemade to LangChain
      // indexResponse = await queryPinecone(uniprompt, namespace);
      //
      // +js+ 6-July-2023 get expertise from chatMessages[0]
      const expertise: string = chatMessages[0].content;
      // +js+ 6-July-2023 get current question from final element
      const prompt_text = chatMessages[chatMessages.length - 1].content;
      const sanitizedQuestion = prompt_text.trim().replaceAll('\n', ' ');
      console.log('**sanitizedQuestion=', sanitizedQuestion);
      console.log('**historyQA=', historyQA);

      try {

        // +jls+ 7-July-2023 per https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/pinecone

        // +jls+ 11-July-2023 check our access to env constants
        // console.log("[OPENAI_API_KEY]=" + process.env['OPENAI_API_KEY']);
        // console.log("[PINECONE_API_KEY]=" + process.env['PINECONE_API_KEY']);
        // console.log("[PINECONE_ENVIRONMENT]=" + process.env['PINECONE_ENVIRONMENT']);
        // console.log("[PINECONE_INDEX_NAME]=" + process.env['PINECONE_INDEX_NAME']);

        // +jls+ 7-July-2023 we'll init pinecone inline instead
        const pinecone = new PineconeClient();
        await pinecone.init({
            environment: process.env['PINECONE_ENVIRONMENT']!,
            apiKey: process.env['PINECONE_API_KEY']!,
        });
        // const pinecone = await initPinecone();

        const index = pinecone.Index(process.env['PINECONE_INDEX_NAME']!);

        // +jls+ 13-July-2023 change hardcoded to posted namespace ID
        // +jls+  it was hardcoded as 'Higher Education Act of 1965'
        const vectorStore = await PineconeStore.fromExistingIndex(
            new OpenAIEmbeddings({}),
            {
            pineconeIndex: index,
            textKey: 'text',
            namespace: namespace,
            },
        );
        // const vectorStore = await PineconeStore.fromExistingIndex(
        //   index,
        //   new OpenAIEmbeddings({}),
        //   'text',
        //   PINECONE_NAME_SPACE, 
        // );
        // const vectorStore = await PineconeStore.fromExistingIndex(
        //     new OpenAIEmbeddings(),
        //     { 
        //       pineconeIndex: index,
        //       namespace: process.env.PINECONE_NAMESPACE ?? ''
        //     }
        // );
    
        // console.log("vectorStore.asRetriever()=" + JSON.stringify(vectorStore.asRetriever()));
    
        //create chain
        const chain = makeChain(vectorStore);
        //Ask a question using chat history
        const response = await chain.call({
          question: sanitizedQuestion,
          chat_history: historyQA || [],
        });
    
        // +js+ 10-July-2023 change homemade to LangChain
        // +jls+ 10--July-2023 process the four custom doc citations
        let filePath, fileNameExt = '';
        let docExcerpt1, docExcerpt2, docExcerpt3, docExcerpt4 = '';

        filePath = response['sourceDocuments'][0].metadata.source
        fileNameExt = filePath.substring(filePath.lastIndexOf('\\') + 1);
        docExcerpt1 = 'Source 1: ' + response['sourceDocuments'][0].pageContent 
        + '<br>—' + fileNameExt.trim();

        filePath = response['sourceDocuments'][1].metadata.source
        fileNameExt = filePath.substring(filePath.lastIndexOf('\\') + 1);
        docExcerpt2 = 'Source 2: ' + response['sourceDocuments'][1].pageContent 
        + '<br>—' + fileNameExt.trim();

        filePath = response['sourceDocuments'][2].metadata.source
        fileNameExt = filePath.substring(filePath.lastIndexOf('\\') + 1);
        docExcerpt3 = 'Source 3: ' + response['sourceDocuments'][2].pageContent 
        + '<br>—' + fileNameExt.trim();

        filePath = response['sourceDocuments'][3].metadata.source
        fileNameExt = filePath.substring(filePath.lastIndexOf('\\') + 1);
        docExcerpt4 = 'Source 4: ' + response['sourceDocuments'][3].pageContent 
        + '<br>—' + fileNameExt.trim();
    
        // +js+ 10-July-2023 change homemade to LangChain
        // res.status(200).json(response);
        botResponse = response['text'];
        res.status(200).send({
            bot: botResponse,
            doc1: docExcerpt1,
            doc2: docExcerpt2,
            doc3: docExcerpt3,
            doc4: docExcerpt4
          });
        // console.log('**botResponse=', botResponse);
        // console.log("**response['sourceDocuments'][0].pageContent=", 
        //     response['sourceDocuments'][0].pageContent);

      } catch (error) {
        // +jls+ 8-July-2023
        let errorMessage = 'Something went wrong';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.log(errorMessage);
        // console.log('error', error);
        // res.status(500).json({ error: error.message || 'Something went wrong' });
      }
    }

    // +jls+ 17-June-2023 only do this below if no custom docs
    if (namespace == 'none') {
      // +jls+ 30-June-2023 searchAI individual bots optionally specify a model ID,
      //   else searchAI/bot-io.services.ts sets default model to gpt-3.5-turbo
      // +jls+ 4-July-2023 they also optional specify temperature (0 to 2, def .3),
      //   max_tokens (8192 gpt-4, def 4096), frequency_penalty (-2 to 2, def .3)
      // +jls+ 16-June-2023 chatMessages[] has messages array (with retrieved doc excerpts in final "user" element's content if namespace)

      // +jls+ 7-July-2023 openai may not like params or need updating, i don't know
      const response = await openai.createChatCompletion({
        model: model,
        messages: chatMessages,
      });
      // const response = await openai.createChatCompletion({
      //   model: model,
      //   max_tokens: max_tokens,
      //   messages: chatMessages,
      //   temperature: temperature,
      //   frequency_penalty: frequency_penalty
      // });

      // +js+ 6-July-2023 per change homemade to LangChain
      botResponse = response.data.choices[0].message.content.trimStart();
      // let botResponse = response.data.choices[0].message.content.trimStart();
    
      // +js+ 10-July-2023 only send this here if namespace is 'none'
      res.status(200).send({
        bot: botResponse,
      });
    }
    // +jls+ 17-June-2023 only do stuff above if no custom docs

  } catch (error) {
      console.error(error)
      res.status(500).send(error || 'Something went wrong');
  }
})

app.listen(44444, () => {
    console.log('searchAIapi listening on port 44444');
});

//**************************************************************
// +jls+ 10-July-2023 below cloned from pinecone-client.ts
async function initPinecone() {
    try {
      const pinecone = new PineconeClient();
      await pinecone.init({
        environment: process.env['PINECONE_ENVIRONMENT'] ?? '',
        apiKey: process.env['PINECONE_API_KEY'] ?? '',
      });
      return pinecone;
    } catch (error) {
      console.log('error', error);
      throw new Error('Failed to initialize Pinecone Client');
    }
}
// +jls+ 10-July-2023 above cloned from pinecone-client.ts
//**************************************************************
