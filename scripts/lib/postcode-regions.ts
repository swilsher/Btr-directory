// UK postcode area prefix → region mapping
// Covers all UK postcode areas
const POSTCODE_REGION_MAP: Record<string, string> = {
  // London
  'E': 'London', 'EC': 'London', 'N': 'London', 'NW': 'London',
  'SE': 'London', 'SW': 'London', 'W': 'London', 'WC': 'London',

  // South East
  'BN': 'South East', 'CT': 'South East', 'GU': 'South East',
  'HP': 'South East', 'ME': 'South East', 'MK': 'South East',
  'OX': 'South East', 'PO': 'South East', 'RG': 'South East',
  'RH': 'South East', 'SL': 'South East', 'SO': 'South East',
  'TN': 'South East',

  // Outer London postcodes — region stays London (Greater London)
  'KT': 'London', 'SM': 'London', 'CR': 'London', 'BR': 'London',
  'DA': 'London', 'EN': 'London', 'HA': 'London', 'IG': 'London',
  'RM': 'London', 'TW': 'London', 'UB': 'London', 'WD': 'London',

  // South West
  'BA': 'South West', 'BH': 'South West', 'BS': 'South West',
  'DT': 'South West', 'EX': 'South West', 'GL': 'South West',
  'PL': 'South West', 'SN': 'South West', 'SP': 'South West',
  'TA': 'South West', 'TQ': 'South West', 'TR': 'South West',

  // East of England
  'AL': 'East of England', 'CB': 'East of England', 'CM': 'East of England',
  'CO': 'East of England', 'IP': 'East of England', 'LU': 'East of England',
  'NR': 'East of England', 'PE': 'East of England', 'SG': 'East of England',
  'SS': 'East of England',

  // East Midlands
  'DE': 'East Midlands', 'LE': 'East Midlands', 'LN': 'East Midlands',
  'NG': 'East Midlands', 'NN': 'East Midlands',

  // West Midlands
  'B': 'West Midlands', 'CV': 'West Midlands', 'DY': 'West Midlands',
  'HR': 'West Midlands', 'ST': 'West Midlands', 'TF': 'West Midlands',
  'WR': 'West Midlands', 'WS': 'West Midlands', 'WV': 'West Midlands',

  // North West
  'BB': 'North West', 'BL': 'North West', 'CA': 'North West',
  'CH': 'North West', 'CW': 'North West', 'FY': 'North West',
  'L': 'North West', 'LA': 'North West', 'M': 'North West',
  'OL': 'North West', 'PR': 'North West', 'SK': 'North West',
  'WA': 'North West', 'WN': 'North West',

  // North East
  'DH': 'North East', 'DL': 'North East', 'NE': 'North East',
  'SR': 'North East', 'TS': 'North East',

  // Yorkshire and The Humber
  'BD': 'Yorkshire and The Humber', 'DN': 'Yorkshire and The Humber',
  'HD': 'Yorkshire and The Humber', 'HG': 'Yorkshire and The Humber',
  'HU': 'Yorkshire and The Humber', 'HX': 'Yorkshire and The Humber',
  'LS': 'Yorkshire and The Humber', 'S': 'Yorkshire and The Humber',
  'WF': 'Yorkshire and The Humber', 'YO': 'Yorkshire and The Humber',

  // Scotland
  'AB': 'Scotland', 'DD': 'Scotland', 'EH': 'Scotland',
  'FK': 'Scotland', 'G': 'Scotland', 'IV': 'Scotland',
  'KA': 'Scotland', 'KW': 'Scotland', 'KY': 'Scotland',
  'ML': 'Scotland', 'PA': 'Scotland', 'PH': 'Scotland',
  'TD': 'Scotland', 'ZE': 'Scotland',

  // Wales
  'CF': 'Wales', 'LD': 'Wales', 'LL': 'Wales',
  'NP': 'Wales', 'SA': 'Wales', 'SY': 'Wales',

  // Northern Ireland
  'BT': 'Northern Ireland',
};

// City/town name → region fallback (for when no postcode is available)
const CITY_REGION_MAP: Record<string, string> = {
  'london': 'London',
  'manchester': 'North West', 'liverpool': 'North West', 'chester': 'North West',
  'preston': 'North West', 'bolton': 'North West', 'wigan': 'North West',
  'salford': 'North West', 'stockport': 'North West', 'warrington': 'North West',
  'blackpool': 'North West', 'burnley': 'North West', 'oldham': 'North West',
  'rochdale': 'North West', 'lancaster': 'North West',
  'birmingham': 'West Midlands', 'coventry': 'West Midlands', 'wolverhampton': 'West Midlands',
  'dudley': 'West Midlands', 'walsall': 'West Midlands', 'stoke-on-trent': 'West Midlands',
  'leeds': 'Yorkshire and The Humber', 'sheffield': 'Yorkshire and The Humber',
  'bradford': 'Yorkshire and The Humber', 'hull': 'Yorkshire and The Humber',
  'york': 'Yorkshire and The Humber', 'huddersfield': 'Yorkshire and The Humber',
  'doncaster': 'Yorkshire and The Humber', 'wakefield': 'Yorkshire and The Humber',
  'barnsley': 'Yorkshire and The Humber', 'rotherham': 'Yorkshire and The Humber',
  'halifax': 'Yorkshire and The Humber',
  'newcastle': 'North East', 'sunderland': 'North East', 'durham': 'North East',
  'middlesbrough': 'North East', 'darlington': 'North East', 'gateshead': 'North East',
  'hartlepool': 'North East',
  'bristol': 'South West', 'exeter': 'South West', 'plymouth': 'South West',
  'bath': 'South West', 'gloucester': 'South West', 'cheltenham': 'South West',
  'swindon': 'South West', 'bournemouth': 'South West', 'poole': 'South West',
  'taunton': 'South West',
  'brighton': 'South East', 'oxford': 'South East', 'reading': 'South East',
  'southampton': 'South East', 'portsmouth': 'South East', 'canterbury': 'South East',
  'guildford': 'South East', 'milton keynes': 'South East', 'slough': 'South East',
  'crawley': 'South East', 'maidstone': 'South East', 'woking': 'South East',
  'basingstoke': 'South East', 'aylesbury': 'South East',
  'norwich': 'East of England', 'cambridge': 'East of England',
  'ipswich': 'East of England', 'colchester': 'East of England',
  'chelmsford': 'East of England', 'peterborough': 'East of England',
  'luton': 'East of England', 'southend': 'East of England',
  'st albans': 'East of England', 'watford': 'East of England',
  'nottingham': 'East Midlands', 'leicester': 'East Midlands',
  'derby': 'East Midlands', 'lincoln': 'East Midlands',
  'northampton': 'East Midlands',
  'edinburgh': 'Scotland', 'glasgow': 'Scotland', 'aberdeen': 'Scotland',
  'dundee': 'Scotland', 'inverness': 'Scotland', 'stirling': 'Scotland',
  'perth': 'Scotland',
  'cardiff': 'Wales', 'swansea': 'Wales', 'newport': 'Wales',
  'wrexham': 'Wales', 'bangor': 'Wales',
  'belfast': 'Northern Ireland', 'derry': 'Northern Ireland',
  'lisburn': 'Northern Ireland', 'newry': 'Northern Ireland',
};

// Postcode prefix → city mapping
// Maps UK postcode area prefixes to their primary city/town
const POSTCODE_CITY_MAP: Record<string, string> = {
  // London (inner)
  'E': 'London', 'EC': 'London', 'N': 'London', 'NW': 'London',
  'SE': 'London', 'SW': 'London', 'W': 'London', 'WC': 'London',

  // London (outer)
  'KT': 'London', 'SM': 'London', 'CR': 'London', 'BR': 'London',
  'DA': 'London', 'EN': 'London', 'HA': 'London', 'IG': 'London',
  'RM': 'London', 'TW': 'London', 'UB': 'London', 'WD': 'London',

  // North West
  'M': 'Manchester', 'OL': 'Manchester', 'BL': 'Bolton',
  'SK': 'Stockport', 'WA': 'Warrington', 'WN': 'Wigan',
  'L': 'Liverpool', 'CH': 'Chester', 'PR': 'Preston',
  'BB': 'Blackburn', 'FY': 'Blackpool', 'LA': 'Lancaster',
  'CA': 'Carlisle', 'CW': 'Crewe',

  // Yorkshire and The Humber
  'LS': 'Leeds', 'BD': 'Bradford', 'HG': 'Harrogate',
  'WF': 'Wakefield', 'HX': 'Halifax', 'HD': 'Huddersfield',
  'S': 'Sheffield', 'DN': 'Doncaster', 'HU': 'Hull', 'YO': 'York',

  // West Midlands
  'B': 'Birmingham', 'CV': 'Coventry', 'WV': 'Wolverhampton',
  'WS': 'Walsall', 'DY': 'Dudley', 'ST': 'Stoke-on-Trent',
  'TF': 'Telford', 'WR': 'Worcester', 'HR': 'Hereford',

  // East Midlands
  'NG': 'Nottingham', 'LE': 'Leicester', 'DE': 'Derby',
  'LN': 'Lincoln', 'NN': 'Northampton',

  // North East
  'NE': 'Newcastle', 'SR': 'Sunderland', 'DH': 'Durham',
  'TS': 'Middlesbrough', 'DL': 'Darlington',

  // South West
  'BS': 'Bristol', 'BA': 'Bath', 'EX': 'Exeter',
  'PL': 'Plymouth', 'GL': 'Gloucester', 'SN': 'Swindon',
  'BH': 'Bournemouth', 'TQ': 'Torquay', 'TR': 'Truro',
  'TA': 'Taunton', 'DT': 'Dorchester', 'SP': 'Salisbury',

  // South East
  'BN': 'Brighton', 'OX': 'Oxford', 'RG': 'Reading',
  'SO': 'Southampton', 'PO': 'Portsmouth', 'CT': 'Canterbury',
  'ME': 'Medway', 'TN': 'Tunbridge Wells', 'MK': 'Milton Keynes',
  'HP': 'Hemel Hempstead', 'GU': 'Guildford', 'SL': 'Slough',
  'RH': 'Crawley',

  // East of England
  'NR': 'Norwich', 'CB': 'Cambridge', 'IP': 'Ipswich',
  'CO': 'Colchester', 'CM': 'Chelmsford', 'PE': 'Peterborough',
  'LU': 'Luton', 'SS': 'Southend', 'SG': 'Stevenage', 'AL': 'St Albans',

  // Scotland
  'EH': 'Edinburgh', 'G': 'Glasgow', 'AB': 'Aberdeen',
  'DD': 'Dundee', 'FK': 'Falkirk', 'IV': 'Inverness',
  'KA': 'Kilmarnock', 'KY': 'Kirkcaldy', 'ML': 'Motherwell',
  'PA': 'Paisley', 'PH': 'Perth', 'KW': 'Wick', 'TD': 'Galashiels',
  'ZE': 'Lerwick',

  // Wales
  'CF': 'Cardiff', 'SA': 'Swansea', 'NP': 'Newport',
  'LL': 'Llandudno', 'LD': 'Llandrindod Wells', 'SY': 'Shrewsbury',

  // Northern Ireland
  'BT': 'Belfast',
};

// London postcode districts → borough mapping
// Maps specific London postcode districts to their London borough
const LONDON_POSTCODE_BOROUGH_MAP: Record<string, string> = {
  // East London (E)
  'E1': 'Tower Hamlets', 'E2': 'Tower Hamlets', 'E3': 'Tower Hamlets',
  'E4': 'Waltham Forest', 'E5': 'Hackney', 'E6': 'Newham',
  'E7': 'Newham', 'E8': 'Hackney', 'E9': 'Hackney',
  'E10': 'Waltham Forest', 'E11': 'Waltham Forest', 'E12': 'Newham',
  'E13': 'Newham', 'E14': 'Tower Hamlets', 'E15': 'Newham',
  'E16': 'Newham', 'E17': 'Waltham Forest', 'E18': 'Redbridge',
  'E20': 'Newham',

  // EC
  'EC1': 'Islington', 'EC2': 'City of London', 'EC3': 'City of London',
  'EC4': 'City of London',

  // North London (N)
  'N1': 'Islington', 'N2': 'Barnet', 'N3': 'Barnet',
  'N4': 'Hackney', 'N5': 'Islington', 'N6': 'Camden',
  'N7': 'Islington', 'N8': 'Haringey', 'N9': 'Enfield',
  'N10': 'Haringey', 'N11': 'Barnet', 'N12': 'Barnet',
  'N13': 'Enfield', 'N14': 'Enfield', 'N15': 'Haringey',
  'N16': 'Hackney', 'N17': 'Haringey', 'N18': 'Enfield',
  'N19': 'Islington', 'N20': 'Barnet', 'N21': 'Enfield',
  'N22': 'Haringey',

  // NW
  'NW1': 'Camden', 'NW2': 'Brent', 'NW3': 'Camden',
  'NW4': 'Barnet', 'NW5': 'Camden', 'NW6': 'Brent',
  'NW7': 'Barnet', 'NW8': 'Westminster', 'NW9': 'Brent',
  'NW10': 'Brent', 'NW11': 'Barnet',

  // South East London (SE)
  'SE1': 'Southwark', 'SE2': 'Bexley', 'SE3': 'Greenwich',
  'SE4': 'Lewisham', 'SE5': 'Southwark', 'SE6': 'Lewisham',
  'SE7': 'Greenwich', 'SE8': 'Lewisham', 'SE9': 'Greenwich',
  'SE10': 'Greenwich', 'SE11': 'Lambeth', 'SE12': 'Lewisham',
  'SE13': 'Lewisham', 'SE14': 'Lewisham', 'SE15': 'Southwark',
  'SE16': 'Southwark', 'SE17': 'Southwark', 'SE18': 'Greenwich',
  'SE19': 'Lambeth', 'SE20': 'Bromley', 'SE21': 'Southwark',
  'SE22': 'Southwark', 'SE23': 'Lewisham', 'SE24': 'Lambeth',
  'SE25': 'Croydon', 'SE26': 'Lewisham', 'SE27': 'Lambeth',
  'SE28': 'Greenwich',

  // South West London (SW)
  'SW1': 'Westminster', 'SW2': 'Lambeth', 'SW3': 'Kensington and Chelsea',
  'SW4': 'Lambeth', 'SW5': 'Kensington and Chelsea', 'SW6': 'Hammersmith and Fulham',
  'SW7': 'Kensington and Chelsea', 'SW8': 'Lambeth', 'SW9': 'Lambeth',
  'SW10': 'Kensington and Chelsea', 'SW11': 'Wandsworth', 'SW12': 'Wandsworth',
  'SW13': 'Richmond upon Thames', 'SW14': 'Richmond upon Thames',
  'SW15': 'Wandsworth', 'SW16': 'Lambeth', 'SW17': 'Wandsworth',
  'SW18': 'Wandsworth', 'SW19': 'Merton', 'SW20': 'Merton',

  // West London (W)
  'W1': 'Westminster', 'W2': 'Westminster', 'W3': 'Ealing',
  'W4': 'Hounslow', 'W5': 'Ealing', 'W6': 'Hammersmith and Fulham',
  'W7': 'Ealing', 'W8': 'Kensington and Chelsea', 'W9': 'Westminster',
  'W10': 'Kensington and Chelsea', 'W11': 'Kensington and Chelsea',
  'W12': 'Hammersmith and Fulham', 'W13': 'Ealing', 'W14': 'Hammersmith and Fulham',

  // WC
  'WC1': 'Camden', 'WC2': 'Westminster',

  // Outer London borough-level districts
  'CR0': 'Croydon', 'CR2': 'Croydon', 'CR4': 'Merton', 'CR5': 'Croydon',
  'BR1': 'Bromley', 'BR2': 'Bromley', 'BR3': 'Bromley', 'BR5': 'Bromley', 'BR6': 'Bromley',
  'DA1': 'Bexley', 'DA5': 'Bexley', 'DA6': 'Bexley', 'DA7': 'Bexley',
  'DA14': 'Bexley', 'DA15': 'Bexley', 'DA16': 'Bexley', 'DA17': 'Bexley',
  'EN1': 'Enfield', 'EN2': 'Enfield', 'EN3': 'Enfield', 'EN4': 'Barnet', 'EN5': 'Barnet',
  'HA0': 'Brent', 'HA1': 'Harrow', 'HA2': 'Harrow', 'HA3': 'Harrow',
  'HA4': 'Hillingdon', 'HA5': 'Harrow', 'HA6': 'Hillingdon',
  'HA7': 'Harrow', 'HA8': 'Barnet', 'HA9': 'Brent',
  'IG1': 'Redbridge', 'IG2': 'Redbridge', 'IG3': 'Redbridge',
  'IG4': 'Redbridge', 'IG5': 'Redbridge', 'IG6': 'Redbridge',
  'IG7': 'Redbridge', 'IG8': 'Redbridge',
  'IG11': 'Barking and Dagenham',
  'KT1': 'Kingston upon Thames', 'KT2': 'Kingston upon Thames', 'KT3': 'Kingston upon Thames',
  'RM1': 'Havering', 'RM2': 'Havering', 'RM3': 'Havering',
  'RM5': 'Havering', 'RM6': 'Barking and Dagenham', 'RM7': 'Havering',
  'RM8': 'Barking and Dagenham', 'RM9': 'Barking and Dagenham',
  'RM10': 'Barking and Dagenham', 'RM11': 'Havering', 'RM12': 'Havering',
  'RM13': 'Havering', 'RM14': 'Havering',
  'SM1': 'Sutton', 'SM2': 'Sutton', 'SM3': 'Sutton', 'SM4': 'Merton', 'SM5': 'Sutton', 'SM6': 'Sutton',
  'TW1': 'Richmond upon Thames', 'TW2': 'Richmond upon Thames', 'TW9': 'Richmond upon Thames',
  'TW10': 'Richmond upon Thames', 'TW11': 'Richmond upon Thames', 'TW12': 'Richmond upon Thames',
  'TW3': 'Hounslow', 'TW4': 'Hounslow', 'TW5': 'Hounslow',
  'TW7': 'Hounslow', 'TW8': 'Hounslow', 'TW13': 'Hounslow', 'TW14': 'Hounslow',
  'UB1': 'Ealing', 'UB2': 'Ealing', 'UB3': 'Hillingdon',
  'UB4': 'Hillingdon', 'UB5': 'Hillingdon', 'UB6': 'Ealing',
  'UB7': 'Hillingdon', 'UB8': 'Hillingdon', 'UB9': 'Hillingdon',
  'UB10': 'Hillingdon', 'UB11': 'Hillingdon',
  'WD17': 'Watford', 'WD18': 'Watford', 'WD23': 'Hertsmere',
  'WD24': 'Watford', 'WD25': 'Watford',
};

// All 33 London boroughs (for validating area values)
export const KNOWN_LONDON_BOROUGHS = new Set([
  'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley',
  'Camden', 'City of London', 'Croydon', 'Ealing', 'Enfield',
  'Greenwich', 'Hackney', 'Hammersmith and Fulham', 'Haringey',
  'Harrow', 'Havering', 'Hillingdon', 'Hounslow', 'Islington',
  'Kensington and Chelsea', 'Kingston upon Thames', 'Lambeth',
  'Lewisham', 'Merton', 'Newham', 'Redbridge',
  'Richmond upon Thames', 'Southwark', 'Sutton', 'Tower Hamlets',
  'Waltham Forest', 'Wandsworth', 'Westminster',
]);

// Metropolitan sub-areas that should be grouped under a parent city
// key = lowercase sub-area name, value = parent city
export const METRO_SUB_AREAS: Record<string, string> = {
  // Greater Manchester
  'salford': 'Manchester',
  'stockport': 'Manchester',
  'oldham': 'Manchester',
  'bolton': 'Manchester',
  'wigan': 'Manchester',
  'rochdale': 'Manchester',
  'trafford': 'Manchester',
  'tameside': 'Manchester',
  'bury': 'Manchester',
  'ancoats': 'Manchester',
  'deansgate': 'Manchester',
  'castlefield': 'Manchester',
  'piccadilly': 'Manchester',
  'spinningfields': 'Manchester',
  'northern quarter': 'Manchester',
  'didsbury': 'Manchester',
  'chorlton': 'Manchester',
  'levenshulme': 'Manchester',
  'moss side': 'Manchester',
  'rusholme': 'Manchester',
  'hulme': 'Manchester',
  'fallowfield': 'Manchester',
  'withington': 'Manchester',
  'salford quays': 'Manchester',
  'media city': 'Manchester',
  'new islington': 'Manchester',

  // Tyneside / Newcastle
  'gateshead': 'Newcastle',
  'north shields': 'Newcastle',
  'south shields': 'Newcastle',
  'wallsend': 'Newcastle',
  'jesmond': 'Newcastle',
  'gosforth': 'Newcastle',

  // West Midlands / Birmingham
  'solihull': 'Birmingham',
  'dudley': 'Birmingham',
  'walsall': 'Birmingham',
  'wolverhampton': 'Birmingham',
  'sandwell': 'Birmingham',
  'west bromwich': 'Birmingham',
  'sutton coldfield': 'Birmingham',
  'edgbaston': 'Birmingham',
  'digbeth': 'Birmingham',
  'jewellery quarter': 'Birmingham',
  'selly oak': 'Birmingham',

  // Leeds metro
  'headingley': 'Leeds',
  'chapel allerton': 'Leeds',
  'roundhay': 'Leeds',
  'horsforth': 'Leeds',
  'kirkstall': 'Leeds',
  'holbeck': 'Leeds',
  'hunslet': 'Leeds',

  // Sheffield metro
  'rotherham': 'Sheffield',
  'dore': 'Sheffield',
  'kelham island': 'Sheffield',

  // Liverpool metro
  'birkenhead': 'Liverpool',
  'bootle': 'Liverpool',
  'wallasey': 'Liverpool',
  'knowsley': 'Liverpool',
  'st helens': 'Liverpool',

  // Bristol metro
  'clifton': 'Bristol',
  'redland': 'Bristol',
  'bedminster': 'Bristol',
  'stokes croft': 'Bristol',

  // Edinburgh metro
  'leith': 'Edinburgh',
  'morningside': 'Edinburgh',
  'stockbridge': 'Edinburgh',

  // Glasgow metro
  'partick': 'Glasgow',
  'govan': 'Glasgow',
  'finnieston': 'Glasgow',
};

// Known city names (for identifying when area is actually a city)
// Built from POSTCODE_CITY_MAP values + CITY_REGION_MAP keys
const KNOWN_CITIES = new Set([
  // Major cities
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Sheffield',
  'Liverpool', 'Bristol', 'Newcastle', 'Nottingham', 'Leicester',
  'Coventry', 'Edinburgh', 'Glasgow', 'Cardiff', 'Belfast',
  'Brighton', 'Southampton', 'Portsmouth', 'Oxford', 'Cambridge',
  'York', 'Bath', 'Exeter', 'Plymouth', 'Norwich',
  'Derby', 'Sunderland', 'Aberdeen', 'Dundee',
  // Towns that shouldn't be sub-areas
  'Reading', 'Milton Keynes', 'Luton', 'Slough', 'Swindon',
  'Bournemouth', 'Peterborough', 'Ipswich', 'Colchester',
  'Chelmsford', 'Gloucester', 'Wolverhampton', 'Stoke-on-Trent',
  'Hull', 'Bradford', 'Huddersfield', 'Doncaster', 'Wakefield',
  'Middlesbrough', 'Darlington', 'Durham', 'Blackpool', 'Preston',
  'Lancaster', 'Chester', 'Warrington', 'Crewe', 'Bolton',
  'Stockport', 'Wigan', 'Swansea', 'Newport', 'Inverness',
  'Carlisle', 'Telford', 'Worcester', 'Hereford', 'Lincoln',
  'Northampton', 'Canterbury', 'Guildford', 'Harrogate', 'Halifax',
  'Salisbury', 'Taunton', 'Torquay', 'Truro', 'Dorchester',
]);

export function postcodeToRegion(postcode: string): string | undefined {
  const cleaned = postcode.toUpperCase().replace(/\s/g, '');
  // Try 2-letter prefix first, then 1-letter
  const twoLetter = cleaned.match(/^([A-Z]{2})/)?.[1];
  const oneLetter = cleaned.match(/^([A-Z])/)?.[1];

  if (twoLetter && POSTCODE_REGION_MAP[twoLetter]) return POSTCODE_REGION_MAP[twoLetter];
  if (oneLetter && POSTCODE_REGION_MAP[oneLetter]) return POSTCODE_REGION_MAP[oneLetter];
  return undefined;
}

export function cityToRegion(city: string): string | undefined {
  const normalized = city.toLowerCase().trim();
  return CITY_REGION_MAP[normalized];
}

/**
 * Derive a city/town name from a UK postcode.
 * E.g., "M1 5QP" → "Manchester", "SE16 7DQ" → "London"
 */
export function postcodeToCity(postcode: string): string | undefined {
  const cleaned = postcode.toUpperCase().replace(/\s/g, '');
  const twoLetter = cleaned.match(/^([A-Z]{2})/)?.[1];
  const oneLetter = cleaned.match(/^([A-Z])/)?.[1];

  if (twoLetter && POSTCODE_CITY_MAP[twoLetter]) return POSTCODE_CITY_MAP[twoLetter];
  if (oneLetter && POSTCODE_CITY_MAP[oneLetter]) return POSTCODE_CITY_MAP[oneLetter];
  return undefined;
}

/**
 * Derive a London borough from a UK postcode.
 * Only returns a value for London postcodes.
 * E.g., "SE16 7DQ" → "Southwark", "E8 1HN" → "Hackney"
 */
export function postcodeToBorough(postcode: string): string | undefined {
  const cleaned = postcode.toUpperCase().replace(/\s/g, '');

  // Try the full district (e.g., "SE16", "NW10", "CR0")
  const fullDistrict = cleaned.match(/^([A-Z]{1,2}\d{1,2})/)?.[1];
  if (fullDistrict && LONDON_POSTCODE_BOROUGH_MAP[fullDistrict]) {
    return LONDON_POSTCODE_BOROUGH_MAP[fullDistrict];
  }

  // Try shorter form (e.g., "SW1" from "SW1A")
  const shortDistrict = cleaned.match(/^([A-Z]{1,2}\d)/)?.[1];
  if (shortDistrict && LONDON_POSTCODE_BOROUGH_MAP[shortDistrict]) {
    return LONDON_POSTCODE_BOROUGH_MAP[shortDistrict];
  }

  return undefined;
}

/**
 * Check if an area name is actually a known city.
 * Used during migration to move city names from area to city field.
 */
export function isKnownCity(name: string): boolean {
  return KNOWN_CITIES.has(name) || KNOWN_CITIES.has(titleCase(name));
}

/**
 * Check if an area name is a known London borough.
 */
export function isLondonBorough(name: string): boolean {
  return KNOWN_LONDON_BOROUGHS.has(name) || KNOWN_LONDON_BOROUGHS.has(titleCase(name));
}

/**
 * Get the parent city for a metro sub-area.
 * E.g., "Salford" → "Manchester", "Gateshead" → "Newcastle"
 */
export function getParentCity(areaName: string): string | undefined {
  return METRO_SUB_AREAS[areaName.toLowerCase().trim()];
}

/**
 * Derive city and area from a postcode, handling London boroughs and metro sub-areas.
 * Returns { city, area } where area is the borough/sub-area (or undefined).
 */
export function deriveLocationFromPostcode(postcode: string): { city?: string; area?: string } {
  const city = postcodeToCity(postcode);
  if (!city) return {};

  if (city === 'London') {
    const borough = postcodeToBorough(postcode);
    return { city: 'London', area: borough };
  }

  return { city };
}

/**
 * Resolve what city and area values should be, given existing area + postcode data.
 * Handles all migration cases: city-as-area, borough-as-area, postcode derivation.
 */
export function resolveLocation(existingArea?: string, postcode?: string): { city?: string; area?: string } {
  let city: string | undefined;
  let area: string | undefined = existingArea;

  // Step 1: Try postcode first (most reliable)
  if (postcode) {
    const derived = deriveLocationFromPostcode(postcode);
    if (derived.city) {
      city = derived.city;
      // For London, use postcode-derived borough if no existing area or existing area is a city
      if (city === 'London' && derived.area) {
        if (!existingArea || isKnownCity(existingArea)) {
          area = derived.area;
        }
        // If existing area is already a valid borough, keep it
      }
    }
  }

  // Step 2: If still no city, check existing area value
  if (!city && existingArea) {
    const trimmed = existingArea.trim();

    // Is the area actually a city name?
    if (isKnownCity(trimmed)) {
      city = titleCase(trimmed);
      area = undefined; // clear area since it was really a city
    }
    // Is it a London borough?
    else if (isLondonBorough(trimmed)) {
      city = 'London';
      area = trimmed; // keep as borough
    }
    // Is it a metro sub-area?
    else {
      const parentCity = getParentCity(trimmed);
      if (parentCity) {
        city = parentCity;
        area = trimmed; // keep as sub-area
      }
    }
  }

  return { city, area };
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const VALID_REGIONS = [
  'London', 'South East', 'South West', 'East of England',
  'East Midlands', 'West Midlands', 'North West', 'North East',
  'Yorkshire and The Humber', 'Scotland', 'Wales', 'Northern Ireland',
];

// Re-export maps for use in other modules
export { POSTCODE_REGION_MAP, CITY_REGION_MAP, POSTCODE_CITY_MAP, LONDON_POSTCODE_BOROUGH_MAP };
