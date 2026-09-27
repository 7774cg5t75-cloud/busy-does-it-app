
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  StatusBar,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";

const C = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  ink: "#162033",
  muted: "#687386",
  blue: "#3671E3",
  blueSoft: "#EAF1FF",
  green: "#238F57",
  greenSoft: "#EAF7F0",
  amber: "#B86B10",
  amberSoft: "#FFF5E8",
  red: "#B23A3A",
  border: "#DDE3EC",
  shadow: "#111827",
};

const servicesSeed = [
  { id: "driveway", name: "Driveway cleaning", value: 250, wanted: true },
  { id: "gutters", name: "Gutter clearing", value: 90, wanted: false },
  { id: "patio", name: "Patio cleaning", value: 220, wanted: true },
];

const customerSeed = [
  { id: "c1", name: "Sarah Mitchell", phone: "07700 900101", service: "Driveway cleaning", lastServiceDate: "2025-01-10", lastJobValue: 260, contactOk: true },
  { id: "c2", name: "John Parker", phone: "07700 900102", service: "Patio cleaning", lastServiceDate: "2024-12-05", lastJobValue: 220, contactOk: true },
  { id: "c3", name: "Megan Turner", phone: "07700 900103", service: "Driveway cleaning", lastServiceDate: "2025-02-15", lastJobValue: 280, contactOk: true },
  { id: "c4", name: "Chris Lewis", phone: "07700 900104", service: "Gutter clearing", lastServiceDate: "2025-03-20", lastJobValue: 95, contactOk: true },
  { id: "c5", name: "Anita Green", phone: "07700 900105", service: "Patio cleaning", lastServiceDate: "2025-05-01", lastJobValue: 240, contactOk: true },
  { id: "c6", name: "Rob Davies", phone: "07700 900106", service: "Driveway cleaning", lastServiceDate: "2025-06-12", lastJobValue: 310, contactOk: true },
  { id: "c7", name: "Elaine Cooper", phone: "07700 900107", service: "Patio cleaning", lastServiceDate: "2025-07-07", lastJobValue: 230, contactOk: true },
  { id: "c8", name: "Paul Brown", phone: "07700 900108", service: "Gutter clearing", lastServiceDate: "2026-04-15", lastJobValue: 90, contactOk: true },
  { id: "c9", name: "Lucy White", phone: "07700 900109", service: "Driveway cleaning", lastServiceDate: "2024-11-30", lastJobValue: 275, contactOk: false },
];

function monthsSince(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

function isEligibleCustomer(customer) {
  return !!customer?.contactOk && monthsSince(customer?.lastServiceDate) >= 9;
}

function formatMonthsAgo(dateString) {
  const months = Math.floor(monthsSince(dateString));
  if (!months) return "recent";
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function dateFromISO(dateString) {
  const match = String(dateString || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date();
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
}

function dateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatUKDate(dateString) {
  const date = dateFromISO(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


const previousCustomerGroups = [
  {
    id: "lapsed",
    title: "21 customers who haven’t booked in 9+ months",
    reason: "They already know your business, so they’re a low-cost place to start.",
  },
  {
    id: "repeat",
    title: "8 customers due a repeat service",
    reason: "Their previous service timing suggests they may be ready again.",
  },
  {
    id: "high",
    title: "6 previous high-value customers",
    reason: "These customers previously booked your higher-value work.",
  },
];


const STORAGE_KEY = "@busy-does-it-v05";

const connectionSeed = {
  calendar: false,
  googleBusiness: false,
  meta: false,
  googleAds: false,
  crm: false,
  invoicing: false,
};

const connectionRows = [
  ["calendar", "Calendar", "Helps spot quiet days automatically"],
  ["googleBusiness", "Google Business", "Helps understand local presence and reviews"],
  ["meta", "Facebook / Instagram", "Lets approved posts and adverts run"],
  ["googleAds", "Google Ads", "Lets approved local advert tests run"],
  ["crm", "CRM / job system", "Helps follow enquiries through to jobs"],
  ["invoicing", "Invoicing", "Helps measure paid work instead of clicks"],
];

const campaignSteps = [
  {
    id: "past-customers",
    title: "Contact 12 previous customers",
    audience: "12 previous customers",
    cost: "about £1.20",
    adSpend: "£0",
    message:
      "Hi, we’ve got a slot free this Thursday for driveway or patio cleaning. If you’d like a quote or want to book it, just reply here.",
    why:
      "They already know your business, 12 are overdue for another service, and contacting them costs almost nothing. That is why we try this before paying for advertising.",
    evidence: [
      ["Eligible previous customers", "12"],
      ["Time since last booking", "10+ months"],
      ["Estimated message cost", "£1.20"],
      ["Advertising required", "£0"],
      ["Confidence", "Medium–high"],
    ],
    resultTitle: "1 job booked",
    resultBody: "12 contacted • 4 replied • 2 interested. One part of the quiet period is filled.",
    resultFooter: "Booked job value: about £260",
  },
  {
    id: "old-enquiries",
    title: "Follow up 4 old enquiries",
    audience: "4 old enquiries",
    cost: "£0 ad spend",
    adSpend: "£0",
    message:
      "Hi, you asked us about exterior cleaning a little while ago. We’ve got a space coming up and I wanted to check whether you still wanted a quote. No problem if not.",
    why:
      "These people already showed interest, so following them up is cheaper and lower-risk than buying new attention.",
    evidence: [
      ["Old enquiries worth retrying", "4"],
      ["Previously requested a quote", "Yes"],
      ["Advertising required", "£0"],
      ["Confidence", "Medium"],
    ],
    resultTitle: "1 useful reply",
    resultBody: "4 followed up • 1 replied • no second booking yet. The remaining space is still open.",
    resultFooter: "Advertising spend so far: £0",
  },
  {
    id: "old-quotes",
    title: "Revisit 3 old quotes",
    audience: "3 old quotes",
    cost: "£0 ad spend",
    adSpend: "£0",
    message:
      "Hi, we quoted for your exterior cleaning previously. We’ve had a space open up and can still help if the job is on your list. Reply if you’d like us to revisit the quote.",
    why:
      "A quote means the customer got further than a normal enquiry. It is worth checking before spending money on new leads.",
    evidence: [
      ["Old quotes still relevant", "3"],
      ["Average quoted value", "£310"],
      ["Advertising required", "£0"],
      ["Confidence", "Medium"],
    ],
    resultTitle: "No booking yet",
    resultBody: "3 quotes revisited • 1 asked for a later date • the current space is still open.",
    resultFooter: "Advertising spend so far: £0",
  },
  {
    id: "cross-sell",
    title: "Offer a gutter add-on to 6 customers",
    audience: "6 nearby previous customers",
    cost: "message cost only",
    adSpend: "£0",
    message:
      "Hi, we’ll already be working nearby and have a small gap available. If your gutters need clearing, we can quote for that while we’re in the area. Reply if useful.",
    why:
      "These are existing customers near work you already have. A relevant add-on can fill small gaps without paying to reach strangers.",
    evidence: [
      ["Nearby previous customers", "6"],
      ["Relevant add-on", "Gutter clearing"],
      ["Advertising required", "£0"],
      ["Confidence", "Medium"],
    ],
    resultTitle: "Free options exhausted",
    resultBody: "6 customers contacted • no booking for the remaining space. We have now tried the sensible low-cost options first.",
    resultFooter: "Paid advertising has not started",
  },
];

function App() {
  const [hydrated, setHydrated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [screen, setScreen] = useState("welcome");
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("Home");
  const [businessName, setBusinessName] = useState("Dave's Exterior Cleaning");
  const [trade, setTrade] = useState("Exterior cleaning");
  const [postcode, setPostcode] = useState("EX17");
  const [radius, setRadius] = useState("15");
  const [quietSlot, setQuietSlot] = useState("Thursday afternoon");
  const [previousCustomerCount, setPreviousCustomerCount] = useState("14");
  const [eligibleCustomerCount, setEligibleCustomerCount] = useState("12");
  const [oldEnquiryCount, setOldEnquiryCount] = useState("4");
  const [oldQuoteCount, setOldQuoteCount] = useState("3");
  const [oldQuoteTopValue, setOldQuoteTopValue] = useState("340");
  const [unansweredReviewCount, setUnansweredReviewCount] = useState("4");
  const [recentPhotoCountNeeded, setRecentPhotoCountNeeded] = useState("2");
  const [customers, setCustomers] = useState(customerSeed);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerService, setNewCustomerService] = useState("Driveway cleaning");
  const [newCustomerDate, setNewCustomerDate] = useState("2025-01-01");
  const [newCustomerValue, setNewCustomerValue] = useState("");
  const [newCustomerContactOk, setNewCustomerContactOk] = useState(true);
  const [services, setServices] = useState(servicesSeed);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceValue, setNewServiceValue] = useState("");
  const [alwaysAsk, setAlwaysAsk] = useState(true);
  const [customerContact, setCustomerContact] = useState(true);
  const [testLimit, setTestLimit] = useState("25");
  const [weeklyLimit, setWeeklyLimit] = useState("100");
  const [connectedAccounts, setConnectedAccounts] = useState(connectionSeed);
  const [dismissedOpportunities, setDismissedOpportunities] = useState([]);
  const [selectedGap, setSelectedGap] = useState("Thursday afternoon");
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState(previousCustomerGroups[0]);
  const [selectedServiceId, setSelectedServiceId] = useState("driveway");
  const [moreWorkGoal, setMoreWorkGoal] = useState("More work next week");
  const [campaignStage, setCampaignStage] = useState(0);
  const [adBudget, setAdBudget] = useState("20");
  const [message, setMessage] = useState(campaignSteps[0].message);
  const [bringBackMessage, setBringBackMessage] = useState(
    "Hi, it’s been a while since we last helped. We’ve got a couple of spaces next week if you need any exterior cleaning. Reply here if you’d like us to take a look."
  );
  const [offerGoal, setOfferGoal] = useState("Fill a quiet day");
  const [offerService, setOfferService] = useState("Driveway cleaning");
  const [normalPrice, setNormalPrice] = useState("250");
  const [offerPrice, setOfferPrice] = useState("225");
  const [offerDates, setOfferDates] = useState("Tuesday & Wednesday");
  const [offerMax, setOfferMax] = useState("4");
  const [offerPaused, setOfferPaused] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [outcome, setOutcome] = useState("Won");
  const [wonValue, setWonValue] = useState("620");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active || !raw) return;
        const saved = JSON.parse(raw);
        if (typeof saved.onboardingComplete === "boolean") setOnboardingComplete(saved.onboardingComplete);
        if (saved.businessName) setBusinessName(saved.businessName);
        if (saved.trade) setTrade(saved.trade);
        if (saved.postcode) setPostcode(saved.postcode);
        if (saved.radius) setRadius(saved.radius);
        if (saved.quietSlot) setQuietSlot(saved.quietSlot);
        if (saved.previousCustomerCount !== undefined) setPreviousCustomerCount(String(saved.previousCustomerCount));
        if (saved.eligibleCustomerCount !== undefined) setEligibleCustomerCount(String(saved.eligibleCustomerCount));
        if (saved.oldEnquiryCount !== undefined) setOldEnquiryCount(String(saved.oldEnquiryCount));
        if (saved.oldQuoteCount !== undefined) setOldQuoteCount(String(saved.oldQuoteCount));
        if (saved.oldQuoteTopValue !== undefined) setOldQuoteTopValue(String(saved.oldQuoteTopValue));
        if (saved.unansweredReviewCount !== undefined) setUnansweredReviewCount(String(saved.unansweredReviewCount));
        if (saved.recentPhotoCountNeeded !== undefined) setRecentPhotoCountNeeded(String(saved.recentPhotoCountNeeded));
        if (Array.isArray(saved.customers)) setCustomers(saved.customers);
        if (Array.isArray(saved.services)) setServices(saved.services);
        if (typeof saved.alwaysAsk === "boolean") setAlwaysAsk(saved.alwaysAsk);
        if (typeof saved.customerContact === "boolean") setCustomerContact(saved.customerContact);
        if (saved.testLimit) setTestLimit(saved.testLimit);
        if (saved.weeklyLimit) setWeeklyLimit(saved.weeklyLimit);
        if (saved.connectedAccounts) setConnectedAccounts({ ...connectionSeed, ...saved.connectedAccounts });
        if (Array.isArray(saved.dismissedOpportunities)) setDismissedOpportunities(saved.dismissedOpportunities);
        if (saved.selectedServiceId) setSelectedServiceId(saved.selectedServiceId);
        if (typeof saved.advanced === "boolean") setAdvanced(saved.advanced);
        if (saved.onboardingComplete) {
          setScreen("home");
          setTab("Home");
        }
      } catch (e) {
        // Prototype persistence should never block the app from opening.
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const data = {
      onboardingComplete,
      businessName,
      trade,
      postcode,
      radius,
      quietSlot,
      previousCustomerCount,
      eligibleCustomerCount,
      oldEnquiryCount,
      oldQuoteCount,
      oldQuoteTopValue,
      unansweredReviewCount,
      recentPhotoCountNeeded,
      customers,
      services,
      alwaysAsk,
      customerContact,
      testLimit,
      weeklyLimit,
      connectedAccounts,
      dismissedOpportunities,
      selectedServiceId,
      advanced,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [
    hydrated,
    onboardingComplete,
    businessName,
    trade,
    postcode,
    radius,
    quietSlot,
    previousCustomerCount,
    eligibleCustomerCount,
    oldEnquiryCount,
    oldQuoteCount,
    oldQuoteTopValue,
    unansweredReviewCount,
    recentPhotoCountNeeded,
    customers,
    services,
    alwaysAsk,
    customerContact,
    testLimit,
    weeklyLimit,
    connectedAccounts,
    dismissedOpportunities,
    selectedServiceId,
    advanced,
  ]);

  const go = (next) => {
    setHistory((h) => [...h, screen]);
    setScreen(next);
  };

  const back = () => {
    if (!history.length) return;
    const copy = [...history];
    const prev = copy.pop();
    setHistory(copy);
    setScreen(prev);
  };

  const jump = (next, nextTab = tab) => {
    setHistory([]);
    setScreen(next);
    setTab(nextTab);
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
    jump("home", "Home");
  };

  const toggleConnection = (key) => {
    setConnectedAccounts((current) => ({ ...current, [key]: !current[key] }));
  };

  const dismissOpportunity = (id) => {
    setDismissedOpportunities((items) => (items.includes(id) ? items : [...items, id]));
  };

  const restoreOpportunities = () => setDismissedOpportunities([]);

  const startCampaign = (stage = 0) => {
    const safeStage = Math.max(0, Math.min(stage, campaignSteps.length - 1));
    const wantedServices = services.filter((x) => x.wanted).slice(0, 2).map((x) => x.name.toLowerCase());
    const serviceText =
      wantedServices.length >= 2
        ? `${wantedServices[0]} or ${wantedServices[1]}`
        : wantedServices[0] || trade.toLowerCase() || "your usual work";

    setCampaignStage(safeStage);
    if (safeStage === 0) {
      setMessage(`Hi, we’ve got a slot free ${quietSlot.toLowerCase()} for ${serviceText}. If you’d like a quote or want to book it, just reply here.`);
    } else if (safeStage === 1) {
      setMessage(`Hi, you asked us about ${trade.toLowerCase()} a little while ago. We’ve got some availability coming up and I wanted to check whether you still wanted a quote. No problem if not.`);
    } else {
      setMessage(campaignSteps[safeStage].message);
    }
    go("checkSend");
  };

  const prepareOfferFromGoal = () => {
    const preferred = services.find((x) => x.id === selectedServiceId) || services.find((x) => x.wanted) || services[0];
    const serviceName = preferred?.name || "Driveway cleaning";
    const baseValue = Number(preferred?.value) > 0 ? Number(preferred.value) : 250;
    setOfferService(serviceName);
    setNormalPrice(String(baseValue));

    if (offerGoal === "Fill a quiet day") {
      setOfferPrice(String(Math.max(1, Math.round(baseValue * 0.9))));
      setOfferDates("Tuesday & Wednesday");
      setOfferMax("4");
    } else if (offerGoal === "Get more bookings") {
      setOfferPrice(String(Math.max(1, Math.round(baseValue * 0.95))));
      setOfferDates("Next 14 days");
      setOfferMax("6");
    } else if (offerGoal === "Promote a service") {
      setOfferPrice(String(baseValue));
      setOfferDates("Next 2 weeks");
      setOfferMax("5");
    } else if (offerGoal === "Bring customers back") {
      setOfferPrice(String(baseValue));
      setOfferDates("Next 10 days");
      setOfferMax("5");
    } else {
      setOfferPrice(String(Math.max(1, Math.round(baseValue * 0.9))));
      setOfferDates("Limited seasonal window");
      setOfferMax("6");
    }
    go("offerBuild");
  };

  const addCustomer = () => {
    const name = newCustomerName.trim();
    const phone = newCustomerPhone.trim();
    const service = newCustomerService.trim() || trade || "Service";
    const parsedValue = Number(String(newCustomerValue).replace(/[^0-9.]/g, ""));
    const dateIsValid = !Number.isNaN(new Date(newCustomerDate).getTime());
    if (!name || !phone || !dateIsValid) return false;

    setCustomers((list) => [
      ...list,
      {
        id: `customer-${Date.now()}`,
        name,
        phone,
        service,
        lastServiceDate: newCustomerDate,
        lastJobValue: Number.isFinite(parsedValue) ? parsedValue : 0,
        contactOk: newCustomerContactOk,
      },
    ]);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerValue("");
    setNewCustomerContactOk(true);
    return true;
  };

  const removeCustomer = (id) => {
    setCustomers((list) => list.filter((customer) => customer.id !== id));
  };

  const resetPrototype = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setOnboardingComplete(false);
    setBusinessName("Dave's Exterior Cleaning");
    setTrade("Exterior cleaning");
    setPostcode("EX17");
    setRadius("15");
    setQuietSlot("Thursday afternoon");
    setPreviousCustomerCount("14");
    setEligibleCustomerCount("12");
    setOldEnquiryCount("4");
    setOldQuoteCount("3");
    setOldQuoteTopValue("340");
    setUnansweredReviewCount("4");
    setRecentPhotoCountNeeded("2");
    setCustomers(customerSeed);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerService("Driveway cleaning");
    setNewCustomerDate("2025-01-01");
    setNewCustomerValue("");
    setNewCustomerContactOk(true);
    setServices(servicesSeed);
    setAlwaysAsk(true);
    setCustomerContact(true);
    setTestLimit("25");
    setWeeklyLimit("100");
    setConnectedAccounts(connectionSeed);
    setDismissedOpportunities([]);
    setSelectedServiceId("driveway");
    setAdvanced(false);
    setHistory([]);
    setTab("Home");
    setScreen("welcome");
  };

  const selectedService = services.find((x) => x.id === selectedServiceId) || services[0];
  const eligibleCustomers = customers.filter(isEligibleCustomer);

  const appState = {
    screen,
    history,
    go,
    back,
    jump,
    tab,
    setTab,
    onboardingComplete,
    completeOnboarding,
    businessName,
    setBusinessName,
    trade,
    setTrade,
    postcode,
    setPostcode,
    radius,
    setRadius,
    quietSlot,
    setQuietSlot,
    previousCustomerCount,
    setPreviousCustomerCount,
    eligibleCustomerCount,
    setEligibleCustomerCount,
    oldEnquiryCount,
    setOldEnquiryCount,
    oldQuoteCount,
    setOldQuoteCount,
    oldQuoteTopValue,
    setOldQuoteTopValue,
    unansweredReviewCount,
    setUnansweredReviewCount,
    recentPhotoCountNeeded,
    setRecentPhotoCountNeeded,
    customers,
    setCustomers,
    eligibleCustomers,
    newCustomerName,
    setNewCustomerName,
    newCustomerPhone,
    setNewCustomerPhone,
    newCustomerService,
    setNewCustomerService,
    newCustomerDate,
    setNewCustomerDate,
    newCustomerValue,
    setNewCustomerValue,
    newCustomerContactOk,
    setNewCustomerContactOk,
    addCustomer,
    removeCustomer,
    services,
    setServices,
    newServiceName,
    setNewServiceName,
    newServiceValue,
    setNewServiceValue,
    alwaysAsk,
    setAlwaysAsk,
    customerContact,
    setCustomerContact,
    testLimit,
    setTestLimit,
    weeklyLimit,
    setWeeklyLimit,
    connectedAccounts,
    toggleConnection,
    dismissedOpportunities,
    dismissOpportunity,
    restoreOpportunities,
    selectedGap,
    setSelectedGap,
    selectedCustomerGroup,
    setSelectedCustomerGroup,
    selectedServiceId,
    setSelectedServiceId,
    selectedService,
    moreWorkGoal,
    setMoreWorkGoal,
    campaignStage,
    setCampaignStage,
    startCampaign,
    adBudget,
    setAdBudget,
    message,
    setMessage,
    bringBackMessage,
    setBringBackMessage,
    offerGoal,
    setOfferGoal,
    prepareOfferFromGoal,
    offerService,
    setOfferService,
    normalPrice,
    setNormalPrice,
    offerPrice,
    setOfferPrice,
    offerDates,
    setOfferDates,
    offerMax,
    setOfferMax,
    offerPaused,
    setOfferPaused,
    advanced,
    setAdvanced,
    outcome,
    setOutcome,
    wonValue,
    setWonValue,
    resetPrototype,
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.brand}>BUSY DOES IT</Text>
          <Text style={styles.loadingText}>Loading your prototype…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const component = screens[screen] || HomeScreen;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      {React.createElement(component, { s: appState })}
    </SafeAreaView>
  );
}

function Shell({ s, children, title, subtitle, brandCue, noNav = false, noBack = false }) {
  return (
    <View style={styles.shell}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.brand}>BUSY DOES IT</Text>
            <Text style={styles.tagline}>More work. Less fuss.</Text>
            <Text style={styles.prototypeBadge}>Prototype v0.5 • customer records + simulated sends</Text>
          </View>
          {!noBack && s.history?.length > 0 ? (
            <Pressable onPress={s.back} style={styles.backPill}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : null}
        </View>

        {brandCue ? <Text style={styles.brandCue}>{brandCue}</Text> : null}
        {title ? <Text style={styles.h1}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {children}
      </ScrollView>
      {!noNav ? <BottomNav s={s} /> : null}
    </View>
  );
}

function BottomNav({ s }) {
  const items = [
    ["Home", "home"],
    ["Work", "workNow"],
    ["Results", "results"],
    ["Settings", "settings"],
  ];
  return (
    <View style={styles.nav}>
      {items.map(([label, target]) => {
        const active = s.tab === label;
        return (
          <Pressable
            key={label}
            style={styles.navItem}
            onPress={() => {
              s.setTab(label);
              s.jump(target, label);
            }}
          >
            <View style={[styles.navDot, active && styles.navDotActive]} />
            <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Card({ eyebrow, title, body, footer, tone = "blue", children }) {
  const toneStyle =
    tone === "green"
      ? styles.cardGreen
      : tone === "amber"
      ? styles.cardAmber
      : styles.cardBlue;
  return (
    <View style={[styles.card, toneStyle]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {body ? <Text style={styles.cardBody}>{body}</Text> : null}
      {children}
      {footer ? <Text style={styles.cardFooter}>{footer}</Text> : null}
    </View>
  );
}

function Button({ label, onPress, primary = false, danger = false, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        primary && styles.buttonPrimary,
        danger && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          primary && styles.buttonTextPrimary,
          danger && styles.buttonTextPrimary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SmallLink({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.smallLinkWrap}>
      <Text style={styles.smallLink}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", prefix }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        {prefix ? <Text style={styles.fieldPrefix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          style={styles.fieldInput}
          placeholderTextColor="#9AA3B2"
        />
      </View>
    </View>
  );
}

function DatePickerField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const dateValue = dateFromISO(value);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={[styles.fieldBox, styles.dateFieldBox]}
      >
        <Text style={styles.dateFieldText}>{formatUKDate(value)}</Text>
        <Text style={styles.dateFieldHint}>{open ? "Close" : "Choose date"}</Text>
      </Pressable>

      {open ? (
        <View style={styles.datePickerPanel}>
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            locale="en-GB"
            onChange={(event, selectedDate) => {
              if (event?.type === "dismissed") {
                setOpen(false);
                return;
              }
              if (selectedDate) onChange(dateToISO(selectedDate));
            }}
          />
          <Button label="Done" onPress={() => setOpen(false)} />
        </View>
      ) : null}
    </View>
  );
}

function Choice({ label, selected, onPress, sub }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioCore} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
        {sub ? <Text style={styles.choiceSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

function ToggleRow({ title, body, value, onValueChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {body ? <Text style={styles.toggleBody}>{body}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#C8CFD9", true: "#9FC0FF" }}
        thumbColor={value ? C.blue : "#FFFFFF"}
      />
    </View>
  );
}

function MetricRow({ left, right, strong = false }) {
  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLeft, strong && styles.metricStrong]}>{left}</Text>
      <Text style={[styles.metricRight, strong && styles.metricStrong]}>{right}</Text>
    </View>
  );
}


function StatusChip({ label, tone = "blue" }) {
  const style = tone === "green" ? styles.chipGreen : tone === "amber" ? styles.chipAmber : styles.chipBlue;
  return (
    <View style={[styles.chip, style]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function InlineExplanation({ why, evidence = [] }) {
  const [showWhy, setShowWhy] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  return (
    <View style={styles.explainWrap}>
      <Pressable onPress={() => setShowWhy((v) => !v)} style={styles.inlineLinkWrap}>
        <Text style={styles.inlineLink}>{showWhy ? "Hide why" : "Why this?"}</Text>
      </Pressable>
      {showWhy ? (
        <View style={styles.inlinePanel}>
          <Text style={styles.inlineWhy}>{why}</Text>
          {evidence.length ? (
            <>
              <Pressable onPress={() => setShowEvidence((v) => !v)} style={styles.inlineLinkWrapLeft}>
                <Text style={styles.inlineLink}>{showEvidence ? "Hide evidence" : "Show evidence"}</Text>
              </Pressable>
              {showEvidence ? (
                <View style={styles.evidenceBox}>
                  {evidence.map(([left, right]) => (
                    <MetricRow key={left} left={left} right={right} />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function OpportunityCard({
  eyebrow,
  title,
  body,
  footer,
  status,
  tone = "blue",
  actionLabel = "Do it",
  onAction,
  onIgnore,
  why,
  evidence,
}) {
  const toneStyle = tone === "green" ? styles.opportunityGreen : tone === "amber" ? styles.opportunityAmber : styles.opportunityBlue;
  return (
    <View style={[styles.opportunityCard, toneStyle]}>
      <View style={styles.opportunityTop}>
        <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
        {status ? <StatusChip label={status} tone={tone} /> : null}
      </View>
      <Text style={styles.opportunityTitle}>{title}</Text>
      <Text style={styles.opportunityBody}>{body}</Text>
      {footer ? <Text style={styles.opportunityFooter}>{footer}</Text> : null}
      {why ? <InlineExplanation why={why} evidence={evidence} /> : null}
      <View style={styles.actionRow}>
        <Pressable onPress={onAction} style={styles.miniPrimary}>
          <Text style={styles.miniPrimaryText}>{actionLabel}</Text>
        </Pressable>
        {onIgnore ? (
          <Pressable onPress={onIgnore} style={styles.miniSecondary}>
            <Text style={styles.miniSecondaryText}>Ignore</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ProgressStrip({ current, total }) {
  const pct = Math.max(0, Math.min(1, current / total));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

function WelcomeScreen({ s }) {
  return (
    <Shell
      s={s}
      noNav
      noBack
      title="Need more work?"
      subtitle="Tell Busy Does It what the business needs. We’ll try the cheapest sensible moves first — and you stay in control."
    >
      <Card eyebrow="The idea" title="More work. Less fuss." tone="green">
        <Text style={styles.tick}>• Start with the business problem, not marketing jargon</Text>
        <Text style={styles.tick}>• Free and low-cost options before paid ads</Text>
        <Text style={styles.tick}>• Clear limits before money is spent</Text>
      </Card>
      <Button label="Get started" primary onPress={() => s.go("setupBusiness")} />
      <Text style={styles.helperCenter}>Quick setup first. Spending rules and account connections can be added later.</Text>
    </Shell>
  );
}

function SetupBusiness({ s }) {
  return (
    <Shell s={s} noNav title="About your business" subtitle="Just the basics. We can learn more later.">
      <Field label="Business name" value={s.businessName} onChangeText={s.setBusinessName} />
      <Field label="Trade or service" value={s.trade} onChangeText={s.setTrade} />
      <Field label="Postcode / base area" value={s.postcode} onChangeText={s.setPostcode} />
      <Field label="Service radius" value={s.radius} onChangeText={s.setRadius} keyboardType="number-pad" prefix="Miles" />
      <Button label="Continue" primary onPress={() => s.go("setupServices")} />
    </Shell>
  );
}

function SetupServices({ s }) {
  const toggleWanted = (id) => {
    s.setServices((list) => list.map((x) => (x.id === id ? { ...x, wanted: !x.wanted } : x)));
  };
  return (
    <Shell s={s} noNav title="What work do you want?" subtitle="Pick the work you most want more of. You can change this later.">
      {s.services.map((item) => (
        <Pressable key={item.id} onPress={() => toggleWanted(item.id)} style={[styles.serviceCard, item.wanted && styles.serviceCardWanted]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceValue}>Usually about £{item.value}</Text>
          </View>
          <Text style={[styles.star, item.wanted && styles.starOn]}>{item.wanted ? "★" : "☆"}</Text>
        </Pressable>
      ))}
      <Text style={styles.helper}>Tap the star on the work you most want more of.</Text>
      <Button label="+ Add a service" onPress={() => s.go("addService")} />
      <Button label="Open Busy Does It" primary onPress={s.completeOnboarding} />
      <Text style={styles.helperCenter}>That’s enough to start. Set spending limits and connect accounts later from Settings.</Text>
    </Shell>
  );
}

function AddService({ s }) {
  const save = () => {
    const name = s.newServiceName.trim();
    if (!name) return;
    const parsed = Number(String(s.newServiceValue).replace(/[^0-9.]/g, ""));
    s.setServices((list) => [
      ...list,
      {
        id: `custom-${Date.now()}`,
        name,
        value: Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0,
        wanted: true,
      },
    ]);
    s.setNewServiceName("");
    s.setNewServiceValue("");
    s.back();
  };

  return (
    <Shell s={s} noNav title="Add a service" subtitle="If you do it, you can add it. We won’t box you into a preset list.">
      <Field label="Service" value={s.newServiceName} onChangeText={s.setNewServiceName} placeholder="e.g. Conservatory roof cleaning" />
      <Field label="Rough job value" value={s.newServiceValue} onChangeText={s.setNewServiceValue} keyboardType="number-pad" prefix="£" placeholder="Optional" />
      <Card
        eyebrow="Why we ask"
        title="This helps Busy Does It find the right work"
        body="A rough value is enough. You can change it later, and the app can learn better values from real jobs over time."
      />
      <Button label="Add service" primary onPress={save} disabled={!s.newServiceName.trim()} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function SetupLimits({ s }) {
  return (
    <Shell s={s} noNav title="Your limits" subtitle="Set the rules before any marketing runs.">
      <ToggleRow
        title="Always ask before spending"
        body="On by default. You approve every paid test."
        value={s.alwaysAsk}
        onValueChange={s.setAlwaysAsk}
      />
      <ToggleRow
        title="Contact previous customers"
        body="Allow the app to suggest eligible previous customers first."
        value={s.customerContact}
        onValueChange={s.setCustomerContact}
      />
      <Field label="Maximum single test" value={s.testLimit} onChangeText={s.setTestLimit} keyboardType="number-pad" prefix="£" />
      <Field label="Weekly limit" value={s.weeklyLimit} onChangeText={s.setWeeklyLimit} keyboardType="number-pad" prefix="£" />
      <Button label="Save my limits" primary onPress={() => s.go("setupConnect")} />
    </Shell>
  );
}

function SetupConnect({ s }) {
  return (
    <Shell s={s} noNav title="Connect what you already use" subtitle="Nothing is shown as connected until you choose it.">
      {connectionRows.map(([key, label, body]) => {
        const connected = !!s.connectedAccounts[key];
        return (
          <View key={key} style={styles.connectRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.connectTitle}>{label}</Text>
              <Text style={styles.connectBody}>{body}</Text>
            </View>
            <Pressable style={[styles.connectButton, connected && styles.connectButtonOn]} onPress={() => s.toggleConnection(key)}>
              <Text style={[styles.connectButtonText, connected && { color: C.green }]}>{connected ? "Connected" : "Connect"}</Text>
            </Pressable>
          </View>
        );
      })}
      <Button label="Done" primary onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}


function HomeScreen({ s }) {
  const serviceName = s.selectedService?.name || s.services.find((x) => x.wanted)?.name || s.trade || "your priority service";
  const customerCount = s.customers.length;
  const eligibleCount = s.eligibleCustomers.length;
  const opportunities = [
    {
      id: "quiet-slot",
      eyebrow: "Capacity",
      title: `${s.quietSlot || "A quiet slot"} is free`,
      body: `You have ${customerCount} saved customer records. ${eligibleCount} are due and allowed to contact now.`,
      footer: "Recommended first move: £0 advertising spend",
      status: eligibleCount ? "Worth trying" : "No one due",
      tone: eligibleCount ? "green" : "blue",
      why: "Busy Does It checks actual saved customer records first. A customer is eligible when contact is allowed and their last recorded job was at least 9 months ago.",
      evidence: [
        ["Saved customer records", String(customerCount)],
        ["Eligible now", String(eligibleCount)],
        ["Eligibility rule", "9+ months + contact allowed"],
        ["Advertising required", "£0"],
      ],
      onAction: () => s.go("bestMove"),
    },
    {
      id: "profile-fixes",
      eyebrow: "Free improvement",
      title: "Check the free profile gaps",
      body: `Make sure ${serviceName.toLowerCase()} is clear, add ${s.recentPhotoCountNeeded || 0} recent photo${String(s.recentPhotoCountNeeded) === "1" ? "" : "s"}, and deal with ${s.unansweredReviewCount || 0} unanswered review${String(s.unansweredReviewCount) === "1" ? "" : "s"}.`,
      footer: "Cost: £0",
      status: "Free",
      tone: "blue",
      why: "Improve the places customers already find you before paying to send more people there.",
      evidence: [
        ["Priority service", serviceName],
        ["Recent photos wanted", String(s.recentPhotoCountNeeded || 0)],
        ["Unanswered reviews entered", String(s.unansweredReviewCount || 0)],
        ["Cost", "£0"],
      ],
      onAction: () => s.go("profileAudit"),
    },
    {
      id: "old-quotes",
      eyebrow: "Follow-up",
      title: `${s.oldQuoteCount || 0} old quote${String(s.oldQuoteCount) === "1" ? "" : "s"} worth a look`,
      body: `Highest value entered: about £${s.oldQuoteTopValue || 0}. Retrying them needs no advertising spend.`,
      footer: "Advertising spend: £0",
      status: "Low cost",
      tone: "blue",
      why: "These people already asked for a price, so checking whether the job is still live is cheaper than finding new leads.",
      evidence: [
        ["Old quotes entered", String(s.oldQuoteCount || 0)],
        ["Highest value", `£${s.oldQuoteTopValue || 0}`],
        ["Advertising required", "£0"],
      ],
      onAction: () => s.startCampaign(2),
    },
  ].filter((item) => !s.dismissedOpportunities.includes(item.id));

  return (
    <Shell
      s={s}
      noBack
      title="Here’s what I noticed"
      subtitle="Customer recommendations now come from individual records saved on this phone."
      brandCue="Real local records. Simulated sends."
    >
      <View style={styles.dashboardHeader}>
        <StatusChip label={`${opportunities.length} opportunities`} tone={opportunities.length ? "green" : "blue"} />
        <Text style={styles.dashboardHint}>Manage customer records any time from Home or Settings.</Text>
      </View>

      {opportunities.length ? (
        opportunities.map((item) => (
          <OpportunityCard
            key={item.id}
            {...item}
            actionLabel="Do it"
            onIgnore={() => s.dismissOpportunity(item.id)}
          />
        ))
      ) : (
        <Card eyebrow="All clear" title="Nothing urgent right now" body="You’ve ignored the current opportunities. Restore them any time to keep testing." tone="green" />
      )}

      {s.dismissedOpportunities.length ? <Button label="Restore ignored opportunities" onPress={s.restoreOpportunities} /> : null}
      <Button label="Customer records" onPress={() => s.go("customerRecords")} />
      <Button label="Update my business data" onPress={() => s.go("businessData")} />
      <Button label="Start something else" primary onPress={() => s.jump("workNow", "Work")} />
    </Shell>
  );
}

function WorkNow({ s }) {
  return (
    <Shell s={s} noBack title="Start something new" subtitle="Tell Busy Does It the business result you want. We’ll work out the marketing underneath.">
      <Card eyebrow="Goal first" title="You choose the problem — not the channel" body="No need to decide between ads, social, messages or audiences. Start with what the business needs." tone="green" />
      <Button label="Fill a spare day" primary onPress={() => s.go("chooseGap")} />
      <Button label="Get more work" onPress={() => s.go("moreWorkGoal")} />
      <Button label="Bring customers back" onPress={() => s.go("customerGroups")} />
      <Button label="Create an offer" onPress={() => s.go("offerGoal")} />
      <Button label="Check free improvements" onPress={() => s.go("profileAudit")} />
    </Shell>
  );
}

function ChooseGap({ s }) {
  const gaps = ["Thursday afternoon", "Friday", "Next Tuesday", "Any suitable work"];
  return (
    <Shell s={s} title="When do you want work?" subtitle="Pick the spare time you want us to help fill.">
      {gaps.map((g) => (
        <Choice key={g} label={g} selected={s.selectedGap === g} onPress={() => s.setSelectedGap(g)} />
      ))}
      <Button label="Find the best first move" primary onPress={() => s.go("bestMove")} />
    </Shell>
  );
}


function BestMove({ s }) {
  const count = s.eligibleCustomers.length;
  return (
    <Shell s={s} title="Best first move" subtitle="This recommendation is calculated from your saved customer records.">
      <OpportunityCard
        eyebrow="Recommended"
        title={count ? `Review ${count} previous customer${count === 1 ? "" : "s"}` : "No previous customers are due yet"}
        body={
          count
            ? `You have ${s.quietSlot || "a quiet slot"} to fill and ${count} customer records meet the current 9-month contact rule.`
            : "No saved customer currently meets the 9-month rule with contact permission switched on."
        }
        footer="Advertising spend: £0"
        status={count ? "Best first move" : "Nothing to send"}
        tone={count ? "green" : "blue"}
        actionLabel={count ? "Review customers" : "Manage customers"}
        onAction={() => s.go("eligibleCustomers")}
        why="Previous customers already know the business, so eligible records are checked before buying new attention."
        evidence={[
          ["Customer records", String(s.customers.length)],
          ["Eligible now", String(count)],
          ["Rule", "9+ months + contact allowed"],
          ["Advertising required", "£0"],
        ]}
      />
      <Button label="See other options" onPress={() => s.go("otherOptions")} />
      <Button label="Manage customer records" onPress={() => s.go("customerRecords")} />
      <Button label="Not now" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function WhyBestMove({ s }) {
  return (
    <Shell s={s} title="Why this?" subtitle="The short version, in plain English.">
      <Card
        eyebrow="Why we picked it"
        title="Previous customers are the lowest-risk first move"
        body="They already know your business, 12 are overdue for another service, and contacting them costs almost nothing. That is why we try this before paying for advertising."
        footer="Simple answer first"
        tone="green"
      />
      <Card
        eyebrow="What we checked"
        title="We compared the cheaper options"
        body="Previous customers, old enquiries, old quotes and cross-sell opportunities were considered before a paid advert."
      />
      <Button label="Show expert details" onPress={() => s.go("expertBestMove")} />
      <Button label="Got it" primary onPress={s.back} />
    </Shell>
  );
}

function ExpertBestMove({ s }) {
  return (
    <Shell s={s} title="Expert details" subtitle="The evidence behind this recommendation. You never need this screen to use Busy Does It.">
      <Card eyebrow="Recommendation proof" title="Contact 12 previous customers first" tone="green">
        <MetricRow left="Eligible previous customers" right="12" />        <MetricRow left="Time since last booking" right="10+ months" />
        <MetricRow left="Estimated direct message cost" right="£1.20" />
        <MetricRow left="Advertising spend required" right="£0" />
        <MetricRow left="Recommendation confidence" right="Medium–high" strong />
      </Card>
      <Card
        eyebrow="Decision logic"
        title="Why it outranked the alternatives"
        body="The audience has an existing relationship with the business, the action has very low financial exposure, and it can be stopped immediately if the spare slot fills. Paid advertising stays behind it because it introduces more cost and uncertainty."
      />
      <Card
        eyebrow="Data limits"
        title="What we do not know yet"
        body="This prototype does not have enough real campaign history to estimate conversion probability reliably. A live version would show the historical evidence used, sample size, confidence and any assumptions."
        tone="amber"
      />
      <Button label="Back to simple explanation" primary onPress={s.back} />
    </Shell>
  );
}

function ProfileAudit({ s }) {
  const serviceName = s.selectedService?.name || s.services.find((x) => x.wanted)?.name || s.trade || "your priority service";
  return (
    <Shell s={s} title="Free profile check" subtitle="These prompts use the profile numbers you entered. No live account is being read yet.">
      <OpportunityCard
        eyebrow="Service coverage"
        title={`Check that ${serviceName} is clearly listed`}
        body="Make sure customers can immediately see the work you most want more of."
        footer="Cost: £0"
        status="Free"
        actionLabel="Include"
        onAction={() => s.go("profileAuditPlan")}
        why="Clear service wording helps people who already find the business understand what you actually do."
        evidence={[["Priority service", serviceName], ["Cost", "£0"], ["Source", "Your saved business data"]]}
      />
      <OpportunityCard
        eyebrow="Photos"
        title={`Add ${s.recentPhotoCountNeeded || 0} recent photo${String(s.recentPhotoCountNeeded) === "1" ? "" : "s"}`}
        body="Recent before-and-after proof can make the profile more useful to customers who are already looking."
        footer="Cost: £0"
        status="Free"
        actionLabel="Include"
        onAction={() => s.go("profileAuditPlan")}
        why="Recent visual proof helps customers understand the quality and type of work without paying for more reach."
        evidence={[["Recent photos wanted", String(s.recentPhotoCountNeeded || 0)], ["Cost", "£0"], ["Source", "Your saved business data"]]}
      />
      <OpportunityCard
        eyebrow="Reviews"
        title={`Reply to ${s.unansweredReviewCount || 0} unanswered review${String(s.unansweredReviewCount) === "1" ? "" : "s"}`}
        body="A short genuine reply shows that the business is active and paying attention."
        footer="Cost: £0"
        status="Free"
        actionLabel="Include"
        onAction={() => s.go("profileAuditPlan")}
        why="The reviews already exist, so replying is a free way to improve the experience for people checking the business."
        evidence={[["Unanswered reviews entered", String(s.unansweredReviewCount || 0)], ["New ad spend", "£0"], ["Source", "Your saved business data"]]}
      />
      <Button label="Prepare all 3" primary onPress={() => s.go("profileAuditPlan")} />
      <Button label="Edit these numbers" onPress={() => s.go("businessData")} />
      <Button label="Not now" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function ProfileAuditPlan({ s }) {
  const serviceName = s.selectedService?.name || s.services.find((x) => x.wanted)?.name || s.trade || "your priority service";
  return (
    <Shell s={s} title="Free improvements first" subtitle="Nothing changes publicly in v0.4. These are preparation steps only.">
      <Card eyebrow="Step 1" title={`Check ${serviceName}`} body="Prepare clearer service wording and review it before anything is published." footer="Simulated preparation" />
      <Card eyebrow="Step 2" title={`Choose ${s.recentPhotoCountNeeded || 0} recent photo${String(s.recentPhotoCountNeeded) === "1" ? "" : "s"}`} body="Use recent before-and-after proof that represents the work accurately." footer="Simulated preparation" />
      <Card eyebrow="Step 3" title={`Prepare ${s.unansweredReviewCount || 0} review repl${String(s.unansweredReviewCount) === "1" ? "y" : "ies"}`} body="Draft short genuine replies in the business’s normal tone." footer="Simulated preparation" />
      <Button label="Done" primary onPress={() => s.jump("home", "Home")} />
      <Button label="Back" onPress={s.back} />
    </Shell>
  );
}

function ProfileAuditWhy({ s }) {
  return (
    <Shell s={s} title="Why these improvements?" subtitle="Simple explanation first. Expert evidence is available if you want it.">
      <Card
        eyebrow="Busy Does It logic"
        title="Improve what you already have before buying more attention"
        body="If someone is already finding your business online, a clearer and more complete profile may help without adding advertising cost. That is why we check free improvements before recommending paid promotion."
        footer="Cost-first, evidence-led"
        tone="green"
      />
      <Button label="Show expert details" onPress={() => s.go("expertProfileAudit")} />
      <Button label="Got it" primary onPress={s.back} />
    </Shell>
  );
}

function ExpertProfileAudit({ s }) {
  return (
    <Shell s={s} title="Expert audit details" subtitle="What was checked, what triggered the recommendation, and how certain we are.">
      <Card eyebrow="Sources checked" title="Current business presence">
        <MetricRow left="Website" right="Checked" />
        <MetricRow left="Google Business Profile" right="Checked" />
        <MetricRow left="Facebook / Instagram" right="Checked" />
        <MetricRow left="Calendar / CRM" right="Not needed here" />
      </Card>
      <Card eyebrow="Finding 1" title="Service coverage gap" body="Patio cleaning appears in the service list used by the app but is not clearly represented in the simulated Google Business profile." footer="Confidence: High" />
      <Card eyebrow="Finding 2" title="Recent visual proof is limited" body="The simulated profile contains no recent before-and-after photo pair for patio or driveway cleaning." footer="Confidence: Medium" />
      <Card eyebrow="Finding 3" title="Unanswered reviews" body="Four recent simulated reviews have no owner response." footer="Confidence: High" />
      <Card eyebrow="Important" title="A recommendation must be justifiable" body="In the live product, Busy Does It should show the real source, date, evidence and uncertainty. If the evidence is weak, it should lower confidence or say it does not know." tone="amber" />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function OtherOptions({ s }) {
  const options = [
    [1, "Follow up 4 old enquiries", "£0 ad spend", "People who asked before but never booked."],
    [2, "Revisit 3 old quotes", "£0 ad spend", "Quotes that are still worth trying."],
    [3, "Offer a gutter add-on", "£0 ad spend", "A relevant cross-sell to nearby previous customers."],
  ];
  return (
    <Shell s={s} title="Other options" subtitle="Still cheap-first. Paid advertising stays at the bottom of the list.">
      {options.map(([stage, a, b, c]) => (
        <Pressable key={a} style={styles.optionCard} onPress={() => s.startCampaign(stage)}>
          <Text style={styles.optionTitle}>{a}</Text>
          <Text style={styles.optionBody}>{c}</Text>
          <Text style={styles.optionCost}>{b}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.optionCard} onPress={() => s.go("paidTest")}>
        <Text style={styles.optionTitle}>Try a small local advert</Text>
        <Text style={styles.optionBody}>Only after the cheaper options are exhausted or you deliberately choose to skip ahead.</Text>
        <Text style={styles.optionCost}>Up to £{s.adBudget}</Text>
      </Pressable>
    </Shell>
  );
}


function CheckSend({ s }) {
  const baseStep = campaignSteps[s.campaignStage] || campaignSteps[0];
  const eligibleCount = s.eligibleCustomers.length;
  const step =
    s.campaignStage === 0
      ? {
          ...baseStep,
          title: `Contact ${eligibleCount} previous customer${eligibleCount === 1 ? "" : "s"}`,
          audience: `${eligibleCount} selected customer records`,
          why: "These specific saved customers meet the current reactivation rule: contact is allowed and their last recorded job was at least 9 months ago.",
          evidence: [
            ["Selected customer records", String(eligibleCount)],
            ["Eligibility rule", "9+ months + contact allowed"],
            ["Quiet slot", s.quietSlot || "Not set"],
            ["Advertising required", "£0"],
          ],
        }
      : s.campaignStage === 1
      ? {
          ...baseStep,
          title: `Follow up ${s.oldEnquiryCount || 0} old enquir${String(s.oldEnquiryCount) === "1" ? "y" : "ies"}`,
          audience: `${s.oldEnquiryCount || 0} old enquiries`,
          evidence: [["Old enquiries entered", String(s.oldEnquiryCount || 0)], ["Advertising required", "£0"], ["Data source", "Your saved business data"]],
        }
      : s.campaignStage === 2
      ? {
          ...baseStep,
          title: `Revisit ${s.oldQuoteCount || 0} old quote${String(s.oldQuoteCount) === "1" ? "" : "s"}`,
          audience: `${s.oldQuoteCount || 0} old quotes`,
          evidence: [["Old quotes entered", String(s.oldQuoteCount || 0)], ["Highest value", `£${s.oldQuoteTopValue || 0}`], ["Advertising required", "£0"], ["Data source", "Your saved business data"]],
        }
      : baseStep;

  return (
    <Shell s={s} title="Check before sending" subtitle="The recipient list is real local data. Sending is still simulated in v0.5.">
      <Card eyebrow={step.audience} title={step.title} footer={s.campaignStage === 0 ? "Advertising spend: £0" : `Estimated cost: ${step.cost}`}>
        <Text style={styles.helper}>Tap the draft below if you want to change it.</Text>
        <TextInput multiline value={s.message} onChangeText={s.setMessage} style={styles.messageInput} />
      </Card>
      <InlineExplanation why={step.why} evidence={step.evidence} />
      {s.campaignStage === 0 ? <SmallLink label="Review selected customers" onPress={() => s.go("eligibleCustomers")} /> : null}
      <Button label="Simulate send" primary disabled={s.campaignStage === 0 && !eligibleCount} onPress={() => s.go("progress")} />
      <Button label="Reset draft" onPress={() => s.startCampaign(s.campaignStage)} />
      <Button label="Skip" onPress={() => s.go("otherOptions")} />
    </Shell>
  );
}

function Progress({ s }) {
  const step = campaignSteps[s.campaignStage] || campaignSteps[0];
  const nextStage = s.campaignStage + 1;
  const hasAnotherFreeMove = nextStage < campaignSteps.length;
  const next = hasAnotherFreeMove ? campaignSteps[nextStage] : null;
  const progressCount = Math.min(s.campaignStage + 1, campaignSteps.length);

  return (
    <Shell s={s} title="Progress" subtitle="Busy Does It reassesses after every step instead of jumping straight to paid ads." brandCue="Cheapest sensible move first.">
      <StatusChip label={`Free-step ${progressCount} of ${campaignSteps.length}`} tone="green" />
      <ProgressStrip current={progressCount} total={campaignSteps.length} />
      <Card eyebrow="Latest result" title={step.resultTitle} body={step.resultBody} footer={step.resultFooter} tone="green" />

      {hasAnotherFreeMove ? (
        <OpportunityCard
          eyebrow="Next cheapest move"
          title={next.title}
          body="There is still capacity to fill, so we recommend another low-cost step before advertising."
          footer={`Advertising spend: ${next.adSpend}`}
          status="Try before ads"
          tone="blue"
          actionLabel="Try this next"
          onAction={() => s.startCampaign(nextStage)}
          why={next.why}
          evidence={next.evidence}
        />
      ) : (
        <OpportunityCard
          eyebrow="Free options checked"
          title="A small paid test is now reasonable to consider"
          body="We’ve tried the sensible low-cost steps in this demo and the remaining space is still open."
          footer={`Suggested cap: £${s.adBudget}`}
          status="Optional paid test"
          tone="amber"
          actionLabel="Review paid test"
          onAction={() => s.go("paidTest")}
          why="Paid advertising is only being suggested now because the cheaper relevant options have already been tried."
          evidence={[["Free / low-cost steps tried", String(campaignSteps.length)], ["Current suggested cap", `£${s.adBudget}`], ["Your single-test limit", `£${s.testLimit}`], ["Work guaranteed", "No"]]}
        />
      )}

      <Button label="View replies" onPress={() => s.go("replies")} />
      <Button label="Stop for now" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function Replies({ s }) {
  const replies = [
    ["Sarah M.", "Yes please — can you quote the patio as well?", "Interested"],
    ["John P.", "Thursday works. What time can you come?", "Booked"],
    ["Chris L.", "Not this month, thanks.", "Not now"],
    ["Megan T.", "Could you do next Friday instead?", "Interested"],
  ];
  return (
    <Shell s={s} title="Replies" subtitle="Plain-English status only.">
      {replies.map(([name, body, status]) => (
        <View style={styles.replyCard} key={name}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <Text style={styles.replyName}>{name}</Text>
            <Text style={styles.replyStatus}>{status}</Text>
          </View>
          <Text style={styles.replyBody}>{body}</Text>
        </View>
      ))}
      <Button label="Back to progress" primary onPress={s.back} />
    </Shell>
  );
}

function PaidTest({ s }) {
  const overSingleLimit = Number(s.adBudget || 0) > Number(s.testLimit || 0);
  return (
    <Shell s={s} title="Review a paid test" subtitle="Paid advertising is optional, capped and never presented as guaranteed work.">
      <Card
        eyebrow="Small paid test"
        title="Try a local advert"
        body={`Suggested test: £${s.adBudget}. Your single-test limit is £${s.testLimit}. Work is not guaranteed.`}
        footer={`Maximum at risk: £${s.adBudget}`}
        tone="amber"
      />
      <Field label="Maximum spend" value={s.adBudget} onChangeText={s.setAdBudget} keyboardType="number-pad" prefix="£" />
      {overSingleLimit ? <Text style={styles.warningText}>This is above your £{s.testLimit} single-test limit. Lower it or change your limit in Settings.</Text> : null}
      <InlineExplanation
        why="The free and low-cost options have been checked first in this flow. A capped local test is now one reasonable option, but it can still produce no work."
        evidence={[["Suggested test", `£${s.adBudget}`], ["Single-test limit", `£${s.testLimit}`], ["Weekly limit", `£${s.weeklyLimit}`], ["Guaranteed result", "No"]]}
      />
      <Button label={s.alwaysAsk ? `Approve £${s.adBudget}` : `Run within £${s.adBudget} cap`} primary disabled={overSingleLimit} onPress={() => s.go("paidRunning")} />
      <Button label="Skip" onPress={() => s.jump("home", "Home")} />
      <SmallLink label="How this works" onPress={() => s.go("howAdsWork")} />
    </Shell>
  );
}

function HowAdsWork({ s }) {
  return (
    <Shell s={s} title="How this works" subtitle="You don’t need to learn advertising to use it.">
      <Card
        eyebrow="Under the hood"
        title="We handle the marketing setup"
        body="The app chooses the most sensible local channel, prepares the advert and works inside the limit you approved. You see spend, genuine enquiries and jobs — not marketing jargon."
        footer="You can reveal advanced details later if you want"
      />
      <Button label="Got it" primary onPress={s.back} />
    </Shell>
  );
}

function PaidRunning({ s }) {
  return (
    <Shell s={s} title="Paid test running" subtitle="We’ll stop at your limit unless you approve more.">
      <Card
        eyebrow="Current test"
        title={`£8.40 of £${s.adBudget} spent`}
        body="2 people got in touch. 1 looks like a genuine job. No extra spend will happen beyond your limit."
        footer="Maximum at risk stays fixed"
        tone="green"
      />
      <Button label="See result" primary onPress={() => s.jump("results", "Results")} />
      <Button label="Stop test" danger onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function MoreWorkGoal({ s }) {
  const options = ["More work next week", "More work this month", "Promote a specific service", "Just find me the best opportunity"];
  return (
    <Shell s={s} title="What do you want?" subtitle="Choose the business goal. The plan underneath changes with it.">
      {options.map((x) => (
        <Choice key={x} label={x} selected={s.moreWorkGoal === x} onPress={() => s.setMoreWorkGoal(x)} />
      ))}
      {s.moreWorkGoal === "Promote a specific service" ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.fieldLabel}>Which service?</Text>
          {s.services.map((service) => (
            <Choice
              key={service.id}
              label={service.name}
              sub={`Usually about £${service.value}`}
              selected={s.selectedServiceId === service.id}
              onPress={() => s.setSelectedServiceId(service.id)}
            />
          ))}
        </View>
      ) : null}
      <Button label="Build my plan" primary onPress={() => s.go("workPlan")} />
    </Shell>
  );
}

function WorkPlan({ s }) {
  const service = s.selectedService?.name || "your chosen service";
  let plan;
  if (s.moreWorkGoal === "More work this month") {
    plan = {
      title: "Build a steadier month",
      subtitle: "Start with free improvements, then people who already know the business.",
      steps: [
        ["Step 1", "Fix the free profile gaps", "Improve what customers already see.", "Cost: £0"],
        ["Step 2", "Contact previous customers", "Only if more work is still needed.", "Advertising spend: £0"],
        ["Step 3", "Use a capped local test", "Only after cheaper options are used.", `Maximum test: £${s.testLimit}`],
      ],
      action: () => s.go("profileAudit"),
      label: "Start with the free fixes",
    };
  } else if (s.moreWorkGoal === "Promote a specific service") {
    plan = {
      title: `Find more ${service.toLowerCase()} work`,
      subtitle: "Use existing customer relationships and free profile coverage before paid reach.",
      steps: [
        ["Step 1", `Make ${service} clear everywhere`, "Check the profile and service wording.", "Cost: £0"],
        ["Step 2", "Try relevant previous customers", "Start with people who already know you.", "Advertising spend: £0"],
        ["Step 3", "Test paid local reach", "Only if more demand is still needed.", `Maximum test: £${s.testLimit}`],
      ],
      action: () => s.go("profileAudit"),
      label: "Start with the free check",
    };
  } else if (s.moreWorkGoal === "Just find me the best opportunity") {
    plan = {
      title: "Best opportunity right now",
      subtitle: "Busy Does It chooses the strongest low-cost move from the demo data.",
      steps: [
        ["Best now", "Contact 12 previous customers", "They are overdue and already know the business.", "Advertising spend: £0"],
        ["Next", "Follow up old enquiries", "Only if more work is still needed.", "Advertising spend: £0"],
        ["Later", "Consider a paid test", "Only after the cheaper steps.", `Maximum test: £${s.testLimit}`],
      ],
      action: () => s.go("bestMove"),
      label: "Show me the best move",
    };
  } else {
    plan = {
      title: "Get more work next week",
      subtitle: "Use warm leads first, one approved step at a time.",
      steps: [
        ["Step 1", "Contact previous customers", "Fastest low-cost audience to try first.", "Advertising spend: £0"],
        ["Step 2", "Follow up old enquiries", "Only if next week still has gaps.", "Advertising spend: £0"],
        ["Step 3", "Try a small local advert", "Only if cheaper options still haven’t done the job.", `Maximum paid test: £${s.testLimit}`],
      ],
      action: () => s.go("bestMove"),
      label: "Start step 1",
    };
  }

  return (
    <Shell s={s} title={plan.title} subtitle={plan.subtitle}>
      {plan.steps.map(([eyebrow, title, body, footer]) => (
        <Card key={eyebrow + title} eyebrow={eyebrow} title={title} body={body} footer={footer} tone={eyebrow === "Step 3" || eyebrow === "Later" ? "amber" : "blue"} />
      ))}
      <Button label={plan.label} primary onPress={plan.action} />
      <Button label="Change goal" onPress={s.back} />
    </Shell>
  );
}


function CustomerRecords({ s }) {
  return (
    <Shell
      s={s}
      title="Customer records"
      subtitle="Stored locally on this phone in v0.5. These records now drive the previous-customer recommendation."
    >
      <Card
        eyebrow="Current records"
        title={`${s.eligibleCustomers.length} of ${s.customers.length} are eligible now`}
        body="Eligible means contact is allowed and the last recorded job was at least 9 months ago."
        footer="No messages are actually sent in this prototype"
        tone="green"
      />
      {s.customers.map((customer) => {
        const eligible = isEligibleCustomer(customer);
        return (
          <View key={customer.id} style={styles.customerRecord}>
            <View style={styles.customerRecordTop}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerMeta}>{customer.phone}</Text>
              </View>
              <StatusChip label={eligible ? "Eligible now" : customer.contactOk ? "Not due" : "Do not contact"} tone={eligible ? "green" : "blue"} />
            </View>
            <Text style={styles.customerService}>{customer.service}</Text>
            <Text style={styles.customerMeta}>
              Last job: {customer.lastServiceDate} • {formatMonthsAgo(customer.lastServiceDate)}
              {Number(customer.lastJobValue) > 0 ? ` • £${customer.lastJobValue}` : ""}
            </Text>
            <Pressable onPress={() => s.removeCustomer(customer.id)} style={styles.removeCustomerWrap}>
              <Text style={styles.removeCustomerText}>Remove record</Text>
            </Pressable>
          </View>
        );
      })}
      <Button label="+ Add customer" primary onPress={() => s.go("addCustomerRecord")} />
      <Button label="Review eligible customers" onPress={() => s.go("eligibleCustomers")} />
      <Button label="Done" onPress={s.back} />
    </Shell>
  );
}

function AddCustomerRecord({ s }) {
  const validDate = !Number.isNaN(new Date(s.newCustomerDate).getTime());
  const canSave = !!s.newCustomerName.trim() && !!s.newCustomerPhone.trim() && validDate;

  return (
    <Shell
      s={s}
      title="Add customer"
      subtitle="A simple local record is enough for this prototype."
    >
      <Field label="Customer name" value={s.newCustomerName} onChangeText={s.setNewCustomerName} placeholder="e.g. Jane Smith" />
      <Field label="Phone" value={s.newCustomerPhone} onChangeText={s.setNewCustomerPhone} placeholder="e.g. 07700 900000" keyboardType="phone-pad" />
      <Field label="Last service" value={s.newCustomerService} onChangeText={s.setNewCustomerService} placeholder="e.g. Driveway cleaning" />
      <DatePickerField label="Last job date" value={s.newCustomerDate} onChange={s.setNewCustomerDate} />
      <Field label="Last job value" value={s.newCustomerValue} onChangeText={s.setNewCustomerValue} keyboardType="number-pad" prefix="£" placeholder="Optional" />
      <ToggleRow
        title="Okay to contact"
        body="Only customers with this switched on can be recommended for reactivation."
        value={s.newCustomerContactOk}
        onValueChange={s.setNewCustomerContactOk}
      />
      <Button
        label="Save customer"
        primary
        disabled={!canSave}
        onPress={() => {
          if (s.addCustomer()) s.back();
        }}
      />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function EligibleCustomers({ s }) {
  const eligible = s.eligibleCustomers;
  return (
    <Shell
      s={s}
      title="Customers to try first"
      subtitle="These are the actual saved records that meet the current rule."
    >
      <Card
        eyebrow="Selection rule"
        title={`${eligible.length} customer${eligible.length === 1 ? "" : "s"} selected`}
        body="Contact permission is on, and the last recorded job was at least 9 months ago."
        footer="Advertising spend: £0"
        tone="green"
      />
      {eligible.length ? (
        eligible.map((customer) => (
          <View key={customer.id} style={styles.customerRecord}>
            <View style={styles.customerRecordTop}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <StatusChip label="Eligible now" tone="green" />
            </View>
            <Text style={styles.customerService}>{customer.service}</Text>
            <Text style={styles.customerMeta}>
              {customer.phone} • Last job {formatMonthsAgo(customer.lastServiceDate)}
              {Number(customer.lastJobValue) > 0 ? ` • £${customer.lastJobValue}` : ""}
            </Text>
          </View>
        ))
      ) : (
        <Card eyebrow="No matches" title="Nobody is due under the current rule" body="Add customer records or update their dates and contact permission." />
      )}
      <Button
        label={eligible.length ? `Prepare message for ${eligible.length}` : "Manage customer records"}
        primary
        onPress={() => (eligible.length ? s.startCampaign(0) : s.go("customerRecords"))}
      />
      {eligible.length ? <Button label="Manage records" onPress={() => s.go("customerRecords")} /> : null}
    </Shell>
  );
}


function CustomerGroups({ s }) {
  const eligible = s.eligibleCustomers;
  const highValue = s.customers.filter((customer) => customer.contactOk && Number(customer.lastJobValue) >= 250);
  return (
    <Shell s={s} title="Customers worth trying" subtitle="Groups now come from the customer records stored on this phone.">
      <Card
        eyebrow="Due now"
        title={`${eligible.length} eligible customer${eligible.length === 1 ? "" : "s"}`}
        body="Contact permission is on and their last recorded job was at least 9 months ago."
        footer="Recommended first"
        tone="green"
      />
      <Card
        eyebrow="Higher-value history"
        title={`${highValue.length} customer${highValue.length === 1 ? "" : "s"} with £250+ previous jobs`}
        body="Useful context, but recency and contact permission still matter before sending anything."
      />
      <Button label="Review eligible customers" primary onPress={() => s.go("eligibleCustomers")} />
      <Button label="Manage customer records" onPress={() => s.go("customerRecords")} />
    </Shell>
  );
}

function BringBack({ s }) {
  return (
    <Shell s={s} title="Bring them back" subtitle="Approve the actual message — not an abstract campaign.">
      <Card eyebrow={s.selectedCustomerGroup.title} title="Message preview" footer="No predicted revenue — just a clear goal">
        <TextInput multiline value={s.bringBackMessage} onChangeText={s.setBringBackMessage} style={styles.messageInput} />
      </Card>
      <Button label="Approve & send" primary onPress={() => s.go("progress")} />
      <Button
        label="Reset draft"
        onPress={() =>
          s.setBringBackMessage(
            "Hi, it’s been a while since we last helped. We’ve got a couple of spaces next week if you need any exterior cleaning. Reply here if you’d like us to take a look."
          )
        }
      />
      <Button label="Skip" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function OfferGoal({ s }) {
  const goals = ["Fill a quiet day", "Get more bookings", "Promote a service", "Bring customers back", "Seasonal offer"];
  return (
    <Shell s={s} title="What is the offer for?" subtitle="The reason changes the offer we build." brandCue="Goal first, channel second.">
      {goals.map((g) => (
        <Choice key={g} label={g} selected={s.offerGoal === g} onPress={() => s.setOfferGoal(g)} />
      ))}
      {s.offerGoal === "Promote a service" ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.fieldLabel}>Service to promote</Text>
          {s.services.map((service) => (
            <Choice key={service.id} label={service.name} selected={s.selectedServiceId === service.id} onPress={() => s.setSelectedServiceId(service.id)} />
          ))}
        </View>
      ) : null}
      <Button label="Build the offer" primary onPress={s.prepareOfferFromGoal} />
    </Shell>
  );
}

function OfferBuild({ s }) {
  const guidance = {
    "Fill a quiet day": "Keep it limited to quieter days and a small booking cap so you protect margin.",
    "Get more bookings": "A modest incentive and a clear booking window is usually better than an unlimited discount.",
    "Promote a service": "You may not need a discount at all. Clear positioning and the right audience can be enough.",
    "Bring customers back": "Existing customers already know you, so avoid giving away more margin than necessary.",
    "Seasonal offer": "Make the reason and time window clear so it feels genuine rather than permanently discounted.",
  }[s.offerGoal];

  return (
    <Shell s={s} title="Build the offer" subtitle={`Goal: ${s.offerGoal}. Change anything before we recommend a plan.`}>
      <Field label="Service" value={s.offerService} onChangeText={s.setOfferService} />
      <Field label="Normal price" value={s.normalPrice} onChangeText={s.setNormalPrice} keyboardType="number-pad" prefix="£" />
      <Field label="Offer price" value={s.offerPrice} onChangeText={s.setOfferPrice} keyboardType="number-pad" prefix="£" />
      <Field label="Dates" value={s.offerDates} onChangeText={s.setOfferDates} />
      <Field label="Maximum bookings" value={s.offerMax} onChangeText={s.setOfferMax} keyboardType="number-pad" />
      <Card eyebrow="Margin check" title="Don’t discount more than the goal requires" body={guidance} tone="green" />
      <Button label="Improve it for me" primary onPress={() => s.go("offerPlan")} />
      <Button label="Use my offer" onPress={() => s.go("offerPlan")} />
    </Shell>
  );
}

function OfferPlan({ s }) {
  const audience =
    s.offerGoal === "Bring customers back"
      ? "Start with previous customers who have not booked recently."
      : s.offerGoal === "Promote a service"
      ? `Start with previous customers most likely to need ${s.offerService.toLowerCase()}.`
      : "Start with previous customers before buying new attention.";
  const priceChanged = String(s.offerPrice) !== String(s.normalPrice);
  const title = priceChanged ? `${s.offerService} — £${s.offerPrice}` : `${s.offerService} — no price cut`;

  return (
    <Shell s={s} title="This is what we recommend" subtitle="Use it as-is or change anything.">
      <OpportunityCard
        eyebrow="Recommended offer"
        title={title}
        body={`Normal price about £${s.normalPrice}. ${s.offerDates}. Maximum ${s.offerMax} bookings. ${audience}`}
        footer="Paid ads only if spaces remain"
        status={s.offerGoal}
        tone="green"
        actionLabel="Use this plan"
        onAction={() => s.go("offerRunning")}
        why="The plan is limited by date and booking capacity, starts with people who already know the business, and only adds paid reach if the target still has spaces."
        evidence={[["Offer goal", s.offerGoal], ["Booking cap", s.offerMax], ["Normal price", `£${s.normalPrice}`], ["Offer price", `£${s.offerPrice}`], ["Paid reach first?", "No"]]}
      />
      <Button label="Edit offer" onPress={s.back} />
      <Button label="Cancel" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function WhyOfferPlan({ s }) {
  return (
    <Shell s={s} title="Why this plan?" subtitle="The simple reason first.">
      <Card
        eyebrow="Offer logic"
        title="Fill quiet capacity without over-discounting"
        body="The offer is limited to quieter days and a maximum number of bookings. We start with previous customers because that is cheaper than buying new attention, then only use paid advertising if spaces remain."
        footer="Protect margin before chasing volume"
        tone="green"
      />
      <Button label="Show expert details" onPress={() => s.go("expertOfferPlan")} />
      <Button label="Got it" primary onPress={s.back} />
    </Shell>
  );
}

function ExpertOfferPlan({ s }) {
  return (
    <Shell s={s} title="Expert offer details" subtitle="The underlying reasoning and assumptions.">
      <Card eyebrow="Capacity" title={`${s.offerMax} booking cap`} body={`The offer is restricted to ${s.offerDates}, which is the capacity we are trying to fill.`} />
      <Card eyebrow="Pricing" title={`£${s.offerPrice} vs about £${s.normalPrice}`} body="The live product should compare the offer against known margin and past booking behaviour before recommending a discount." />
      <Card eyebrow="Audience sequence" title="Past customers before paid reach" body="Existing relationships normally have lower acquisition cost than cold advertising, so they are tested first when appropriate." footer="Paid promotion remains optional" />
      <Card eyebrow="Data quality" title="Prototype assumption" body="The current figures are dummy data. A live recommendation must expose the real evidence and lower confidence when margin, demand or attribution data is incomplete." tone="amber" />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function OfferRunning({ s }) {
  return (
    <Shell s={s} title={s.offerPaused ? "Offer paused" : "Offer running"} subtitle={s.offerPaused ? "Nothing new is being sent while paused." : "We stop automatically when the booking cap is reached."}>
      <Card
        eyebrow={s.offerPaused ? "Paused" : "Live offer"}
        title={`2 of ${s.offerMax} spaces booked`}
        body="24 past customers contacted. 5 replied. 2 booked. No paid advertising has been needed yet."
        footer="Won work so far: about £450"
        tone={s.offerPaused ? "amber" : "green"}
      />
      <Button label="View bookings" primary onPress={() => s.jump("results", "Results")} />
      <Button label={s.offerPaused ? "Resume offer" : "Pause offer"} onPress={() => s.setOfferPaused((v) => !v)} />
      <Button label="Stop offer" danger onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function Results({ s }) {
  return (
    <Shell s={s} noBack title="What happened?" subtitle="No marketing jargon — just the result." brandCue="More work. Less fuss.">
      <Card eyebrow="Last 30 days" title="You spent £48" tone="green">
        <MetricRow left="People who got in touch" right="7" />
        <MetricRow left="Genuine jobs" right="3" />
        <MetricRow left="Jobs won" right="1" />
        <MetricRow left="Won job value" right="£620" strong />
      </Card>
      <Card
        eyebrow="What worked best"
        title="Previous customers"
        body="They produced the cheapest bookings this month."
        footer="Use this learning next time"
      />
      <Button label="See details" primary onPress={() => s.go("resultDetails")} />
      <Button label="Update a result" onPress={() => s.go("updateOutcome")} />
    </Shell>
  );
}

function ResultDetails({ s }) {
  return (
    <Shell s={s} title="Result details" subtitle="The useful business facts first.">
      <Card eyebrow="Previous customers" title="£1.20 spent" body="4 replies • 2 interested • 1 booking" footer="Won value: £260" tone="green" />
      <Card eyebrow="Old enquiries" title="£0 spent" body="3 followed up • 1 reply • 0 bookings" footer="No paid spend" />
      <Card eyebrow="Local advert" title="£46.80 spent" body="3 genuine enquiries • 1 booking" footer="Won value: £360" tone="amber" />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function UpdateOutcome({ s }) {
  const opts = ["Not suitable", "Quoted", "Won", "Lost"];
  return (
    <Shell s={s} title="Update what happened" subtitle="One tap is enough when we can’t tell automatically.">
      {opts.map((x) => (
        <Choice key={x} label={x} selected={s.outcome === x} onPress={() => s.setOutcome(x)} />
      ))}
      {s.outcome === "Won" ? (
        <Field label="Job value (optional)" value={s.wonValue} onChangeText={s.setWonValue} keyboardType="number-pad" prefix="£" />
      ) : null}
      <Button label="Save result" primary onPress={() => s.jump("results", "Results")} />
    </Shell>
  );
}


function BusinessData({ s }) {
  return (
    <Shell
      s={s}
      title="Business data"
      subtitle="General business facts stay here. Previous-customer counts now come from individual customer records."
    >
      <Card
        eyebrow="v0.5 data model"
        title="Customer counts are calculated, not typed in"
        body={`You currently have ${s.customers.length} saved customer records and ${s.eligibleCustomers.length} are eligible under the 9-month rule.`}
        tone="green"
      />
      <Field label="Business name" value={s.businessName} onChangeText={s.setBusinessName} />
      <Field label="Trade or service" value={s.trade} onChangeText={s.setTrade} />
      <Field label="Postcode / base area" value={s.postcode} onChangeText={s.setPostcode} />
      <Field label="Service radius" value={s.radius} onChangeText={s.setRadius} keyboardType="number-pad" prefix="Miles" />
      <Field label="Next quiet slot" value={s.quietSlot} onChangeText={s.setQuietSlot} placeholder="e.g. Thursday afternoon" />
      <Button label="Manage customer records" onPress={() => s.go("customerRecords")} />

      <Text style={styles.sectionLabel}>Other opportunity numbers</Text>
      <Field label="Old enquiries worth following up" value={s.oldEnquiryCount} onChangeText={s.setOldEnquiryCount} keyboardType="number-pad" />
      <Field label="Old quotes worth revisiting" value={s.oldQuoteCount} onChangeText={s.setOldQuoteCount} keyboardType="number-pad" />
      <Field label="Highest old quote value" value={s.oldQuoteTopValue} onChangeText={s.setOldQuoteTopValue} keyboardType="number-pad" prefix="£" />
      <Field label="Unanswered reviews" value={s.unansweredReviewCount} onChangeText={s.setUnansweredReviewCount} keyboardType="number-pad" />
      <Field label="Recent photos you want to add" value={s.recentPhotoCountNeeded} onChangeText={s.setRecentPhotoCountNeeded} keyboardType="number-pad" />
      <Button label="Save & refresh Home" primary onPress={() => s.jump("home", "Home")} />
      <Button label="Cancel" onPress={s.back} />
    </Shell>
  );
}

function Settings({ s }) {
  const connectedCount = Object.values(s.connectedAccounts).filter(Boolean).length;
  return (
    <Shell s={s} noBack title="Your controls" subtitle="Set the rules once. Busy Does It works inside them.">
      <Card
        eyebrow="Spending"
        title={s.alwaysAsk ? "Always ask before spending" : `Automatic paid tests up to £${s.testLimit}`}
        body={
          s.alwaysAsk
            ? "Every paid test still needs your approval."
            : `Busy Does It may run a paid test up to £${s.testLimit} without asking again, but total paid spend must stay within £${s.weeklyLimit} per week.`
        }
        footer="You can change this any time"
        tone={s.alwaysAsk ? "green" : "amber"}
      >
        <MetricRow left="Single test limit" right={`£${s.testLimit}`} />
        <MetricRow left="Weekly limit" right={`£${s.weeklyLimit}`} />
        <MetricRow left="Previous customers" right={s.customerContact ? "Allowed" : "Off"} />
        <MetricRow left="Connected accounts" right={`${connectedCount}/${connectionRows.length}`} />
      </Card>
      <Button label="Customer records" primary onPress={() => s.go("customerRecords")} />
      <Button label="Business profile & opportunity data" onPress={() => s.go("businessData")} />
      <Button label="Change limits" onPress={() => s.go("settingsLimits")} />
      <Button label="Connected accounts" onPress={() => s.go("connectedAccounts")} />
      <Button label="How Busy Does It works" onPress={() => s.go("howBusyWorks")} />
      <Button label="What makes it different" onPress={() => s.go("whatMakesDifferent")} />
      <Button label="Advanced details" onPress={() => s.go("advanced")} />
      <Button label="Reset prototype data" danger onPress={s.resetPrototype} />
    </Shell>
  );
}

function HowBusyWorks({ s }) {
  return (
    <Shell s={s} title="How Busy Does It works" subtitle="Simple on the surface. Serious marketing logic underneath.">
      <Card eyebrow="1" title="Start with the business problem" body="Tell us you need work, have a quiet day, want old customers back or want to run an offer. You do not build a marketing campaign." />
      <Card eyebrow="2" title="Check the cheapest sensible moves first" body="We can check free profile improvements, previous customers, old enquiries, quotes, cross-sells and other low-cost opportunities before paid advertising." />
      <Card eyebrow="3" title="Explain the recommendation" body="The normal screen gives you the simple answer. Tap “Why this?” for the reasoning, or Expert details for the evidence and assumptions." />
      <Card eyebrow="4" title="You control what gets sent and spent" body="Important sends and paid actions require approval unless you deliberately choose a different rule." />
      <Card eyebrow="5" title="Measure work, not vanity" body="Results lead with genuine enquiries, bookings, jobs won and revenue. Technical metrics remain available for people who want them." />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function WhatMakesDifferent({ s }) {
  return (
    <Shell s={s} title="What makes Busy Does It different" subtitle="Concrete design choices — not hype.">
      <Card eyebrow="Goal first" title="You tell us the problem, not the channel" body="The app chooses or recommends the marketing method underneath instead of forcing you to decide between ads, email, social or audiences." />
      <Card eyebrow="Cost first" title="Free and low-cost opportunities come before paid reach" body="The app can recommend spending nothing when that is the more sensible first move." />
      <Card eyebrow="Control" title="The maximum at risk is obvious" body="Paid advertising is treated as a test. You see the cap before approval and the app stops at the agreed limit." />
      <Card eyebrow="Proof layer" title="Every important recommendation should be justifiable" body="Average users see a simple answer. Experts can inspect the data, assumptions, alternatives, confidence and technical performance behind it." />
      <Card eyebrow="Outcome" title="Jobs and pounds before marketing jargon" body="The default result is what happened to the business, not a dashboard full of clicks and acronyms." />
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function SettingsLimits({ s }) {
  return (
    <Shell s={s} title="Change limits" subtitle="These rules apply to future paid actions.">
      <ToggleRow
        title="Always ask before spending"
        body={s.alwaysAsk ? "Every paid test needs approval." : `Off: tests up to £${s.testLimit} may run automatically, within the weekly limit.`}
        value={s.alwaysAsk}
        onValueChange={s.setAlwaysAsk}
      />
      <ToggleRow title="Contact previous customers" body="Allow eligible previous customers to be suggested before paid advertising." value={s.customerContact} onValueChange={s.setCustomerContact} />
      <Field label="Maximum single test" value={s.testLimit} onChangeText={s.setTestLimit} keyboardType="number-pad" prefix="£" />
      <Field label="Weekly paid-spend limit" value={s.weeklyLimit} onChangeText={s.setWeeklyLimit} keyboardType="number-pad" prefix="£" />
      {!s.alwaysAsk ? <Text style={styles.warningText}>Automatic mode is explicit: no single test may exceed £{s.testLimit}, and total paid spend may not exceed £{s.weeklyLimit} per week.</Text> : null}
      <Button label="Save" primary onPress={s.back} />
    </Shell>
  );
}

function ConnectedAccounts({ s }) {
  return (
    <Shell s={s} title="Connected accounts" subtitle="Prototype toggles only — no real external account is connected in v0.3.">
      {connectionRows.map(([key, label, body]) => {
        const connected = !!s.connectedAccounts[key];
        return (
          <View key={key} style={styles.connectRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.connectTitle}>{label}</Text>
              <Text style={styles.connectBody}>{body}</Text>
            </View>
            <Pressable onPress={() => s.toggleConnection(key)} style={[styles.connectButton, connected && styles.connectButtonOn]}>
              <Text style={[styles.connectButtonText, connected && { color: C.green }]}>{connected ? "Disconnect" : "Connect"}</Text>
            </Pressable>
          </View>
        );
      })}
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

function Advanced({ s }) {
  return (
    <Shell s={s} title="Advanced details" subtitle="Optional. You never need this to use the normal app.">
      <ToggleRow
        title="Show advanced marketing details"
        body="Reveal channel, targeting and technical performance metrics."
        value={s.advanced}
        onValueChange={s.setAdvanced}
      />
      {s.advanced ? (
        <>
          <Card eyebrow="Advanced example" title="Local paid test">
            <MetricRow left="Channel" right="Meta" />
            <MetricRow left="CTR" right="2.8%" />
            <MetricRow left="CPC" right="£1.72" />
            <MetricRow left="Recommendation confidence" right="Medium" />
          </Card>
          <Card
            eyebrow="Proof layer"
            title="Recommendations can be inspected"
            body="Expert screens can show the source data, selection criteria, alternatives considered, assumptions, confidence and performance history behind a recommendation."
            footer="Easy enough for anybody. Deep enough for an expert."
            tone="green"
          />
        </>
      ) : (
        <Card
          eyebrow="Hidden by default"
          title="No marketing lesson required"
          body="The normal app stays focused on jobs, money, spare time and simple decisions."
        />
      )}
      <Button label="Done" primary onPress={s.back} />
    </Shell>
  );
}

const screens = {
  welcome: WelcomeScreen,
  setupBusiness: SetupBusiness,
  setupServices: SetupServices,
  addService: AddService,
  setupLimits: SetupLimits,
  setupConnect: SetupConnect,
  home: HomeScreen,
  workNow: WorkNow,
  chooseGap: ChooseGap,
  bestMove: BestMove,
  customerRecords: CustomerRecords,
  addCustomerRecord: AddCustomerRecord,
  eligibleCustomers: EligibleCustomers,
  profileAudit: ProfileAudit,
  profileAuditPlan: ProfileAuditPlan,
  otherOptions: OtherOptions,
  checkSend: CheckSend,
  progress: Progress,
  replies: Replies,
  paidTest: PaidTest,
  howAdsWork: HowAdsWork,
  paidRunning: PaidRunning,
  moreWorkGoal: MoreWorkGoal,
  workPlan: WorkPlan,
  customerGroups: CustomerGroups,
  bringBack: BringBack,
  offerGoal: OfferGoal,
  offerBuild: OfferBuild,
  offerPlan: OfferPlan,
  offerRunning: OfferRunning,
  results: Results,
  resultDetails: ResultDetails,
  updateOutcome: UpdateOutcome,
  settings: Settings,
  businessData: BusinessData,
  howBusyWorks: HowBusyWorks,
  whatMakesDifferent: WhatMakesDifferent,
  settingsLimits: SettingsLimits,
  connectedAccounts: ConnectedAccounts,
  advanced: Advanced,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  shell: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  brand: { fontSize: 19, fontWeight: "900", color: C.blue, letterSpacing: 0.4 },
  tagline: { fontSize: 12, color: C.muted, marginTop: 2, fontWeight: "600" },
  backPill: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: C.card,
  },
  backText: { color: C.ink, fontWeight: "700" },
  brandCue: { color: C.green, fontWeight: "800", fontSize: 15, marginBottom: 8 },
  h1: { fontSize: 32, lineHeight: 36, fontWeight: "900", color: C.ink, letterSpacing: -0.7 },
  subtitle: { fontSize: 16, lineHeight: 22, color: C.muted, marginTop: 7, marginBottom: 18 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    backgroundColor: C.card,
  },
  cardBlue: { borderColor: "#CEDBF5", backgroundColor: C.blueSoft },
  cardGreen: { borderColor: "#CDE7D9", backgroundColor: C.greenSoft },
  cardAmber: { borderColor: "#F0D8B9", backgroundColor: C.amberSoft },
  eyebrow: { fontSize: 12, fontWeight: "900", color: C.blue, letterSpacing: 0.8, marginBottom: 7 },
  cardTitle: { fontSize: 21, lineHeight: 26, fontWeight: "900", color: C.ink, marginBottom: 7 },
  cardBody: { fontSize: 15, lineHeight: 21, color: C.muted },
  cardFooter: { fontSize: 16, fontWeight: "900", color: C.green, marginTop: 12 },
  tick: { fontSize: 15, lineHeight: 25, color: C.ink, fontWeight: "700" },
  button: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  buttonPrimary: { backgroundColor: C.blue, borderColor: C.blue },
  buttonDanger: { backgroundColor: C.red, borderColor: C.red },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { fontSize: 17, fontWeight: "800", color: C.ink },
  buttonTextPrimary: { color: "#FFFFFF" },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  smallLinkWrap: { alignItems: "center", padding: 12 },
  smallLink: { color: C.blue, fontSize: 15, fontWeight: "700" },
  fieldWrap: { marginBottom: 15 },
  fieldLabel: { color: C.ink, fontWeight: "800", fontSize: 14, marginBottom: 7 },
  fieldBox: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingHorizontal: 14,
  },
  fieldPrefix: { marginRight: 9, fontWeight: "800", color: C.muted },
  fieldInput: { flex: 1, fontSize: 16, color: C.ink, paddingVertical: 12 },
  dateFieldBox: { justifyContent: "space-between" },
  dateFieldText: { flex: 1, fontSize: 16, color: C.ink, fontWeight: "700" },
  dateFieldHint: { color: C.blue, fontSize: 13, fontWeight: "800", marginLeft: 12 },
  datePickerPanel: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, padding: 10, marginTop: 8, marginBottom: 14 },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },
  choiceSelected: { borderColor: C.blue, backgroundColor: C.blueSoft },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#AAB2BF",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  radioSelected: { borderColor: C.blue },
  radioCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.blue },
  choiceText: { fontSize: 16, color: C.ink, fontWeight: "800" },
  choiceTextSelected: { color: C.blue },
  choiceSub: { marginTop: 3, color: C.muted, lineHeight: 18 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    borderRadius: 16,
    marginBottom: 12,
  },
  toggleTitle: { fontWeight: "800", color: C.ink, fontSize: 16 },
  toggleBody: { color: C.muted, lineHeight: 19, marginTop: 4 },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#C9D7E7",
    paddingTop: 10,
    marginTop: 10,
    gap: 14,
  },
  metricLeft: { flex: 1, color: C.muted, fontSize: 14 },
  metricRight: { color: C.ink, fontSize: 15, fontWeight: "800" },
  metricStrong: { fontSize: 17, fontWeight: "900", color: C.green },
  helper: { color: C.muted, fontSize: 13, marginTop: -2, marginBottom: 14 },
  helperCenter: { color: C.muted, fontSize: 12, textAlign: "center", marginTop: 7 },
  serviceCard: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10,
  },
  serviceCardWanted: { borderColor: "#B7D0FF", backgroundColor: C.blueSoft },
  serviceName: { fontSize: 16, fontWeight: "800", color: C.ink },
  serviceValue: { fontSize: 14, color: C.muted, marginTop: 4 },
  star: { fontSize: 28, color: "#AAB2BF" },
  starOn: { color: "#E0A419" },
  connectRow: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card, borderRadius: 16, padding: 15, marginBottom: 10, gap: 12,
  },
  connectTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
  connectBody: { fontSize: 13, color: C.muted, marginTop: 3, lineHeight: 18 },
  connectButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.blueSoft },
  connectButtonText: { fontSize: 13, fontWeight: "800", color: C.blue },
  optionCard: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16,
    padding: 16, marginBottom: 10,
  },
  optionTitle: { fontSize: 17, fontWeight: "900", color: C.ink },
  optionBody: { color: C.muted, lineHeight: 20, marginTop: 5 },
  optionCost: { color: C.green, fontWeight: "900", marginTop: 9 },
  messageInput: {
    marginTop: 8, minHeight: 120, textAlignVertical: "top", color: C.ink, fontSize: 15,
    lineHeight: 21, backgroundColor: "#FFFFFFAA", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#D5DFEC",
  },
  replyCard: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16,
    padding: 15, marginBottom: 10,
  },
  replyName: { fontWeight: "900", color: C.ink, fontSize: 16 },
  replyStatus: { color: C.green, fontWeight: "800", fontSize: 13 },
  replyBody: { color: C.muted, lineHeight: 20, marginTop: 7 },
  groupCard: {
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16,
    padding: 16, marginBottom: 10,
  },
  groupCardSelected: { borderColor: C.blue, backgroundColor: C.blueSoft },
  groupTitle: { fontWeight: "900", color: C.ink, fontSize: 16, lineHeight: 21 },
  groupBody: { color: C.muted, marginTop: 6, lineHeight: 19 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { marginTop: 10, color: C.muted, fontSize: 15 },
  prototypeBadge: { marginTop: 5, alignSelf: "flex-start", fontSize: 10, fontWeight: "800", color: C.muted, backgroundColor: "#E8ECF3", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  dashboardHeader: { marginBottom: 14 },
  dashboardHint: { color: C.muted, fontSize: 13, marginTop: 8 },
  chip: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  chipBlue: { backgroundColor: C.blueSoft },
  chipGreen: { backgroundColor: C.greenSoft },
  chipAmber: { backgroundColor: C.amberSoft },
  chipText: { color: C.ink, fontSize: 11, fontWeight: "900" },
  opportunityCard: { borderWidth: 1, borderRadius: 18, padding: 17, marginBottom: 14, backgroundColor: C.card },
  opportunityBlue: { borderColor: "#CEDBF5" },
  opportunityGreen: { borderColor: "#CDE7D9" },
  opportunityAmber: { borderColor: "#F0D8B9" },
  opportunityTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  opportunityTitle: { fontSize: 20, lineHeight: 25, fontWeight: "900", color: C.ink, marginTop: 4 },
  opportunityBody: { color: C.muted, fontSize: 15, lineHeight: 21, marginTop: 7 },
  opportunityFooter: { color: C.green, fontSize: 14, fontWeight: "900", marginTop: 10 },
  explainWrap: { marginTop: 8 },
  inlineLinkWrap: { alignSelf: "center", paddingVertical: 9, paddingHorizontal: 6 },
  inlineLinkWrapLeft: { alignSelf: "flex-start", paddingVertical: 9, paddingHorizontal: 0 },
  inlineLink: { color: C.blue, fontSize: 14, fontWeight: "800" },
  inlinePanel: { backgroundColor: "#FFFFFFAA", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border },
  inlineWhy: { color: C.ink, fontSize: 14, lineHeight: 20 },
  evidenceBox: { marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 9, marginTop: 12 },
  miniPrimary: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: C.blue, paddingHorizontal: 12 },
  miniPrimaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  miniSecondary: { minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, paddingHorizontal: 15, backgroundColor: C.card },
  miniSecondaryText: { color: C.muted, fontWeight: "800", fontSize: 14 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "#DFE5EE", overflow: "hidden", marginTop: 10, marginBottom: 16 },
  progressFill: { height: "100%", backgroundColor: C.green, borderRadius: 999 },
  warningText: { color: C.amber, fontSize: 13, lineHeight: 19, fontWeight: "700", marginTop: -2, marginBottom: 14 },
  sectionLabel: { color: C.ink, fontSize: 18, fontWeight: "900", marginTop: 8, marginBottom: 14 },
  customerRecord: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 16, padding: 15, marginBottom: 10 },
  customerRecordTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  customerName: { color: C.ink, fontSize: 17, fontWeight: "900" },
  customerService: { color: C.ink, fontSize: 14, fontWeight: "800", marginTop: 8 },
  customerMeta: { color: C.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  removeCustomerWrap: { alignSelf: "flex-start", paddingTop: 10, paddingBottom: 2 },
  removeCustomerText: { color: C.red, fontSize: 13, fontWeight: "800" },
  connectButtonOn: { backgroundColor: C.greenSoft },
  nav: {
    height: 72,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 5,
  },
  navItem: { alignItems: "center", justifyContent: "center", minWidth: 68 },
  navDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "transparent", marginBottom: 5 },
  navDotActive: { backgroundColor: C.blue },
  navText: { color: C.muted, fontSize: 12, fontWeight: "700" },
  navTextActive: { color: C.blue, fontWeight: "900" },
});

export default App;