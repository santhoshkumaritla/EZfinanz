export const INDIA_LOCATIONS = {
  'Andhra Pradesh': {
    Visakhapatnam: ['Visakhapatnam'],
    Vijayawada: ['Vijayawada'],
    Guntur: ['Guntur'],
    Tirupati: ['Tirupati'],
  },
  'Arunachal Pradesh': { 'East Kameng': ['Seppa'], 'Papum Pare': ['Itanagar'] },
  Assam: { Kamrup: ['Guwahati'], Dibrugarh: ['Dibrugarh'], Jorhat: ['Jorhat'] },
  Bihar: { Patna: ['Patna'], Gaya: ['Gaya'], Muzaffarpur: ['Muzaffarpur'] },
  Chhattisgarh: { Raipur: ['Raipur'], Durg: ['Bhilai', 'Durg'] },
  Goa: { 'North Goa': ['Panaji'], 'South Goa': ['Margao'] },
  Gujarat: { Ahmedabad: ['Ahmedabad'], Surat: ['Surat'], Vadodara: ['Vadodara'], Rajkot: ['Rajkot'] },
  Haryana: { Gurugram: ['Gurugram'], Faridabad: ['Faridabad'], Panchkula: ['Panchkula'] },
  'Himachal Pradesh': { Shimla: ['Shimla'], Kangra: ['Dharamshala'] },
  Jharkhand: { Ranchi: ['Ranchi'], Dhanbad: ['Dhanbad'], EastSinghbhum: ['Jamshedpur'] },
  Karnataka: { BengaluruUrban: ['Bengaluru'], Mysuru: ['Mysuru'], Mangaluru: ['Mangaluru'], Belagavi: ['Belagavi'] },
  Kerala: { Thiruvananthapuram: ['Thiruvananthapuram'], Ernakulam: ['Kochi'], Kozhikode: ['Kozhikode'] },
  MadhyaPradesh: { Bhopal: ['Bhopal'], Indore: ['Indore'], Gwalior: ['Gwalior'], Jabalpur: ['Jabalpur'] },
  Maharashtra: { MumbaiCity: ['Mumbai'], Pune: ['Pune'], Nagpur: ['Nagpur'], Thane: ['Thane'], Nashik: ['Nashik'] },
  Manipur: { ImphalWest: ['Imphal'] },
  Meghalaya: { EastKhasiHills: ['Shillong'] },
  Mizoram: { Aizawl: ['Aizawl'] },
  Nagaland: { Kohima: ['Kohima'], Dimapur: ['Dimapur'] },
  Odisha: { Khordha: ['Bhubaneswar'], Cuttack: ['Cuttack'] },
  Punjab: { Amritsar: ['Amritsar'], Ludhiana: ['Ludhiana'], Patiala: ['Patiala'] },
  Rajasthan: { Jaipur: ['Jaipur'], Jodhpur: ['Jodhpur'], Udaipur: ['Udaipur'], Kota: ['Kota'] },
  Sikkim: { EastSikkim: ['Gangtok'] },
  'Tamil Nadu': { Chennai: ['Chennai'], Coimbatore: ['Coimbatore'], Madurai: ['Madurai'], Salem: ['Salem'] },
  Telangana: { Hyderabad: ['Hyderabad'], Rangareddy: ['Hyderabad'], Warangal: ['Warangal'] },
  Tripura: { WestTripura: ['Agartala'] },
  UttarPradesh: { Lucknow: ['Lucknow'], Noida: ['Noida'], Varanasi: ['Varanasi'], KanpurNagar: ['Kanpur'] },
  Uttarakhand: { Dehradun: ['Dehradun'], Haridwar: ['Haridwar'] },
  WestBengal: { Kolkata: ['Kolkata'], Darjeeling: ['Siliguri'], 'North 24 Parganas': ['Kolkata'] },
  Delhi: { 'Central Delhi': ['New Delhi'], 'South Delhi': ['New Delhi'], 'North Delhi': ['Delhi'] },
  'Jammu and Kashmir': { Jammu: ['Jammu'], Srinagar: ['Srinagar'] },
  Ladakh: { Leh: ['Leh'], Kargil: ['Kargil'] },
  Puducherry: { Puducherry: ['Puducherry'] },
  Chandigarh: { Chandigarh: ['Chandigarh'] },
};

export const INDIAN_STATES = Object.keys(INDIA_LOCATIONS).sort();

export const BANK_NAMES = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Bank of India',
  'Indian Bank',
  'Central Bank of India',
  'IDBI Bank',
  'Indian Overseas Bank',
  'UCO Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'Yes Bank',
  'Federal Bank',
  'South Indian Bank',
  'Other',
];

export function getDistricts(state) {
  return state ? Object.keys(INDIA_LOCATIONS[state] || {}).sort() : [];
}

export function getCities(state, district) {
  return state && district ? INDIA_LOCATIONS[state]?.[district] || [] : [];
}
