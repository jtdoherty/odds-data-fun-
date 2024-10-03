import advantagesDataRaw from './output7.json';

const advantagesData = Array.isArray(advantagesDataRaw) ? advantagesDataRaw : [advantagesDataRaw];

export default advantagesData;