import { getResultsurl } from '@/lib/constants';
import { PostBody } from '@/types';

const getResults = async (body: PostBody) => {
  const response = await fetch(getResultsurl);
  const results = await response.json();
  return results;
};
export default getResults;
