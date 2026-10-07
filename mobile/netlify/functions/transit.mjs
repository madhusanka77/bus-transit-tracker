import { getStore } from '@netlify/blobs';
import { createHandler } from '../lib/transit-handler.mjs';
export default createHandler(() => getStore({ name: 'route177-transit', consistency: 'strong' }));

