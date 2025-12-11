import { GoogleGenerativeAI } from '@google/generative-ai';
import { DataAPIClient } from '@datastax/astra-db-ts';

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  GOOGLE_API_KEY,
} = process.env;

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY!);

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE! });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    let docContext = '';

    const model1 = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResponse = await model1.embedContent(latestMessage);

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION!);
      const cursor = collection.find({}, {
        sort: {
          $vector: embeddingResponse.embedding.values,
        },
        limit: 10,
      });

      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docsMap);
    } catch (err) {
      console.log('Error querying DB:', err);
      docContext = '';
    }

    // Format conversation history for context
    const conversationHistory = messages.map((msg: any) => 
      `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');

    const prompt = `
You are an AI assistant who knows everything about **Chess**.

Use the context below to help answer the question. The context may contain Wikipedia data, chess articles, and recent updates.

If the context doesn't help, use your own knowledge. Always format your answers using **Markdown** and avoid returning any images.

---

## 📄 Context

\`\`\`
${docContext}
\`\`\`

---

## 💬 Conversation History

${conversationHistory}

---

## 🧠 Instructions

- Respond in a clear and structured way.
- Use **lists**, **bold**, and **headings** where helpful.
- Format rules or definitions in **bullet points** or tables if needed.
- Consider the full conversation history when responding.
- Only respond to the latest message, but use previous context for better understanding.
`;

    // Use Gemini for generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error('Error handling POST:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}