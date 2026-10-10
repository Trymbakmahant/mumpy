'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

export interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Brand & General
  brandTitle: {
    en: 'Mumpy',
    hi: 'मंपी',
  },
  hubLiveDispatch: {
    en: 'Live Water Deliveries',
    hi: 'दैनिक जल वितरण सक्रिय',
  },
  bottlesInTransit: {
    en: 'Bottles in Transit',
    hi: 'रास्ते में बोतलें',
  },
  deliveredToday: {
    en: 'Delivered Today',
    hi: 'आज डिलीवर की गईं',
  },
  searchPlaceholder: {
    en: 'Search crates, routes, IDs...',
    hi: 'क्रेट, रूट, आईडी खोजें...',
  },
  operationalAlerts: {
    en: 'Operational Alerts',
    hi: 'ऑपरेशनल अलर्ट्स',
  },
  broadcastUrgentAlert: {
    en: 'Broadcast Urgent Alert to Fleet →',
    hi: 'फ्लीट को तत्काल अलर्ट ब्रॉडकास्ट करें →',
  },

  // Sidebar / Operational Units
  operationalUnits: {
    en: 'Operational Units',
    hi: 'संचालन इकाइयां',
  },
  driverProximity: {
    en: 'Driver & Proximity',
    hi: 'ड्राइवर और निकटता',
  },
  fleetLiveMap: {
    en: 'Fleet Live Map',
    hi: 'फ्लीट लाइव मैप',
  },
  adminInsights: {
    en: 'Admin Insights',
    hi: 'एडमिन इनसाइट्स',
  },
  customerDirectory: {
    en: 'Customer Directory',
    hi: 'ग्राहक निर्देशिका',
  },
  deliveryHistory: {
    en: 'History & Settlements',
    hi: 'इतिहास और निपटान',
  },
  plantReservoir: {
    en: 'Plant Reservoir',
    hi: 'प्लांट जलाशय',
  },
  full: {
    en: 'Full',
    hi: 'भरा हुआ',
  },
  roLineActive: {
    en: 'RO Line Active',
    hi: 'आरओ लाइन सक्रिय',
  },

  // Mobile Bottom Nav
  deliverTab: {
    en: 'Deliver',
    hi: 'डिलीवरी',
  },
  fleetTab: {
    en: 'Fleet',
    hi: 'फ्लीट',
  },
  analyticsTab: {
    en: 'Analytics',
    hi: 'एनालिटिक्स',
  },
  customersTab: {
    en: 'Customers',
    hi: 'ग्राहक',
  },

  // Admin Insights / Financials
  financialHub: {
    en: 'Financial Hub',
    hi: 'वित्तीय केंद्र',
  },
  realtimeLedgerSynced: {
    en: 'Real-time ledger synced 2 mins ago',
    hi: 'रियल-टाइम बहीखाता 2 मिनट पहले सिंक हुआ',
  },
  revenueMatrixTitle: {
    en: 'Revenue & Area Consumption Matrix',
    hi: 'राजस्व और क्षेत्र खपत मैट्रिक्स',
  },
  revenueMatrixSubtitle: {
    en: 'Live telemetry and cash collection breakdown across delivery routes',
    hi: 'डिलीवरी मार्गों में लाइव टेलीमेट्री और कैश कलेक्शन विवरण',
  },
  dailySalesCsv: {
    en: 'Daily Sales CSV',
    hi: 'दैनिक बिक्री CSV',
  },
  manifest: {
    en: 'Manifest',
    hi: 'मैनिफेस्ट',
  },
  gstSummary: {
    en: 'GST Summary',
    hi: 'जीएसटी सारांश',
  },
  grossRevenueToday: {
    en: 'Gross Revenue Today',
    hi: 'आज का कुल राजस्व',
  },
  vsYesterday: {
    en: '+14.2% vs Yesterday',
    hi: '+14.2% कल की तुलना में',
  },
  target: {
    en: 'Target',
    hi: 'लक्ष्य',
  },
  hydrationUnitsDispatched: {
    en: 'Hydration Units Dispatched',
    hi: 'डिस्पैच की गई पानी की इकाइयां',
  },
  mumpyBottles: {
    en: '1L Mumpy Bottles',
    hi: '1L मंपी बोतलें',
  },
  jars20L: {
    en: '20L Jars',
    hi: '20L जार',
  },
  paymentMix: {
    en: 'Payment Mix',
    hi: 'भुगतान मिश्रण',
  },
  avgProximityStop: {
    en: 'Avg Proximity Stop',
    hi: 'औसत निकटता स्टॉप',
  },
  fleetSpeedSla: {
    en: 'Fleet Speed SLA',
    hi: 'फ्लीट गति एसएलए',
  },
  optimal: {
    en: 'OPTIMAL',
    hi: 'उत्कृष्ट (OPTIMAL)',
  },
  areaHeatmapTitle: {
    en: 'Area Water Consumption Heatmap',
    hi: 'क्षेत्र जल खपत हीटमैप',
  },
  rankingDeliverySectors: {
    en: 'Ranking delivery sectors by daily carton & jar density',
    hi: 'दैनिक कार्टन और जार घनत्व के अनुसार सेक्टर रैंकिंग',
  },
  liveRouteTelemetry: {
    en: 'Live Route Telemetry',
    hi: 'लाइव रूट टेलीमेट्री',
  },
  weeklyRevenueChartTitle: {
    en: 'Weekly Revenue vs Bottle Volume',
    hi: 'साप्ताहिक राजस्व बनाम बोतल मात्रा',
  },
  weeklyRevenueSubtitle: {
    en: '7-Day correlation showing continuous demand scaling',
    hi: 'लगातार मांग वृद्धि दर्शाने वाला 7-दिवसीय विश्लेषण',
  },
  revenueInr: {
    en: 'Revenue (₹)',
    hi: 'राजस्व (₹)',
  },
  volumeUnits: {
    en: 'Volume (Units)',
    hi: 'मात्रा (इकाइयां)',
  },
  total7DayRevenue: {
    en: 'Total 7-day revenue',
    hi: 'कुल 7-दिवसीय राजस्व',
  },
  totalVolume: {
    en: 'Total Volume',
    hi: 'कुल मात्रा',
  },
  paymentStreamTitle: {
    en: 'Payment Stream',
    hi: 'भुगतान प्रवाह (लाइव फीड)',
  },
  liveFeed: {
    en: 'Live Feed',
    hi: 'लाइव फीड',
  },
  viewAllInvoices: {
    en: 'View All 142 Invoices Today →',
    hi: 'आज के सभी 142 इनवॉइस देखें →',
  },
  packagingUnitA: {
    en: 'PACKAGING UNIT A',
    hi: 'पैकेजिंग यूनिट ए',
  },
  primarySku: {
    en: 'PRIMARY SKU',
    hi: 'प्राथमिक उत्पाद (SKU)',
  },
  mumpyMineralPackDesc: {
    en: '1 Litre PET with Added Minerals. Packaged Drinking Water conforming to national purity specs.',
    hi: 'खनिज युक्त 1 लीटर पीईटी बोतल। राष्ट्रीय शुद्धता मानकों के अनुसार पैकेज्ड पेयजल।',
  },
  currentStock: {
    en: 'Current Stock',
    hi: 'वर्तमान स्टॉक',
  },
  bufferRate: {
    en: 'Buffer Rate',
    hi: 'बफर दर',
  },
  mineralTdsLevel: {
    en: 'Mineral TDS Level',
    hi: 'खनिज टीडीएस स्तर',
  },
  phPurityMetric: {
    en: 'pH Purity Metric',
    hi: 'पीएच शुद्धता स्तर',
  },
  cappingVelocity: {
    en: 'Capping Line Velocity',
    hi: 'कैपिंग लाइन गति',
  },
  microFiltrationLog: {
    en: 'Micro-Filtration Log',
    hi: 'माइक्रो-फ़िल्ट्रेशन स्थिति',
  },
  verifiedClean: {
    en: 'Verified Clean',
    hi: 'प्रमाणित स्वच्छ',
  },
  bottlingReserveFleet: {
    en: 'Bottling Reserve Fleet',
    hi: 'बॉटलिंग रिज़र्व बेड़ा',
  },
  hubAvailable: {
    en: 'Plant Reserve: 8,400L Available',
    hi: 'प्लांट रिज़र्व: 8,400L उपलब्ध',
  },
  deployExtra: {
    en: 'Deploy Extra',
    hi: 'अतिरिक्त भेजें',
  },

  // Fleet View
  telemetryStreamLive: {
    en: 'Telemetry Stream Live',
    hi: 'टेलीमेट्री स्ट्रीम लाइव',
  },
  shiftHours: {
    en: 'Shift 06:00 - 18:00 IST',
    hi: 'शिफ्ट 06:00 - 18:00 IST',
  },
  fleetCommandTitle: {
    en: 'Fleet & Dispatch Command',
    hi: 'फ्लीट और डिस्पैच कमान',
  },
  fleetCommandSubtitle: {
    en: 'Real-time water crate telemetry, bottle exhaustion status, and route dispatch radar.',
    hi: 'रीयल-टाइम क्रेट टेलीमेट्री, बोतल समाप्ति स्थिति और रूट डिस्पैच रडार।',
  },
  filterRoutes: {
    en: 'Filter Routes',
    hi: 'मार्ग फ़िल्टर',
  },
  broadcastToDrivers: {
    en: 'Broadcast to Drivers',
    hi: 'ड्राइवरों को ब्रॉडकास्ट करें',
  },
  activeVans: {
    en: 'Active Vans',
    hi: 'सक्रिय वैन',
  },
  onDutyFleet: {
    en: '100% On-Duty Fleet',
    hi: '100% ड्यूटी पर',
  },
  loadedAt0600: {
    en: 'Loaded at 06:00',
    hi: 'सुबह 06:00 बजे लोड',
  },
  deliveredMetric: {
    en: 'Delivered',
    hi: 'डिलीवर किया गया',
  },
  inTransitMetric: {
    en: 'In Transit',
    hi: 'रास्ते में',
  },
  activeCrateCargo: {
    en: 'Active Crate Cargo',
    hi: 'सक्रिय क्रेट कार्गो',
  },
  refillRequired: {
    en: 'Refill Required',
    hi: 'रीफिल की आवश्यकता',
  },
  under10Bottles: {
    en: 'Under 10 bottles remaining',
    hi: '10 से कम बोतलें शेष',
  },
  spatialRadarTitle: {
    en: 'Live Sector Spatial Radar',
    hi: 'लाइव सेक्टर स्थानिक रडार',
  },
  puneBelt: {
    en: 'Town Water Distribution Belt • Live GPS Sync',
    hi: 'नगर जल वितरण क्षेत्र • लाइव जीपीएस सिंक',
  },
  centralPlantHub: {
    en: 'MAIN WATER PLANT',
    hi: 'मुख्य जल संयंत्र (प्लांट)',
  },
  fleetPickupsTitle: {
    en: 'Fleet Pickups',
    hi: 'फ्लीट पिकअप सूची',
  },
  gpsSynced: {
    en: 'GPS Synced',
    hi: 'जीपीएस सिंक किया गया',
  },
  departed: {
    en: 'Departed',
    hi: 'प्रस्थान समय',
  },
  initialLoad: {
    en: 'Initial Load',
    hi: 'प्रारंभिक लोड',
  },
  remaining: {
    en: 'Remaining',
    hi: 'शेष बोतलें',
  },
  reassignRoute: {
    en: 'Reassign Route',
    hi: 'रूट पुनः सौंपें',
  },
  orderPlantRefill: {
    en: 'Order Plant Refill',
    hi: 'प्लांट रीफिल ऑर्डर करें',
  },

  // Driver & Proximity
  pilot: {
    en: 'Pilot',
    hi: 'चालक (पायलट)',
  },
  reloadStock: {
    en: 'Reload Stock (Hub Depot: 1.8km)',
    hi: 'स्टॉक पुनः लोड करें (हब डिपो: 1.8km)',
  },
  proximityQueueTitle: {
    en: 'Proximity Queue',
    hi: 'निकटता कतार',
  },
  sortedByGps: {
    en: 'Sorted by live distance from van coordinates',
    hi: 'वैन जीपीएस दूरी के अनुसार क्रमबद्ध',
  },
  allNearby: {
    en: 'All Nearby',
    hi: 'सभी निकटतम',
  },
  logDropOff: {
    en: 'Log Drop-off',
    hi: 'ड्रॉप-ऑफ दर्ज करें',
  },
  instantDeliveryEntry: {
    en: 'INSTANT DELIVERY ENTRY',
    hi: 'त्वरित डिलीवरी प्रविष्टि',
  },
  verifiedSealed: {
    en: 'Verified Sealed',
    hi: 'प्रमाणित सीलबंद',
  },
  deliveredCount: {
    en: 'Delivered',
    hi: 'डिलीवर किया',
  },
  fullMumpyCans: {
    en: 'Full Mumpy bottles/cans',
    hi: 'भरी हुई मंपी बोतलें/कैन',
  },
  emptiesReturned: {
    en: 'Empties Returned',
    hi: 'खाली कैन वापस मिले',
  },
  cleanReturnableCans: {
    en: 'Clean returnable cans',
    hi: 'वापस करने योग्य साफ कैन',
  },
  paymentCollection: {
    en: 'Payment Collection',
    hi: 'भुगतान संग्रह',
  },
  cash: {
    en: 'Cash',
    hi: 'नकद',
  },
  upiQr: {
    en: 'UPI QR',
    hi: 'यूपीआई क्यूआर',
  },
  monthlyLedger: {
    en: 'Monthly Ledger',
    hi: 'मासिक खाता',
  },
  oldBalanceCredits: {
    en: 'Old Balance / Credits',
    hi: 'पुराना बकाया / क्रेडिट',
  },
  previousOutstandingBalance: {
    en: 'Previous Outstanding Balance',
    hi: 'पिछला बकाया खाता',
  },
  collectOldBalance: {
    en: 'Collect Old Balance Now',
    hi: 'यह बकाया आज ही लें',
  },
  clearFullBalance: {
    en: 'Pay Full Balance',
    hi: 'पूरा बकाया चुकता',
  },
  accountAllClear: {
    en: 'All Cleared (Zero Dues)',
    hi: 'खाता चुकता (शून्य बकाया)',
  },
  creditAvailable: {
    en: 'Advance Credit Available',
    hi: 'अग्रिम क्रेडिट उपलब्ध',
  },
  applyCredit: {
    en: 'Apply Credit to Current Bill',
    hi: 'वर्तमान बिल पर क्रेडिट लागू करें',
  },
  currentDeliveryCharge: {
    en: 'Current Delivery',
    hi: 'वर्तमान डिलीवरी',
  },
  oldBalanceSettled: {
    en: 'Old Balance Settled',
    hi: 'पुराना बकाया चुकता',
  },
  totalToCollect: {
    en: 'Total to Collect',
    hi: 'कुल संग्रह राशि',
  },
  payCurrentDelivery: {
    en: 'Pay Current Delivery',
    hi: 'आज की डिलीवरी का भुगतान',
  },
  deferToLedger: {
    en: 'Defer to Ledger',
    hi: 'खाते में बाद में',
  },
  instantPaymentRequiredForDues: {
    en: 'Settling past balance requires Cash or UPI payment (Monthly Ledger unavailable)',
    hi: 'पुराना बकाया चुकता करने के लिए नकद या यूपीआई आवश्यक है (मासिक खाता अनुपलब्ध)',
  },
  dropOffNotePlaceholder: {
    en: 'e.g. Handed to security guard Mohan / Left at flat',
    hi: 'उदा. सुरक्षा गार्ड मोहन को सौंपा / फ्लैट पर छोड़ा',
  },
  confirmAndGenerateSms: {
    en: 'Confirm & Generate Instant SMS Receipt',
    hi: 'पुष्टि करें और तत्काल एसएमएस रसीद बनाएं',
  },
  avgStopDuration: {
    en: 'Avg Stop Duration',
    hi: 'औसत स्टॉप अवधि',
  },
  emptiesRecovered: {
    en: 'Empties Recovered',
    hi: 'खाली कैन प्राप्त किए',
  },
  cashUpiInVan: {
    en: 'Cash/UPI In-Van',
    hi: 'वैन में नकद/यूपीआई',
  },
  dailyDropsCompleted: {
    en: 'Daily Drops Completed',
    hi: 'दैनिक ड्रॉप्स पूर्ण',
  },

  // Customer Directory & Onboarding
  crmProtocol: {
    en: 'CRM & ROUTING PROTOCOL',
    hi: 'सीआरएम और रूटिंग प्रोटोकॉल',
  },
  customerDirectoryTitle: {
    en: 'Customer Onboarding & Route Directory',
    hi: 'ग्राहक ऑनबोर्डिंग और रूट निर्देशिका',
  },
  customerDirectorySubtitle: {
    en: 'Streamlined intake for residential bulk subscriptions, commercial hubs, and verified GPS routing.',
    hi: 'आवासीय थोक सदस्यता, वाणिज्यिक केंद्रों और सत्यापित जीपीएस रूटिंग के लिए सुव्यवस्थित व्यवस्था।',
  },
  totalAccounts: {
    en: 'Total Accounts',
    hi: 'कुल खाते',
  },
  newThisMonth: {
    en: 'New This Month',
    hi: 'इस महीने नए',
  },
  activeFulfillment: {
    en: 'Active Fulfillment',
    hi: 'सक्रिय पूर्ति दर',
  },
  newCustomerOnboarding: {
    en: 'New Customer Onboarding',
    hi: 'नए ग्राहक का ऑनबोर्डिंग',
  },
  contactBillingIdentity: {
    en: 'Contact & Billing Identity',
    hi: 'संपर्क और बिलिंग पहचान',
  },
  residential: {
    en: 'Residential',
    hi: 'आवासीय',
  },
  officeB2b: {
    en: 'Office / B2B',
    hi: 'कार्यालय / B2B',
  },
  fullNameEntity: {
    en: 'Full Name / Corporate Entity',
    hi: 'पूरा नाम / कंपनी का नाम',
  },
  primaryContactSms: {
    en: 'Primary Contact (SMS Dispatches)',
    hi: 'प्राथमिक मोबाइल नंबर (एसएमएस)',
  },
  billingEmail: {
    en: 'Billing Email',
    hi: 'बिलिंग ईमेल',
  },
  whatsAppOptIn: {
    en: 'Send WhatsApp live delivery notifications & empties ledger receipts',
    hi: 'व्हाट्सएप पर लाइव डिलीवरी अपडेट और खाली कैन रसीदें भेजें',
  },
  deliveryDestination: {
    en: 'Delivery Destination & Coordinates',
    hi: 'डिलीवरी पता और जीपीएस निर्देशांक',
  },
  operationalSector: {
    en: 'Operational Sector / Hub',
    hi: 'परिचालन सेक्टर / हब',
  },
  assignedRouteVan: {
    en: 'Assigned Route Van',
    hi: 'सौंपी गई डिलीवरी वैन',
  },
  premisesUnit: {
    en: 'Premises / Floor / Unit Number',
    hi: 'भवन / मंजिल / यूनिट नंबर',
  },
  fetchCoordinates: {
    en: 'Fetch Coordinates',
    hi: 'जीपीएस निर्देशांक प्राप्त करें',
  },
  waterSpecQuota: {
    en: 'Water Specification & Quota',
    hi: 'जल विनिर्देश और कोटा',
  },
  mineralCan20L: {
    en: '20L Mineral Cans',
    hi: '20L मिनरल कैन',
  },
  mumpyCase1L: {
    en: 'Mumpy 1L Case',
    hi: 'मंपी 1L केस (12 बोतलें)',
  },
  quantityPerDrop: {
    en: 'Quantity / Drop',
    hi: 'मात्रा / ड्रॉप',
  },
  cadence: {
    en: 'Cadence',
    hi: 'आवृत्ति (दिन)',
  },
  slot: {
    en: 'Slot',
    hi: 'समय स्लॉट',
  },
  daily: {
    en: 'Daily',
    hi: 'प्रतिदिन',
  },
  altDays: {
    en: 'Alternate Days',
    hi: 'एक दिन छोड़कर',
  },
  weeklyMon: {
    en: 'Weekly Mon',
    hi: 'साप्ताहिक (सोमवार)',
  },
  emptyCanDeposit: {
    en: 'Empty Can Security Deposit',
    hi: 'खाली कैन सुरक्षा जमा राशि (रिफंडेबल)',
  },
  saveAndAssignRoute: {
    en: 'Save & Assign Route',
    hi: 'ग्राहक सहेजें और रूट सौंपें',
  },
  tagQr: {
    en: 'Tag QR',
    hi: 'क्यूआर टैग करें',
  },
  clientDirectoryTitle: {
    en: 'Client Directory & Subscriptions',
    hi: 'ग्राहक निर्देशिका और सदस्यता सूची',
  },
  exportRunSheet: {
    en: 'Export Run Sheet',
    hi: 'रन शीट निर्यात करें',
  },
  allSectors: {
    en: 'All Sectors',
    hi: 'सभी सेक्टर',
  },
  call: {
    en: 'Call',
    hi: 'कॉल करें',
  },
  routeDirections: {
    en: 'Directions',
    hi: 'दिशा-निर्देश',
  },
  step1of3: {
    en: 'Step 1 of 3',
    hi: 'चरण 1 / 3',
  },
  fastDispatchTagging: {
    en: 'Fast dispatch tagging with live coordinate lock',
    hi: 'लाइव जीपीएस निर्देशांक लॉक के साथ त्वरित डिस्पैच टैगिंग',
  },
  precisionGpsTag: {
    en: 'Precision GPS Telematics Tag',
    hi: 'सटीक जीपीएस टेलीमैटिक्स टैग',
  },
  canDesc: {
    en: 'Reverse osmosis + minerals. ₹75/can refilled.',
    hi: 'रिवर्स ऑस्मोसिस + खनिज। ₹75 प्रति कैन रीफिल।',
  },
  caseDesc: {
    en: 'Carton of 12 sealed twist-cap bottles. ₹180/case.',
    hi: '12 सीलबंद बोतलों का कार्टन। ₹180 प्रति केस।',
  },
  emptyCanDepositCalc: {
    en: 'Empty Can Security Deposit (₹150 × {count} cans):',
    hi: 'खाली कैन सुरक्षा जमा राशि (₹150 × {count} कैन):',
  },
  automatedManifestSyncNote: {
    en: 'Automated Manifest Sync: Newly onboarded clients are automatically queued into driver manifest checklist with GPS geo-fencing at 100m proximity.',
    hi: 'स्वचालित मैनिफ़ेस्ट सिंक: नए ऑनबोर्ड किए गए ग्राहकों को 100 मीटर की निकटता पर जीपीएस जियो-फेंसिंग के साथ ड्राइवर मैनिफ़ेस्ट चेकलिस्ट में स्वचालित रूप से कतारबद्ध किया जाता है।',
  },
  routeClusterOptimization: {
    en: 'Route Cluster Optimization',
    hi: 'रूट क्लस्टर अनुकूलन',
  },
  clusterDesc: {
    en: 'Town Dispatch: Average delivery travel time dropped to 8.4 mins following route clustering.',
    hi: 'नगर डिलीवरी: रूट क्लस्टरिंग के बाद औसत डिलीवरी समय घटकर 8.4 मिनट हो गया।',
  },
  emptiesInTransit: {
    en: 'Empties in Transit',
    hi: 'रास्ते में खाली कैन',
  },
  depositsHeld: {
    en: 'Deposits Held',
    hi: 'जमा राशि रखी गई',
  },
  manageBottleBalances: {
    en: 'Manage bottle balances, delivery cadences, and routing tags',
    hi: 'बोतल बैलेंस, डिलीवरी आवृत्ति और रूट टैग प्रबंधित करें',
  },
  searchClientPlaceholder: {
    en: 'Search by name, ID, mobile, premises...',
    hi: 'नाम, आईडी, मोबाइल, परिसर से खोजें...',
  },
  allocation: {
    en: 'Allocation',
    hi: 'आवंटन',
  },
  emptiesBalance: {
    en: 'Empties Balance',
    hi: 'खाली कैन बैलेंस',
  },
  showingAccounts: {
    en: 'Showing {filtered} of {total} active water distribution accounts',
    hi: 'सक्रिय जल वितरण खातों में से {filtered} / {total} प्रदर्शित',
  },
  previous: {
    en: 'Previous',
    hi: 'पिछला',
  },
  next: {
    en: 'Next',
    hi: 'अगला',
  },
  updated2mAgo: {
    en: 'Updated 2m ago',
    hi: '2 मिनट पहले अपडेट किया गया',
  },

  // Modals
  orderPlantRefillModalTitle: {
    en: 'Order Plant Refill',
    hi: 'प्लांट रीफिल ऑर्डर करें',
  },
  orderPlantRefillDesc: {
    en: 'Dispatch quick replenishment vehicle from Main Water Plant Dock to intercept',
    hi: 'मुख्य जल संयंत्र से त्वरित आपूर्ति वाहन रवाना करें',
  },
  refillCrateQuantity: {
    en: 'Refill Crate Quantity:',
    hi: 'रीफिल क्रेट मात्रा:',
  },
  estInterceptTime: {
    en: 'Est. Intercept Time:',
    hi: 'अनुमानित इंटरसेप्ट समय:',
  },
  hubDepotDistance: {
    en: '14 Mins (Main Plant: 1.8km)',
    hi: '14 मिनट (मुख्य प्लांट: 1.8 किमी)',
  },
  dispatchReplenishment: {
    en: 'Dispatch Replenishment',
    hi: 'आपूर्ति रवाना करें',
  },
  cancel: {
    en: 'Cancel',
    hi: 'रद्द करें',
  },
  instantMerchantUpi: {
    en: 'Mumpy Instant Merchant UPI',
    hi: 'मंपी इंस्टेंट मर्चेंट यूपीआई',
  },
  paymentFor: {
    en: 'Payment for',
    hi: 'के लिए भुगतान',
  },
  zeroMerchantSurcharge: {
    en: 'Zero Merchant Surcharge Active',
    hi: 'शून्य मर्चेंट अधिभार सक्रिय',
  },
  simulateScanPay: {
    en: 'Simulate Successful Scan & Pay',
    hi: 'सफल स्कैन और भुगतान का अनुकरण करें',
  },
  verifyingDoorstepUpi: {
    en: 'Verifying Doorstep UPI Transaction...',
    hi: 'डोरस्टेप यूपीआई लेनदेन सत्यापित कर रहा है...',
  },
  switchToCashLedger: {
    en: 'Switch to Cash / Ledger',
    hi: 'नकद / खाता बही पर स्विच करें',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('mumpy_lang') as Language;
    if (saved === 'en' || saved === 'hi') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mumpy_lang', lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) return key;
    return translations[key][language] || translations[key]['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
