import { GoogleGenAI } from '@google/genai';
import { DataAPIClient } from '@datastax/astra-db-ts';

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  GOOGLE_API_KEY,
} = process.env;

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY! });

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE! });

export async function POST(req: Request) {
  try {
    const totalStart = performance.now();
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    let docContext = '';

    const embedStart = performance.now();
    // gemini-embedding-001 works on v1beta — no API version workaround needed
    const embeddingResponse = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: latestMessage,
    });
    const embeddingTime = performance.now() - embedStart;

    const embeddingValues = embeddingResponse.embeddings?.[0]?.values ?? [];

    let vectorTime = 0;
    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION!);
      
      const vectorStart = performance.now();
      
      const cursor = collection.find({}, {
        sort: { $vector: embeddingValues },
        limit: 10,
      });

      const documents = await cursor.toArray();
      
      vectorTime = performance.now() - vectorStart;
      
      const docsMap = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docsMap);
    } catch (err) {
      console.log('Error querying DB:', err);
      docContext = '';
    }

    const conversationHistory = messages
      .map((msg: any) => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

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

    const llmStart = performance.now();
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const llmTime = performance.now() - llmStart;

    const text = result.text ?? '';

    const totalTime = performance.now() - totalStart;

    const metrics = {
      embeddingMs: Number(embeddingTime.toFixed(2)),
      vectorSearchMs: Number(vectorTime.toFixed(2)),
      llmMs: Number(llmTime.toFixed(2)),
      totalMs: Number(totalTime.toFixed(2)),
    };
    
    console.table(metrics);

    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error('Error handling POST:', error);

    // Return a user-friendly message for rate limit errors
    if (error?.status === 429) {
      return new Response(
        '⚠️ **Rate limit reached.** The free tier quota for the embedding model has been exceeded (1,000 requests/day). Please try again later or after midnight Pacific Time when the quota resets.',
        { status: 429, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    return new Response('Internal Server Error', { status: 500 });
  }
}