
import React, { useMemo, useState } from "react";
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

function App() {
  const [screen, setScreen] = useState("welcome");
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("Home");
  const [businessName, setBusinessName] = useState("Dave's Exterior Cleaning");
  const [trade, setTrade] = useState("Exterior cleaning");
  const [postcode, setPostcode] = useState("EX17");
  const [radius, setRadius] = useState("15");
  const [services, setServices] = useState(servicesSeed);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceValue, setNewServiceValue] = useState("");
  const [alwaysAsk, setAlwaysAsk] = useState(true);
  const [customerContact, setCustomerContact] = useState(true);
  const [testLimit, setTestLimit] = useState("25");
  const [weeklyLimit, setWeeklyLimit] = useState("100");
  const [selectedGap, setSelectedGap] = useState("Thursday afternoon");
  const [selectedCustomerGroup, setSelectedCustomerGroup] = useState(previousCustomerGroups[0]);
  const [adBudget, setAdBudget] = useState("20");
  const [message, setMessage] = useState(
    "Hi, we’ve got a slot free this Thursday for driveway or patio cleaning. If you’d like a quote or want to book it, just reply here."
  );
  const [offerGoal, setOfferGoal] = useState("Fill a quiet day");
  const [offerService, setOfferService] = useState("Driveway cleaning");
  const [normalPrice, setNormalPrice] = useState("250");
  const [offerPrice, setOfferPrice] = useState("225");
  const [offerDates, setOfferDates] = useState("Tuesday & Wednesday");
  const [offerMax, setOfferMax] = useState("4");
  const [advanced, setAdvanced] = useState(false);
  const [outcome, setOutcome] = useState("Won");
  const [wonValue, setWonValue] = useState("620");

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

  const appState = useMemo(
    () => ({
      screen,
      history,
      go,
      back,
      jump,
      tab,
      setTab,
      businessName,
      setBusinessName,
      trade,
      setTrade,
      postcode,
      setPostcode,
      radius,
      setRadius,
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
      selectedGap,
      setSelectedGap,
      selectedCustomerGroup,
      setSelectedCustomerGroup,
      adBudget,
      setAdBudget,
      message,
      setMessage,
      offerGoal,
      setOfferGoal,
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
      advanced,
      setAdvanced,
      outcome,
      setOutcome,
      wonValue,
      setWonValue,
    }),
    [
      screen, history, tab, businessName, trade, postcode, radius, services, newServiceName, newServiceValue,
      alwaysAsk, customerContact, testLimit, weeklyLimit, selectedGap,
      selectedCustomerGroup, adBudget, message, offerGoal, offerService,
      normalPrice, offerPrice, offerDates, offerMax, advanced, outcome, wonValue
    ]
  );

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
          <View>
            <Text style={styles.brand}>BUSY DOES IT</Text>
            <Text style={styles.tagline}>More work. Less fuss.</Text>
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

function WelcomeScreen({ s }) {
  return (
    <Shell s={s} noNav noBack title="Need more work?" subtitle="Busy Does It. We’ll find the simplest way to try to get it — and you stay in control.">
      <Card eyebrow="What to expect" title="More work. Less fuss." tone="green">
        <Text style={styles.tick}>• Cheaper options first</Text>
        <Text style={styles.tick}>• No guaranteed-result claims</Text>
        <Text style={styles.tick}>• Nothing paid runs without your say-so</Text>
      </Card>
      <Button label="Get started" primary onPress={() => s.go("setupBusiness")} />
      <Text style={styles.helperCenter}>Prototype v0.2 — no real messages, profile changes or adverts are sent.</Text>
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
    <Shell s={s} noNav title="What work do you want?" subtitle="We’ll suggest the obvious services for your trade. Add anything we’ve missed.">
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
      <Button label="Continue" primary onPress={() => s.go("setupLimits")} />
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
  const rows = [
    ["Calendar", "Helps spot quiet days automatically"],
    ["Google Business", "Helps understand local presence and reviews"],
    ["Facebook / Instagram", "Lets approved posts and adverts run"],
    ["Google Ads", "Lets approved local advert tests run"],
    ["CRM / job system", "Helps follow enquiries through to jobs"],
    ["Invoicing", "Helps measure paid work instead of clicks"],
  ];
  return (
    <Shell s={s} noNav title="Connect what you already use" subtitle="Connect what’s easy now. Skip the rest.">
      {rows.map(([a, b], i) => (
        <View key={a} style={styles.connectRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.connectTitle}>{a}</Text>
            <Text style={styles.connectBody}>{b}</Text>
          </View>
          <Pressable style={styles.connectButton}>
            <Text style={styles.connectButtonText}>{i < 2 ? "Connected" : "Connect"}</Text>
          </Pressable>
        </View>
      ))}
      <Button
        label="Open Busy Does It"
        primary
        onPress={() => {
          s.setTab("Home");
          s.jump("home", "Home");
        }}
      />
      <SmallLink label="Do this later" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function HomeScreen({ s }) {
  return (
    <Shell s={s} noBack title="What do you need today?" subtitle="Choose the result you want. We’ll work out the marketing underneath." brandCue="Quiet Thursday? Busy Does It.">
      <Card
        eyebrow="Something worth trying"
        title="Thursday afternoon is free"
        body="We found 14 previous customers worth trying first."
        footer="Advertising spend: £0"
      />
      <Button label="Fill a spare day" primary onPress={() => s.go("chooseGap")} />
      <Button label="Get more work" onPress={() => s.go("moreWorkGoal")} />
      <Button label="Bring customers back" onPress={() => s.go("customerGroups")} />
      <Button label="Create an offer" onPress={() => s.go("offerGoal")} />
      <Button label="Check free improvements" onPress={() => s.go("profileAudit")} />
    </Shell>
  );
}

function WorkNow({ s }) {
  return (
    <Shell s={s} noBack title="Work" subtitle="Choose what you want help with right now.">
      <Card
        eyebrow="Current opportunity"
        title="Thursday afternoon is free"
        body="The cheapest first move is to contact previous customers."
        footer="Start cost: message cost only"
      />
      <Button label="Fill Thursday" primary onPress={() => s.go("chooseGap")} />
      <Button label="Find more work" onPress={() => s.go("moreWorkGoal")} />
      <Button label="Bring customers back" onPress={() => s.go("customerGroups")} />
      <Button label="Create a special offer" onPress={() => s.go("offerGoal")} />
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
  return (
    <Shell s={s} title="Best first move" subtitle="We checked the cheaper options before suggesting advertising.">
      <Card
        eyebrow="Recommended"
        title="Contact 12 previous customers"
        body="They already know your business and may be due another job. Try them before paying for ads."
        footer="Advertising spend: £0"
      />
      <Button label="Try this" primary onPress={() => s.go("checkSend")} />
      <SmallLink label="Why this?" onPress={() => s.go("whyBestMove")} />
      <Button label="See other options" onPress={() => s.go("otherOptions")} />
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
        <MetricRow left="Eligible previous customers" right="12" />
        <MetricRow left="Time since last booking" right="10+ months" />
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
  return (
    <Shell s={s} title="We found 3 easy improvements" subtitle="Before spending money, Busy Does It checks whether there are useful free fixes first.">
      <Card
        eyebrow="Google Business"
        title="Add patio cleaning as a service"
        body="Your profile talks about driveway cleaning but does not clearly list patio cleaning."
        footer="Cost: £0"
      />
      <Card
        eyebrow="Photos"
        title="Add 2 recent before-and-after photos"
        body="Recent proof can make the profile more useful to customers who are already looking."
        footer="Cost: £0"
      />
      <Card
        eyebrow="Reviews"
        title="Reply to 4 unanswered reviews"
        body="A short, genuine reply shows that the business is active and paying attention."
        footer="Cost: £0"
      />
      <Button label="Fix these first" primary onPress={() => s.go("profileAuditPlan")} />
      <SmallLink label="Why are you recommending these?" onPress={() => s.go("profileAuditWhy")} />
      <Button label="Not now" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function ProfileAuditPlan({ s }) {
  return (
    <Shell s={s} title="Free improvements first" subtitle="Nothing changes publicly without your approval.">
      <Card
        eyebrow="Step 1"
        title="Add patio cleaning"
        body="We would prepare the suggested service wording and show it to you before anything is changed."
        footer="You approve the change"
      />
      <Card
        eyebrow="Step 2"
        title="Choose 2 recent photos"
        body="The app can suggest suitable recent images, but you decide what gets published."
        footer="You approve the photos"
      />
      <Card
        eyebrow="Step 3"
        title="Prepare 4 review replies"
        body="Busy Does It can draft short replies in your normal tone. You can approve, edit or skip each one."
        footer="No automatic posting by default"
      />
      <Button label="Prepare step 1" primary onPress={() => s.jump("home", "Home")} />
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
    ["Follow up 4 old enquiries", "£0 ad spend", "People who asked before but never booked."],
    ["Revisit 3 old quotes", "£0 ad spend", "Quotes that are still worth trying."],
    ["Offer a gutter add-on", "£0 ad spend", "Useful cross-sell to nearby previous customers."],
    ["Try a small local advert", "Up to £20", "Only if the cheaper options don’t fill the gap."],
  ];
  return (
    <Shell s={s} title="Other options" subtitle="Still simple — just choose the next sensible move.">
      {options.map(([a, b, c], idx) => (
        <Pressable
          key={a}
          style={styles.optionCard}
          onPress={() => (idx === 3 ? s.go("paidTest") : s.go("checkSend"))}
        >
          <Text style={styles.optionTitle}>{a}</Text>
          <Text style={styles.optionBody}>{c}</Text>
          <Text style={styles.optionCost}>{b}</Text>
        </Pressable>
      ))}
    </Shell>
  );
}

function CheckSend({ s }) {
  return (
    <Shell s={s} title="Check before sending" subtitle="You stay in control of exactly what goes out.">
      <Card eyebrow="12 previous customers" title="Message preview" footer="Message cost: about £1.20">
        <TextInput
          multiline
          value={s.message}
          onChangeText={s.setMessage}
          style={styles.messageInput}
        />
      </Card>
      <Button label="Approve & send" primary onPress={() => s.go("progress")} />
      <Button label="Edit message" onPress={() => {}} />
      <Button label="Skip" onPress={() => s.go("otherOptions")} />
    </Shell>
  );
}

function Progress({ s }) {
  return (
    <Shell s={s} title={`${s.selectedGap.split(" ")[0]} progress`} subtitle="Here’s what has happened so far." brandCue="Need another job? Busy Does It.">
      <Card
        eyebrow="Live result"
        title="1 job booked"
        body="12 contacted • 4 replied • 2 interested. The spare time is partly filled."
        footer="Booked job value: about £260"
        tone="green"
      />
      <Button label="Do next step" primary onPress={() => s.go("paidTest")} />
      <Button label="View replies" onPress={() => s.go("replies")} />
      <Button label="Stop" onPress={() => s.jump("home", "Home")} />
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
  return (
    <Shell s={s} title="Still want to fill the gap?" subtitle="The free options haven’t filled the remaining time.">
      <Card
        eyebrow="Small paid test"
        title="Try a local advert"
        body={`Maximum spend: £${s.adBudget}. This is a test — work is not guaranteed. We stop at £${s.adBudget} unless you approve more.`}
        footer={`Maximum at risk: £${s.adBudget}`}
        tone="amber"
      />
      <Field label="Maximum spend" value={s.adBudget} onChangeText={s.setAdBudget} keyboardType="number-pad" prefix="£" />
      <Button label={`Approve £${s.adBudget}`} primary onPress={() => s.go("paidRunning")} />
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
  const options = [
    "More work next week",
    "More work this month",
    "Promote a specific service",
    "Just find me the best opportunity",
  ];
  return (
    <Shell s={s} title="What do you want?" subtitle="Tell us the business goal — not the marketing method.">
      {options.map((x, i) => (
        <Button key={x} label={x} primary={i === 0} onPress={() => s.go("workPlan")} />
      ))}
    </Shell>
  );
}

function WorkPlan({ s }) {
  return (
    <Shell s={s} title="Your plan" subtitle="We’ll run one approved step at a time.">
      <Card
        eyebrow="Step 1"
        title="Follow up 5 old enquiries"
        body="They already asked about work before."
        footer="Advertising spend: £0"
      />
      <Card
        eyebrow="Step 2"
        title="Contact 18 past customers"
        body="Only if more work is still needed."
        footer="Message cost only"
      />
      <Card
        eyebrow="Step 3"
        title="Try a small local advert"
        body="Only if the cheaper options still haven’t done the job."
        footer="Maximum paid test: £25"
        tone="amber"
      />
      <Button label="Start step 1" primary onPress={() => s.go("checkSend")} />
      <Button label="Change plan" onPress={() => s.go("otherOptions")} />
    </Shell>
  );
}

function CustomerGroups({ s }) {
  return (
    <Shell s={s} title="Customers worth trying" subtitle="We’ve grouped people by simple reasons.">
      {previousCustomerGroups.map((g) => (
        <Pressable
          key={g.id}
          onPress={() => s.setSelectedCustomerGroup(g)}
          style={[styles.groupCard, s.selectedCustomerGroup.id === g.id && styles.groupCardSelected]}
        >
          <Text style={styles.groupTitle}>{g.title}</Text>
          <Text style={styles.groupBody}>{g.reason}</Text>
        </Pressable>
      ))}
      <Button label="Use this group" primary onPress={() => s.go("bringBack")} />
    </Shell>
  );
}

function BringBack({ s }) {
  return (
    <Shell s={s} title="Bring them back" subtitle="Approve the actual message — not an abstract campaign.">
      <Card
        eyebrow={s.selectedCustomerGroup.title}
        title="Message preview"
        body="Hi, it’s been a while since we last helped. We’ve got a couple of spaces next week if you need any exterior cleaning. Reply here if you’d like us to take a look."
        footer="No predicted revenue — just a clear goal"
      />
      <Button label="Approve & send" primary onPress={() => s.go("progress")} />
      <Button label="Edit" onPress={() => {}} />
      <Button label="Skip" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

function OfferGoal({ s }) {
  const goals = ["Fill a quiet day", "Get more bookings", "Promote a service", "Bring customers back", "Seasonal offer"];
  return (
    <Shell s={s} title="What is the offer for?" subtitle="Start with the business reason — not the marketing channel." brandCue="Want to run an offer? Busy Does It.">
      {goals.map((g) => (
        <Choice key={g} label={g} selected={s.offerGoal === g} onPress={() => s.setOfferGoal(g)} />
      ))}
      <Button label="Build the offer" primary onPress={() => s.go("offerBuild")} />
    </Shell>
  );
}

function OfferBuild({ s }) {
  return (
    <Shell s={s} title="Build the offer" subtitle="Tell us the deal. We’ll help make it sensible.">
      <Field label="Service" value={s.offerService} onChangeText={s.setOfferService} />
      <Field label="Normal price" value={s.normalPrice} onChangeText={s.setNormalPrice} keyboardType="number-pad" prefix="£" />
      <Field label="Offer price" value={s.offerPrice} onChangeText={s.setOfferPrice} keyboardType="number-pad" prefix="£" />
      <Field label="Dates" value={s.offerDates} onChangeText={s.setOfferDates} />
      <Field label="Maximum bookings" value={s.offerMax} onChangeText={s.setOfferMax} keyboardType="number-pad" />
      <Card
        eyebrow="Margin check"
        title="You may not need a big discount"
        body="If you want, we can suggest a free add-on or weekday-only offer instead."
        tone="green"
      />
      <Button label="Improve it for me" primary onPress={() => s.go("offerPlan")} />
      <Button label="Use my offer" onPress={() => s.go("offerPlan")} />
    </Shell>
  );
}

function OfferPlan({ s }) {
  return (
    <Shell s={s} title="This is what we recommend" subtitle="Use it as-is or change anything.">
      <Card
        eyebrow="Special offer"
        title={`${s.offerService} — £${s.offerPrice}`}
        body={`Normal price about £${s.normalPrice}. ${s.offerDates} only. Maximum ${s.offerMax} bookings. Start with 24 previous customers. Use paid ads only if spaces remain.`}
        footer="Start cost: message cost only"
      />
      <Button label="Use this plan" primary onPress={() => s.go("offerRunning")} />
      <SmallLink label="Why this plan?" onPress={() => s.go("whyOfferPlan")} />
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
    <Shell s={s} title="Offer running" subtitle="We stop automatically when the booking cap is reached.">
      <Card
        eyebrow="Live offer"
        title={`2 of ${s.offerMax} spaces booked`}
        body="24 past customers contacted. 5 replied. 2 booked. No paid advertising has been needed yet."
        footer="Won work so far: about £450"
        tone="green"
      />
      <Button label="View bookings" primary onPress={() => s.jump("results", "Results")} />
      <Button label="Pause" onPress={() => {}} />
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

function Settings({ s }) {
  return (
    <Shell s={s} noBack title="Your controls" subtitle="Set the rules once. Busy Does It works inside them.">
      <Card eyebrow="Spending" title={s.alwaysAsk ? "Always ask before spending" : "Automatic spending rules enabled"} footer="You stay in control">
        <MetricRow left="Single test limit" right={`£${s.testLimit}`} />
        <MetricRow left="Weekly limit" right={`£${s.weeklyLimit}`} />
        <MetricRow left="Previous customers" right={s.customerContact ? "Allowed" : "Off"} />
        <MetricRow left="Advanced details" right={s.advanced ? "Visible" : "Hidden"} />
      </Card>
      <Button label="Change limits" primary onPress={() => s.go("settingsLimits")} />
      <Button label="Connected accounts" onPress={() => s.go("connectedAccounts")} />
      <Button label="How Busy Does It works" onPress={() => s.go("howBusyWorks")} />
      <Button label="What makes it different" onPress={() => s.go("whatMakesDifferent")} />
      <Button label="Advanced details" onPress={() => s.go("advanced")} />
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
    <Shell s={s} title="Change limits" subtitle="These rules apply to future actions.">
      <ToggleRow title="Always ask before spending" value={s.alwaysAsk} onValueChange={s.setAlwaysAsk} />
      <ToggleRow title="Contact previous customers" value={s.customerContact} onValueChange={s.setCustomerContact} />
      <Field label="Maximum single test" value={s.testLimit} onChangeText={s.setTestLimit} keyboardType="number-pad" prefix="£" />
      <Field label="Weekly limit" value={s.weeklyLimit} onChangeText={s.setWeeklyLimit} keyboardType="number-pad" prefix="£" />
      <Button label="Save" primary onPress={s.back} />
    </Shell>
  );
}

function ConnectedAccounts({ s }) {
  return (
    <Shell s={s} title="Connected accounts" subtitle="These are simulated in v0.2.">
      {[
        ["Calendar", "Connected"],
        ["Google Business", "Connected"],
        ["Facebook / Instagram", "Not connected"],
        ["Google Ads", "Not connected"],
        ["CRM / job system", "Not connected"],
        ["Invoicing", "Not connected"],
      ].map(([a, b]) => (
        <View key={a} style={styles.connectRow}>
          <Text style={styles.connectTitle}>{a}</Text>
          <Text style={[styles.connectButtonText, b === "Connected" && { color: C.green }]}>{b}</Text>
        </View>
      ))}
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
  whyBestMove: WhyBestMove,
  expertBestMove: ExpertBestMove,
  profileAudit: ProfileAudit,
  profileAuditPlan: ProfileAuditPlan,
  profileAuditWhy: ProfileAuditWhy,
  expertProfileAudit: ExpertProfileAudit,
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
  whyOfferPlan: WhyOfferPlan,
  expertOfferPlan: ExpertOfferPlan,
  offerRunning: OfferRunning,
  results: Results,
  resultDetails: ResultDetails,
  updateOutcome: UpdateOutcome,
  settings: Settings,
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
