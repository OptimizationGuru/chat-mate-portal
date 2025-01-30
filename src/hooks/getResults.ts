import { PostBody } from '@/types';

const getResults = async (body: PostBody) => {
  const url = 'http://192.168.2.218:3001/chat';

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), 5000)
  );

  try {
    const response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }).then((res) => res.json()),
      timeout,
    ]);

    return { response };
  } catch (error) {
    console.error(error);
    return { response: { chat_id: 1, message: 'message' } };
  }
};

export default getResults;
