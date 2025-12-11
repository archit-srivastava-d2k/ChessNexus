import { DataAPIClient } from '@datastax/astra-db-ts';
import { PuppeteerWebBaseLoader } from '@langchain/community/document_loaders/web/puppeteer';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAI } from '@google/generative-ai';

import 'dotenv/config';

type SimilarityMetric = 'dot_product' | 'cosine' | 'euclidean';

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  GOOGLE_API_KEY,
} = process.env;

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

const f1Data = [
  'https://en.wikipedia.org/wiki/Chess_opening',
  'https://en.wikibooks.org/wiki/Chess_Opening_Theory',
  'https://en.wikipedia.org/wiki/List_of_chess_players',
  'https://en.wikipedia.org/wiki/World_Chess_Championship',
  'https://simple.wikipedia.org/wiki/List_of_World_Chess_Champions',
  'https://en.wikipedia.org/wiki/Chess',
  'https://en.wikipedia.org/wiki/List_of_chess_games',
  'https://www.chess.com/article/view/the-best-chess-games-of-all-time',
  'https://www.wikihow.com/Play-Chess',
  'https://en.wikipedia.org/wiki/List_of_chess_players_by_peak_FIDE_rating',
  'https://en.wikipedia.org/wiki/Comparison_of_top_chess_players_throughout_history',
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE! });

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createCollection = async (
  similarityMetric: SimilarityMetric = 'dot_product'
) => {
  const res = await db.createCollection(ASTRA_DB_COLLECTION!, {
    vector: {
      dimension: 768,
      metric: similarityMetric,
    },
  });

  console.log('Collection created:', res);
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION!);
  for await (const url of f1Data) {
    const content = await scrapePage(url);
    const chunks = await splitter.splitText(content);
    for await (const chunk of chunks) {
      const embeddingResponse = await embeddingModel.embedContent({
        content: { parts: [{ text: chunk }], role: 'user' },
      });

      const vector = embeddingResponse.embedding.values;

      const res = await collection.insertOne({
        $vector: vector,
        text: chunk,
      });

      console.log(`Inserted chunk from ${url}`);
    }
  }
};

const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: 'domcontentloaded',
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return result;
    },
  });
  return (await loader.scrape())?.replace(/<[^>]*>?/gm, '');
};

createCollection().then(() => loadSampleData());