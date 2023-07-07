// +jls+ 6-July-2023 imports in makechain.ts and pinecone-client.ts 
const OpenAI = require('langchain/llms/openai');
// import { OpenAI } from 'langchain/llms/openai';
// const PineconeStore = require('langchain/vectorstores/pinecone');
import { PineconeStore } from 'langchain/vectorstores/pinecone';
const ConversationalRetrievalQAChain = require('langchain/chains');
// import { ConversationalRetrievalQAChain } from 'langchain/chains';

const CONDENSE_PROMPT = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

const QA_PROMPT = `You are a helpful AI assistant. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

{context}

Question: {question}
Helpful answer in markdown:`;

export const makeChain = (vectorstore: PineconeStore) => {
  const model = new OpenAI({
    temperature: 0, 
    modelName: 'gpt-4',
  });

  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorstore.asRetriever(),
    {
      qaTemplate: QA_PROMPT,
      questionGeneratorTemplate: CONDENSE_PROMPT,
      returnSourceDocuments: true, // default to return 4 source docs
    },
  );
  return chain;
};
