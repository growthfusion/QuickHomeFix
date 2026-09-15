// Shape of the mock world. Kept in one place so the seeded data reads like
// the real business rather than lorem ipsum -- names, verticals and price
// bands are taken from the HLD and from how home-services ping-post
// actually prices.

export const VERTICALS = ['Roofing', 'Bathroom', 'Windows']

export const BUYERS = [
  { buyer_id: 'buy_modernize',  name: 'Modernize',             status: 'live' },
  { buyer_id: 'buy_homeadv',    name: 'Home Advisor',          status: 'live' },
  { buyer_id: 'buy_angi',       name: 'Angi Leads',            status: 'live' },
  { buyer_id: 'buy_powerhome',  name: 'Power Home Remodeling', status: 'live' },
  { buyer_id: 'buy_leaffilter', name: 'LeafFilter',            status: 'paused' },
]

export const AFFILIATES = [
  { affiliate_id: 'aff_upyield', name: 'Upyield',         status: 'live',   account_manager: 'Mukilan' },
  { affiliate_id: 'aff_wisdom',  name: 'Wisdom Company',  status: 'live',   account_manager: 'Mukilan' },
  { affiliate_id: 'aff_sharp',   name: 'Sharp Media',     status: 'live',   account_manager: 'Adithya' },
  { affiliate_id: 'aff_edm',     name: 'EDM Network',     status: 'live',   account_manager: 'Adithya' },
  { affiliate_id: 'aff_bangkok', name: 'Bangkok Digital', status: 'paused', account_manager: 'Mukilan' },
]

// Per-vertical economics. cost is what we pay the affiliate, revenue what
// the buyer pays us -- both vary per lead within the band, so margins move
// around the way they do in reality instead of being a constant.
export const VERTICAL_ECONOMICS = {
  Roofing:  { cost: [18, 32], revenue: [28, 55], sellRate: 0.72 },
  Bathroom: { cost: [12, 24], revenue: [20, 42], sellRate: 0.66 },
  Windows:  { cost: [14, 27], revenue: [22, 46], sellRate: 0.69 },
}

// Relative lead volume. Not uniform -- one affiliate always dominates.
export const AFFILIATE_VOLUME_WEIGHT = {
  aff_upyield: 0.34,
  aff_wisdom:  0.24,
  aff_sharp:   0.20,
  aff_edm:     0.16,
  aff_bangkok: 0.06,
}

export const BUYER_DEMAND_WEIGHT = {
  buy_modernize:  0.31,
  buy_homeadv:    0.24,
  buy_angi:       0.21,
  buy_powerhome:  0.17,
  buy_leaffilter: 0.07,
}

export const REJECTION_REASONS = [
  'Duplicate lead',
  'Out of coverage area',
  'Invalid phone',
  'Failed buyer filter',
  'Cap reached',
]

// Zip codes weighted toward real home-services demand markets, so the zip
// list looks like something you would actually buy media against.
export const ZIP_POOL = [
  { zip: '75201', city: 'Dallas',         state: 'TX' },
  { zip: '77002', city: 'Houston',        state: 'TX' },
  { zip: '85004', city: 'Phoenix',        state: 'AZ' },
  { zip: '33101', city: 'Miami',          state: 'FL' },
  { zip: '32801', city: 'Orlando',        state: 'FL' },
  { zip: '30303', city: 'Atlanta',        state: 'GA' },
  { zip: '28202', city: 'Charlotte',      state: 'NC' },
  { zip: '37201', city: 'Nashville',      state: 'TN' },
  { zip: '63101', city: 'St. Louis',      state: 'MO' },
  { zip: '46204', city: 'Indianapolis',   state: 'IN' },
  { zip: '43215', city: 'Columbus',       state: 'OH' },
  { zip: '48226', city: 'Detroit',        state: 'MI' },
  { zip: '19107', city: 'Philadelphia',   state: 'PA' },
  { zip: '21202', city: 'Baltimore',      state: 'MD' },
  { zip: '89101', city: 'Las Vegas',      state: 'NV' },
  { zip: '84101', city: 'Salt Lake City', state: 'UT' },
]

export const STREET_NAMES = [
  'Maple', 'Oak', 'Cedar', 'Pine', 'Elm', 'Washington', 'Lincoln',
  'Sunset', 'Ridge', 'Lakeview', 'Meadow', 'Birch', 'Willow', 'Juniper',
]

export const FIRST_NAMES = [
  'James', 'Maria', 'Robert', 'Linda', 'Michael', 'Patricia', 'David',
  'Jennifer', 'William', 'Elizabeth', 'Carlos', 'Susan', 'Thomas',
  'Karen', 'Daniel', 'Nancy', 'Anthony', 'Lisa', 'Mark', 'Sandra',
]

export const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson',
  'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
]
