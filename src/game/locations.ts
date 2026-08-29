export type Place = {
  id: string
  name: string
  category: 'City' | 'Landmark' | 'Nature'
  lat: number
  lng: number
  /** Wikimedia Commons filename for Special:FilePath */
  photo: string
}

export const PLACES: Place[] = [
  // Americas
  { id: 'sf', name: 'San Francisco', category: 'City', lat: 37.7749, lng: -122.4194, photo: 'San_Francisco_skyline_from_Marin_Headlands_-_Nov_2014.jpg' },
  { id: 'golden-gate', name: 'Golden Gate Bridge', category: 'Landmark', lat: 37.8199, lng: -122.4783, photo: 'GoldenGateBridge-001.jpg' },
  { id: 'nyc', name: 'New York City', category: 'City', lat: 40.7128, lng: -74.006, photo: 'Manhattan_from_Weehawken,_NJ.jpg' },
  { id: 'liberty', name: 'Statue of Liberty', category: 'Landmark', lat: 40.6892, lng: -74.0445, photo: 'Statue_of_Liberty_7.jpg' },
  { id: 'grand-canyon', name: 'Grand Canyon South Rim', category: 'Nature', lat: 36.057, lng: -112.107, photo: 'Grand_Canyon_view_from_Pima_Point_2010.jpg' },
  { id: 'yellowstone', name: 'Old Faithful', category: 'Nature', lat: 44.4605, lng: -110.8282, photo: 'Old_Faithful_Geyser_2017.jpg' },
  { id: 'hollywood', name: 'Hollywood Sign', category: 'Landmark', lat: 34.1341, lng: -118.3215, photo: 'Hollywood_Sign_(Zuschnitt).jpg' },
  { id: 'space-needle', name: 'Space Needle', category: 'Landmark', lat: 47.6205, lng: -122.3493, photo: 'Space_Needle_2011-07-04.jpg' },
  { id: 'niagara', name: 'Niagara Falls', category: 'Nature', lat: 43.0962, lng: -79.0377, photo: 'Niagara_Falls_from_Skylon_Tower.jpg' },
  { id: 'white-house', name: 'White House', category: 'Landmark', lat: 38.8977, lng: -77.0365, photo: 'White_House_Washington_DC_2010.jpg' },
  { id: 'mount-rushmore', name: 'Mount Rushmore', category: 'Landmark', lat: 43.8791, lng: -103.4591, photo: 'Mount_Rushmore_detail_view_(100MP).jpg' },
  { id: 'alcatraz', name: 'Alcatraz Island', category: 'Landmark', lat: 37.8267, lng: -122.423, photo: 'Alcatraz_Island_from_East_Road.jpg' },
  { id: 'willis-tower', name: 'Willis Tower, Chicago', category: 'Landmark', lat: 41.8789, lng: -87.6359, photo: 'Willis_Tower_from_Lake_Michigan.jpg' },
  { id: 'french-quarter', name: 'French Quarter, New Orleans', category: 'City', lat: 29.9584, lng: -90.0644, photo: 'French_Quarter,_New_Orleans.jpg' },
  { id: 'cn-tower', name: 'CN Tower, Toronto', category: 'Landmark', lat: 43.6426, lng: -79.3871, photo: 'Toronto_-_ON_-_CN_Tower.jpg' },
  { id: 'banff', name: 'Banff', category: 'Nature', lat: 51.1784, lng: -115.5708, photo: 'Banff_Avenue_in_Banff,_Alberta.jpg' },
  { id: 'moraine-lake', name: 'Moraine Lake', category: 'Nature', lat: 51.3217, lng: -116.186, photo: 'Moraine_Lake_17092005.jpg' },
  { id: 'havana', name: 'Havana', category: 'City', lat: 23.1136, lng: -82.3666, photo: 'La_Habana_Vieja_from_El_Morro.jpg' },
  { id: 'mexico-city', name: 'Mexico City', category: 'City', lat: 19.4326, lng: -99.1332, photo: 'Mexico_City_Reforma_skyline.jpg' },
  { id: 'chichen-itza', name: 'Chichén Itzá', category: 'Landmark', lat: 20.6843, lng: -88.5678, photo: 'Chichen_Itza_3.jpg' },
  { id: 'teotihuacan', name: 'Teotihuacan Pyramids', category: 'Landmark', lat: 19.6925, lng: -98.8438, photo: 'Teotihuacan_Pyramid_of_the_Sun.jpg' },
  { id: 'panama-canal', name: 'Panama Canal (Miraflores Locks)', category: 'Landmark', lat: 8.997, lng: -79.59, photo: 'Miraflores_Locks_Panama_Canal.jpg' },
  { id: 'cartagena', name: 'Cartagena Walled City', category: 'City', lat: 10.424, lng: -75.551, photo: 'Cartagena,_Colombia_-_Old_City.jpg' },
  { id: 'machu-picchu', name: 'Machu Picchu', category: 'Landmark', lat: -13.1631, lng: -72.545, photo: 'Machu_Picchu,_Peru.jpg' },
  { id: 'rio', name: 'Rio de Janeiro', category: 'City', lat: -22.9068, lng: -43.1729, photo: 'Rio_de_Janeiro_from_Sugarloaf_mountain,_May_2008.jpg' },
  { id: 'redeemer', name: 'Christ the Redeemer', category: 'Landmark', lat: -22.9519, lng: -43.2105, photo: 'Christ_the_Redeemer_-_Cristo_Redentor.jpg' },
  { id: 'obelisco', name: 'Buenos Aires Obelisco', category: 'Landmark', lat: -34.6037, lng: -58.3816, photo: 'Obelisco_Buenos_Aires.jpg' },
  { id: 'iguazu', name: 'Iguazu Falls', category: 'Nature', lat: -25.6953, lng: -54.4367, photo: 'Iguazu_Cataratas2.jpg' },
  { id: 'salar-uyuni', name: 'Salar de Uyuni', category: 'Nature', lat: -20.1338, lng: -67.4891, photo: 'Salar_de_Uyuni,_Bolivia.jpg' },
  { id: 'lencois', name: 'Lençóis Maranhenses', category: 'Nature', lat: -2.486, lng: -43.116, photo: 'Lencois_Maranhenses_National_Park.jpg' },
  { id: 'easter-island', name: 'Easter Island', category: 'Landmark', lat: -27.1127, lng: -109.3497, photo: 'Moais_at_Rano_Raraku.jpg' },
  { id: 'moai', name: 'Ahu Tongariki', category: 'Landmark', lat: -27.1259, lng: -109.2769, photo: 'Ahu_Tongariki,_Moais_at_Easter_Island_(Rapa_Nui).jpg' },

  // Europe
  { id: 'london', name: 'London', category: 'City', lat: 51.5074, lng: -0.1278, photo: 'London_skyline_from_St_Pauls_-_Dec_2014.jpg' },
  { id: 'big-ben', name: 'Big Ben', category: 'Landmark', lat: 51.5007, lng: -0.1246, photo: 'Elizabeth_Tower,_June_2022.jpg' },
  { id: 'stonehenge', name: 'Stonehenge', category: 'Landmark', lat: 51.1789, lng: -1.8262, photo: 'Stonehenge2007_07_30.jpg' },
  { id: 'edinburgh-castle', name: 'Edinburgh Castle', category: 'Landmark', lat: 55.9486, lng: -3.1999, photo: 'Edinburgh_Castle_from_the_Vennel.jpg' },
  { id: 'paris', name: 'Paris', category: 'City', lat: 48.8566, lng: 2.3522, photo: 'Paris_Night.jpg' },
  { id: 'eiffel', name: 'Eiffel Tower', category: 'Landmark', lat: 48.8584, lng: 2.2945, photo: 'Tour_Eiffel_Wikimedia_Commons_(cropped).jpg' },
  { id: 'notre-dame', name: 'Notre-Dame de Paris', category: 'Landmark', lat: 48.853, lng: 2.3499, photo: 'Notre-Dame_de_Paris,_4_October_2017.jpg' },
  { id: 'louvre', name: 'Louvre Pyramid', category: 'Landmark', lat: 48.861, lng: 2.3358, photo: 'Le_Louvre_-_Pyramide.jpg' },
  { id: 'mont-saint-michel', name: 'Mont Saint-Michel', category: 'Landmark', lat: 48.636, lng: -1.5115, photo: 'Mont_Saint-Michel_01.jpg' },
  { id: 'rome', name: 'Rome', category: 'City', lat: 41.9028, lng: 12.4964, photo: 'Rome_skyline_panorama.jpg' },
  { id: 'colosseum', name: 'Colosseum', category: 'Landmark', lat: 41.8902, lng: 12.4922, photo: 'Colosseo_2020.jpg' },
  { id: 'leaning-tower', name: 'Leaning Tower of Pisa', category: 'Landmark', lat: 43.723, lng: 10.3966, photo: 'Leaning_Tower_of_Pisa_2.jpg' },
  { id: 'venice', name: 'Venice', category: 'City', lat: 45.4408, lng: 12.3155, photo: 'Venice_-_Grand_Canal_from_Rialto_Bridge.jpg' },
  { id: 'florence-duomo', name: 'Florence Cathedral', category: 'Landmark', lat: 43.7731, lng: 11.256, photo: 'Florence_Duomo_from_Michelangelo_hill.jpg' },
  { id: 'pompeii', name: 'Pompeii', category: 'Landmark', lat: 40.7489, lng: 14.4897, photo: 'Pompeii_-_Forum.jpg' },
  { id: 'barcelona', name: 'Sagrada Família', category: 'Landmark', lat: 41.4036, lng: 2.1744, photo: 'Sagrada_Familia_01.jpg' },
  { id: 'athens', name: 'Acropolis of Athens', category: 'Landmark', lat: 37.9715, lng: 23.7267, photo: 'Acropolis_of_Athens_01361.JPG' },
  { id: 'meteora', name: 'Meteora', category: 'Landmark', lat: 39.7217, lng: 21.6306, photo: 'Meteora,_Greece_-_panoramio.jpg' },
  { id: 'santorini', name: 'Santorini', category: 'City', lat: 36.3932, lng: 25.4615, photo: 'Santorini_sunset_Oia.jpg' },
  { id: 'cinque-terre', name: 'Manarola, Cinque Terre', category: 'City', lat: 44.106, lng: 9.7279, photo: 'Manarola,_Cinque_Terre.jpg' },
  { id: 'prague', name: 'Prague', category: 'City', lat: 50.0755, lng: 14.4378, photo: 'Prague_old_town_square_panorama.jpg' },
  { id: 'budapest-parliament', name: 'Hungarian Parliament', category: 'Landmark', lat: 47.507, lng: 19.0456, photo: 'Hungarian_Parliament_Building_from_across_the_Danube.jpg' },
  { id: 'neuschwanstein', name: 'Neuschwanstein Castle', category: 'Landmark', lat: 47.5576, lng: 10.7498, photo: 'Neuschwanstein_Castle_LOC_LCCN2017663837.jpg' },
  { id: 'brandenburg-gate', name: 'Brandenburg Gate', category: 'Landmark', lat: 52.5163, lng: 13.3777, photo: 'Brandenburger_Tor_abends.jpg' },
  { id: 'amsterdam', name: 'Amsterdam', category: 'City', lat: 52.3676, lng: 4.9041, photo: 'Amsterdam_canal_at_night.jpg' },
  { id: 'lake-bled', name: 'Lake Bled', category: 'Nature', lat: 46.3644, lng: 14.095, photo: 'Lake_Bled_from_the_Mountain.jpg' },
  { id: 'plitvice', name: 'Plitvice Lakes', category: 'Nature', lat: 44.8654, lng: 15.582, photo: 'Plitvice_lakes_1.jpg' },
  { id: 'dubrovnik', name: 'Dubrovnik Old Town', category: 'City', lat: 42.6403, lng: 18.108, photo: 'Dubrovnik_Old_Town_aerial_view.jpg' },
  { id: 'moscow', name: 'Red Square', category: 'Landmark', lat: 55.7539, lng: 37.6208, photo: 'Red_Square_Moscow_City_2021.jpg' },
  { id: 'st-peters', name: "St. Peter's Basilica", category: 'Landmark', lat: 41.9022, lng: 12.4539, photo: 'St_Peters_Square_Vatican_City.jpg' },
  { id: 'reykjavik', name: 'Reykjavík', category: 'City', lat: 64.1466, lng: -21.9426, photo: 'Reykjavik_from_Perlan.jpg' },
  { id: 'oslo-opera', name: 'Oslo Opera House', category: 'Landmark', lat: 59.9075, lng: 10.7522, photo: 'Oslo_Opera_House_seen_from_Akershus_Fortress.jpg' },
  { id: 'little-mermaid', name: 'Little Mermaid, Copenhagen', category: 'Landmark', lat: 55.6929, lng: 12.5993, photo: 'Little_Mermaid_statue_Copenhagen.jpg' },

  // Africa & Middle East
  { id: 'cairo', name: 'Giza Pyramids', category: 'Landmark', lat: 29.9792, lng: 31.1342, photo: 'Giza_pyramid_complex_(cropped).jpg' },
  { id: 'luxor-temple', name: 'Luxor Temple', category: 'Landmark', lat: 25.6997, lng: 32.639, photo: 'Luxor_Temple_R01.jpg' },
  { id: 'marrakesh', name: 'Marrakesh', category: 'City', lat: 31.6295, lng: -7.9811, photo: 'Jemaa_el-Fnaa,_Marrakech,_Morocco.jpg' },
  { id: 'timbuktu', name: 'Timbuktu', category: 'City', lat: 16.7666, lng: -3.0026, photo: 'Sankore_Mosque_in_Timbuktu.jpg' },
  { id: 'victoria-falls', name: 'Victoria Falls', category: 'Nature', lat: -17.9243, lng: 25.8572, photo: 'Victoria_Falls_(Zambia_side).jpg' },
  { id: 'table-mountain', name: 'Table Mountain', category: 'Nature', lat: -33.9628, lng: 18.4098, photo: 'Table_Mountain_from_above_Cape_Town.jpg' },
  { id: 'cape-town', name: 'Cape Town', category: 'City', lat: -33.9249, lng: 18.4241, photo: 'Cape_Town_from_Table_Mountain.jpg' },
  { id: 'serengeti', name: 'Serengeti National Park', category: 'Nature', lat: -2.333, lng: 34.833, photo: 'Serengeti_Landscape_Elephants.jpg' },
  { id: 'kilimanjaro', name: 'Mount Kilimanjaro', category: 'Nature', lat: -3.0674, lng: 37.3556, photo: 'Kilimanjaro_from_Amboseli.jpg' },
  { id: 'petra', name: 'Petra', category: 'Landmark', lat: 30.3285, lng: 35.4444, photo: 'Al_Khazneh,_Petra,_Jordan.jpg' },
  { id: 'western-wall', name: 'Western Wall, Jerusalem', category: 'Landmark', lat: 31.7767, lng: 35.2345, photo: 'Western_Wall,_Jerusalem.jpg' },
  { id: 'istanbul', name: 'Hagia Sophia', category: 'Landmark', lat: 41.0086, lng: 28.9802, photo: 'Hagia_Sophia_Mars_2013.jpg' },
  { id: 'dubai', name: 'Burj Khalifa', category: 'Landmark', lat: 25.1972, lng: 55.2744, photo: 'Burj_Khalifa.jpg' },
  { id: 'sheikh-zayed', name: 'Sheikh Zayed Grand Mosque', category: 'Landmark', lat: 24.4129, lng: 54.475, photo: 'Sheikh_Zayed_Grand_Mosque_Abu_Dhabi.jpg' },

  // Asia
  { id: 'taj-mahal', name: 'Taj Mahal', category: 'Landmark', lat: 27.1751, lng: 78.0421, photo: 'Taj_Mahal_(Edited).jpeg' },
  { id: 'gateway-india', name: 'Gateway of India', category: 'Landmark', lat: 18.922, lng: 72.8347, photo: 'Gateway_of_India_at_night.jpg' },
  { id: 'hawa-mahal', name: 'Hawa Mahal', category: 'Landmark', lat: 26.9239, lng: 75.8267, photo: 'Hawa_Mahal_in_Jaipur.jpg' },
  { id: 'everest', name: 'Mount Everest', category: 'Nature', lat: 27.9881, lng: 86.925, photo: 'Mount_Everest_as_seen_from_Drukair2_PLW_edit.jpg' },
  { id: 'kathmandu', name: 'Boudhanath Stupa', category: 'Landmark', lat: 27.7215, lng: 85.362, photo: 'Boudhanath_Stupa_Kathmandu.jpg' },
  { id: 'forbidden-city', name: 'Forbidden City', category: 'Landmark', lat: 39.9163, lng: 116.3972, photo: 'Forbidden_City_Beijing_Shenwumen_Gate.jpg' },
  { id: 'great-wall', name: 'Great Wall at Mutianyu', category: 'Landmark', lat: 40.4319, lng: 116.5704, photo: 'Great_Wall_of_China_at_Mutianyu.jpg' },
  { id: 'shanghai-bund', name: 'The Bund, Shanghai', category: 'Landmark', lat: 31.24, lng: 121.49, photo: 'The_Bund_Shanghai.jpg' },
  { id: 'hong-kong', name: 'Victoria Harbour, Hong Kong', category: 'City', lat: 22.286, lng: 114.158, photo: 'Hong_Kong_Skyline_view_from_the_peak_2017.jpg' },
  { id: 'taipei-101', name: 'Taipei 101', category: 'Landmark', lat: 25.034, lng: 121.5645, photo: 'Taipei_101_from_Xiangshan.jpg' },
  { id: 'seoul-palace', name: 'Gyeongbokgung Palace', category: 'Landmark', lat: 37.5796, lng: 126.977, photo: 'Gyeongbokgung_Palace,_Seoul.jpg' },
  { id: 'tokyo', name: 'Tokyo', category: 'City', lat: 35.6762, lng: 139.6503, photo: 'Tokyo_Skyline_2020.jpg' },
  { id: 'fuji', name: 'Mount Fuji', category: 'Nature', lat: 35.3606, lng: 138.7274, photo: 'Mount_Fuji_from_Motosu.jpg' },
  { id: 'kyoto', name: 'Fushimi Inari Shrine', category: 'Landmark', lat: 34.9671, lng: 135.7727, photo: 'Fushimi_Inari_Taisha_torii_gate.jpg' },
  { id: 'grand-palace-bangkok', name: 'Grand Palace, Bangkok', category: 'Landmark', lat: 13.75, lng: 100.4915, photo: 'Bangkok_Grand_Palace.jpg' },
  { id: 'marina-bay', name: 'Marina Bay Sands', category: 'Landmark', lat: 1.2834, lng: 103.8607, photo: 'Marina_Bay_Sands_in_the_Evening_-_20101120.jpg' },
  { id: 'angkor', name: 'Angkor Wat', category: 'Landmark', lat: 13.4125, lng: 103.867, photo: 'Angkor_Wat_Wikimedia_Commons.jpg' },
  { id: 'ha-long', name: 'Ha Long Bay', category: 'Nature', lat: 20.9101, lng: 107.1839, photo: 'Ha_Long_Bay_in_Vietnam.jpg' },
  { id: 'borobudur', name: 'Borobudur', category: 'Landmark', lat: -7.6079, lng: 110.2038, photo: 'Borobudur-Nothwest-view.jpg' },
  { id: 'tanah-lot', name: 'Tanah Lot', category: 'Landmark', lat: -8.6211, lng: 115.0868, photo: 'Tanah_Lot_in_Bali.jpg' },

  // Oceania & Pacific
  { id: 'sydney', name: 'Sydney Opera House', category: 'Landmark', lat: -33.8568, lng: 151.2153, photo: 'Sydney_Opera_House_Sails.jpg' },
  { id: 'uluru', name: 'Uluru', category: 'Nature', lat: -25.3444, lng: 131.0369, photo: 'Uluru,_Northern_Territory,_Australia.jpg' },
  { id: 'great-barrier', name: 'Great Barrier Reef', category: 'Nature', lat: -18.2871, lng: 147.6992, photo: 'GreatBarrierReef-EO.JPG' },
  { id: 'auckland', name: 'Auckland', category: 'City', lat: -36.8509, lng: 174.7645, photo: 'Auckland_skyline_from_Devonport.jpg' },
  { id: 'queenstown', name: 'Queenstown', category: 'City', lat: -45.0312, lng: 168.6626, photo: 'Queenstown_and_Lake_Wakatipu.jpg' },
  { id: 'milford-sound', name: 'Milford Sound', category: 'Nature', lat: -44.6167, lng: 167.8667, photo: 'Milford_Sound,_New_Zealand.jpg' },
  { id: 'mount-cook', name: 'Aoraki / Mount Cook', category: 'Nature', lat: -43.594, lng: 170.142, photo: 'Aoraki_Mount_Cook_from_Hooker_Lake.jpg' },
  { id: 'pearl-harbor', name: 'Pearl Harbor Memorial', category: 'Landmark', lat: 21.3644, lng: -157.9501, photo: 'USS_Arizona_Memorial.jpg' },
  { id: 'waikiki', name: 'Waikiki Beach', category: 'Nature', lat: 21.2767, lng: -157.8275, photo: 'Waikiki_Beach,_Honolulu.jpg' },
]

export function placeById(id: string): Place | undefined {
  return PLACES.find((place) => place.id === id)
}

export function pickPlace(usedIds: string[]): Place {
  const unused = PLACES.filter((place) => !usedIds.includes(place.id))
  const pool = unused.length > 0 ? unused : PLACES
  return pool[Math.floor(Math.random() * pool.length)]
}

export const PLACE_COUNT = PLACES.length
