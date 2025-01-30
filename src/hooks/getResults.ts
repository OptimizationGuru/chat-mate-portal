import { getResultsurl } from '@/lib/constants';
import { PostBody } from '@/types';

const getResults = async () => {
  try {
    const url = 'http://192.168.2.218:3001/chat-dummy';
    const body = {
      role: 'commander',
      user_text: 'please tell in one line',
      image_text: 'Timelog already active',
      chat_id: '1',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    console.log(data);

    return { response: data };
  } catch (error) {
    console.error(error);
  }
};
export default getResults;
