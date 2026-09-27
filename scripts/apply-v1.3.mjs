import fs from "node:fs";

const appPath = "BusyDoesItApp.js";
const pkgPath = "package.json";
const readmePath = "README.md";

let src = fs.readFileSync(appPath, "utf8");

function replaceOnce(needle, replacement, label) {
  const first = src.indexOf(needle);
  if (first < 0) throw new Error(`Missing patch target: ${label}`);
  const second = src.indexOf(needle, first + needle.length);
  if (second >= 0) throw new Error(`Patch target not unique: ${label}`);
  src = src.slice(0, first) + replacement + src.slice(first + needle.length);
}

function replaceRegexOnce(regex, replacement, label) {
  const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
  const matches = src.match(new RegExp(regex.source, flags)) || [];
  if (matches.length !== 1) throw new Error(`Regex target ${label} matched ${matches.length} times`);
  src = src.replace(regex, replacement);
}

replaceOnce(
`  StatusBar,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";`,
`  StatusBar,
  Switch,
  Image,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";`,
"imports"
);

replaceOnce(
`  const [actionJobValue, setActionJobValue] = useState("");
  const [actionJobNote, setActionJobNote] = useState("");
  const [actionReminderDate, setActionReminderDate] = useState(addDaysISO(30));`,
`  const [actionJobValue, setActionJobValue] = useState("");
  const [actionJobNote, setActionJobNote] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [pendingJobPhotos, setPendingJobPhotos] = useState([]);
  const [jobPhotosMarketingOk, setJobPhotosMarketingOk] = useState(false);
  const [jobPostDraft, setJobPostDraft] = useState("");
  const [actionReminderDate, setActionReminderDate] = useState(addDaysISO(30));`,
"job photo state"
);

replaceRegexOnce(
/  const markBookingCompleted = \(customerId, jobValue, completionNote = ""\) => \{[\s\S]*?\n  \};\n\n  const markReminderDone =/,
`  const markBookingCompleted = (customerId, jobValue, completionNote = "") => {
    const action = replyActions[customerId];
    if (!action?.details?.bookingDate) return null;
    const amount = Number(jobValue) || Number(action.details?.sourceQuoteAmount) || 0;
    const cleanNote = String(completionNote || "").trim();
    const jobId = \`job-${customerId}-${action.details.bookingDate}\`;
    setReplyActions((current) => ({
      ...current,
      [customerId]: {
        ...current[customerId],
        done: true,
        details: {
          ...(current[customerId]?.details || {}),
          bookingStatus: "Completed",
          jobValue: amount || "",
          completionNote: cleanNote,
          jobCompletedAt: new Date().toISOString(),
          summary: \`Job completed${amount ? \` for £${amount}\` : ""} on ${formatUKDate(action.details.bookingDate)}\`,
        },
        completedAt: new Date().toISOString(),
      },
    }));
    setCustomers((current) =>
      current.map((customer) => {
        if (customer.id !== customerId) return customer;
        const history = Array.isArray(customer.history) ? customer.history : [];
        const duplicate = history.some(
          (item) => item.kind === "job" && item.date === action.details.bookingDate && item.service === customer.service
        );
        const nextHistory = duplicate
          ? history
          : [
              ...history,
              {
                id: jobId,
                kind: "job",
                date: action.details.bookingDate,
                service: customer.service,
                value: amount || "",
                note: cleanNote || "Completed through Busy Does It prototype",
                photos: [],
              },
            ];
        const activity = Array.isArray(customer.activity) ? customer.activity : [];
        return {
          ...customer,
          lastServiceDate: action.details.bookingDate,
          lastJobValue: amount || customer.lastJobValue,
          history: nextHistory,
          activity: [
            ...activity,
            {
              id: \`completed-${customerId}-${action.details.bookingDate}\`,
              kind: "job",
              date: action.details.bookingDate,
              createdAt: new Date().toISOString(),
              title: "Job completed",
              note: cleanNote || \`${customer.service} completed through Busy Does It.\`,
              value: amount || "",
            },
          ],
        };
      })
    );
    return jobId;
  };

  const startJobPhotoPrompt = (customerId, jobId) => {
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setPendingJobPhotos([]);
    setJobPhotosMarketingOk(false);
    setJobPostDraft("");
    go("jobCompletePhotos");
  };

  const openJobAssets = (customerId, jobId) => {
    const customer = customers.find((item) => item.id === customerId);
    const job = (customer?.history || []).find((item) => item.id === jobId);
    const photos = Array.isArray(job?.photos) ? job.photos : [];
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setPendingJobPhotos(photos.map((photo) => ({ ...photo })));
    setJobPhotosMarketingOk(photos.length > 0 && photos.every((photo) => !!photo.marketingOk));
    setJobPostDraft(job?.postDraft || "");
    go("jobPhotos");
  };

  const openJobPhotoOpportunity = (customerId, jobId) => {
    const customer = customers.find((item) => item.id === customerId);
    const job = (customer?.history || []).find((item) => item.id === jobId);
    const photos = Array.isArray(job?.photos) ? job.photos : [];
    setSelectedCustomerId(customerId);
    setSelectedJobId(jobId);
    setPendingJobPhotos(photos.map((photo) => ({ ...photo })));
    setJobPhotosMarketingOk(photos.some((photo) => !!photo.marketingOk));
    setJobPostDraft(job?.postDraft || "");
    go("jobPhotoOpportunity");
  };

  const chooseJobPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });
      if (result.canceled) return;
      const picked = (result.assets || []).map((asset, index) => ({
        id: asset.assetId || \`photo-${Date.now()}-${index}\`,
        uri: asset.uri,
        fileName: asset.fileName || "",
        width: asset.width || 0,
        height: asset.height || 0,
        marketingOk: jobPhotosMarketingOk,
      }));
      setPendingJobPhotos((current) => {
        const merged = [...current];
        picked.forEach((photo) => {
          if (!merged.some((item) => item.uri === photo.uri)) merged.push(photo);
        });
        return merged.slice(0, 5);
      });
    } catch (error) {
      Alert.alert("Could not open photos", "Please try again. No photo access has been changed.");
    }
  };

  const removePendingJobPhoto = (photoId) => {
    setPendingJobPhotos((current) => current.filter((photo) => photo.id !== photoId));
  };

  const saveJobPhotos = () => {
    if (!selectedJobId || !selectedCustomerId) return;
    const savedAt = new Date().toISOString();
    const photos = pendingJobPhotos.map((photo) => ({
      ...photo,
      marketingOk: !!jobPhotosMarketingOk,
      attachedAt: photo.attachedAt || savedAt,
    }));
    setCustomers((list) =>
      list.map((customer) => {
        if (customer.id !== selectedCustomerId) return customer;
        const history = (customer.history || []).map((item) =>
          item.id === selectedJobId ? { ...item, photos } : item
        );
        return { ...customer, history };
      })
    );
    appendCustomerActivity(selectedCustomerId, {
      kind: "photos",
      title: "Job photos updated",
      note: photos.length
        ? \`${photos.length} photo${photos.length === 1 ? "" : "s"} attached to the completed job. ${jobPhotosMarketingOk ? "They can be suggested for future marketing, but nothing is posted automatically." : "They are kept private to the job unless you change the setting later."}\`
        : "Job photos removed.",
    });
    if (photos.length && jobPhotosMarketingOk) {
      go("jobPhotoOpportunity");
    } else {
      openCustomer(selectedCustomerId);
    }
  };

  const prepareJobPost = () => {
    const customer = customers.find((item) => item.id === selectedCustomerId);
    const job = (customer?.history || []).find((item) => item.id === selectedJobId);
    if (!customer || !job) return;
    const allowedPhotos = (job.photos || []).filter((photo) => photo.marketingOk);
    if (!allowedPhotos.length) {
      Alert.alert("No approved job photos", "Allow these job photos to be suggested for marketing first.");
      return;
    }
    const service = job.service || customer.service || "job";
    const draft =
      job.postDraft ||
      \`Just finished another ${service.toLowerCase()} job. If you need something similar, send us a message and we’ll take a look.\`;
    setJobPostDraft(draft);
    go("jobPostDraft");
  };

  const openJobPostDraft = () => {
    const customer = customers.find((item) => item.id === selectedCustomerId);
    const job = (customer?.history || []).find((item) => item.id === selectedJobId);
    if (!job) return;
    setJobPostDraft(job.postDraft || "");
    go("jobPostDraft");
  };

  const saveJobPostDraft = () => {
    const draft = jobPostDraft.trim();
    if (!draft || !selectedJobId || !selectedCustomerId) return;
    const preparedAt = new Date().toISOString();
    setCustomers((list) =>
      list.map((customer) => {
        if (customer.id !== selectedCustomerId) return customer;
        const history = (customer.history || []).map((item) =>
          item.id === selectedJobId
            ? {
                ...item,
                postDraft: draft,
                postDraftPreparedAt: preparedAt,
                postDraftStatus: "Prepared",
              }
            : item
        );
        return { ...customer, history };
      })
    );
    appendCustomerActivity(selectedCustomerId, {
      kind: "marketing",
      title: "Finished-job post drafted",
      note: "Draft saved locally. Nothing has been posted.",
    });
    openCustomer(selectedCustomerId);
  };

  const markReminderDone =`.replaceAll("\\`","\x60"),
"booking completion + photo workflow"
);

replaceOnce(
`    setActionJobValue("");
    setActionJobNote("");
    setEditingCustomerId(null);`,
`    setActionJobValue("");
    setActionJobNote("");
    setSelectedJobId(null);
    setPendingJobPhotos([]);
    setJobPhotosMarketingOk(false);
    setJobPostDraft("");
    setEditingCustomerId(null);`,
"reset photo state"
);

replaceOnce(
`  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null;
  const todayISO = dateToISO(new Date());`,
`  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null;
  const selectedJobCustomer = selectedJobId
    ? customers.find((customer) =>
        (Array.isArray(customer.history) ? customer.history : []).some((item) => item.id === selectedJobId)
      ) || selectedCustomer
    : selectedCustomer;
  const selectedJob = selectedJobCustomer
    ? (Array.isArray(selectedJobCustomer.history) ? selectedJobCustomer.history : []).find((item) => item.id === selectedJobId) || null
    : null;
  const todayISO = dateToISO(new Date());`,
"selected job lookup"
);

replaceOnce(
`  const appState = {`,
`  const completedJobEntries = customers.flatMap((customer) =>
    (Array.isArray(customer.history) ? customer.history : [])
      .filter((item) => item.kind === "job")
      .map((job) => ({ customer, job }))
  );
  const attachedJobPhotoCount = completedJobEntries.reduce(
    (total, entry) => total + (Array.isArray(entry.job.photos) ? entry.job.photos.length : 0),
    0
  );
  const reusableJobPhotoCount = completedJobEntries.reduce(
    (total, entry) =>
      total +
      (Array.isArray(entry.job.photos)
        ? entry.job.photos.filter((photo) => photo.marketingOk).length
        : 0),
    0
  );
  const preparedPhotoPostCount = completedJobEntries.filter((entry) => !!entry.job.postDraft).length;
  const photoOpportunityEntry =
    completedJobEntries
      .filter(
        (entry) =>
          Array.isArray(entry.job.photos) &&
          entry.job.photos.some((photo) => photo.marketingOk) &&
          !entry.job.postDraft
      )
      .sort((a, b) => String(b.job.date || "").localeCompare(String(a.job.date || "")))[0] || null;
  const photoOpportunity = photoOpportunityEntry
    ? {
        customerId: photoOpportunityEntry.customer.id,
        customerName: photoOpportunityEntry.customer.name,
        jobId: photoOpportunityEntry.job.id,
        service: photoOpportunityEntry.job.service || photoOpportunityEntry.customer.service,
        photoCount: photoOpportunityEntry.job.photos.filter((photo) => photo.marketingOk).length,
      }
    : null;

  const appState = {`,
"asset metrics"
);

replaceOnce(
`    selectedCustomer,
    openCustomer,
    newCustomerName,`,
`    selectedCustomer,
    openCustomer,
    selectedJobId,
    selectedJobCustomer,
    selectedJob,
    pendingJobPhotos,
    setPendingJobPhotos,
    jobPhotosMarketingOk,
    setJobPhotosMarketingOk,
    jobPostDraft,
    setJobPostDraft,
    startJobPhotoPrompt,
    openJobAssets,
    openJobPhotoOpportunity,
    chooseJobPhotos,
    removePendingJobPhoto,
    saveJobPhotos,
    prepareJobPost,
    openJobPostDraft,
    saveJobPostDraft,
    attachedJobPhotoCount,
    reusableJobPhotoCount,
    preparedPhotoPostCount,
    photoOpportunity,
    newCustomerName,`,
"app state photo fields"
);

replaceOnce(
`            <Button
              label="Mark job completed"
              onPress={() => s.markBookingCompleted(customer.id, s.actionJobValue, s.actionJobNote)}
            />`,
`            <Button
              label="Mark job completed"
              onPress={() => {
                const jobId = s.markBookingCompleted(customer.id, s.actionJobValue, s.actionJobNote);
                if (jobId) s.startJobPhotoPrompt(customer.id, jobId);
              }}
            />`,
"completion button"
);

replaceOnce(
`        {saved.done && bookingStatus === "Completed" ? (
          <Button label="View customer job history" onPress={() => s.openCustomer(customer.id)} />
        ) : null}`,
`        {saved.done && bookingStatus === "Completed" ? (
          <>
            <Button
              label="Manage job photos"
              onPress={() => s.openJobAssets(customer.id, \`job-${customer.id}-${saved.details?.bookingDate}\`)}
            />
            <Button label="View customer job history" onPress={() => s.openCustomer(customer.id)} />
          </>
        ) : null}`.replaceAll("\\`","\x60"),
"completed booking photo button"
);

replaceOnce(
`            {item.note ? <Text style={styles.customerHistoryNote}>{item.note}</Text> : null}
          </View>
          <Text style={styles.customerHistoryValue}>{Number(item.value) > 0 ? \`£${item.value}\` : "—"}</Text>
        </View>`.replaceAll("\\`","\x60"),
`            {item.note ? <Text style={styles.customerHistoryNote}>{item.note}</Text> : null}
            {Array.isArray(item.photos) && item.photos.length ? (
              <>
                <Text style={styles.customerHistoryPhotoMeta}>
                  {item.photos.length} job photo{item.photos.length === 1 ? "" : "s"}
                  {item.postDraft ? " • post draft ready" : ""}
                </Text>
                <Pressable onPress={() => s.openJobAssets(customer.id, item.id)} style={styles.customerHistoryPhotoLink}>
                  <Text style={styles.customerHistoryPhotoLinkText}>Open photos / draft →</Text>
                </Pressable>
              </>
            ) : null}
          </View>
          <Text style={styles.customerHistoryValue}>{Number(item.value) > 0 ? \`£${item.value}\` : "—"}</Text>
        </View>`.replaceAll("\\`","\x60"),
"customer history photo link"
);

replaceOnce(
`function AddCustomerRecord({ s }) {`,
`function JobCompletePhotos({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return (
      <Shell s={s} title="Job saved" subtitle="The completed job is saved, but the photo step could not be opened.">
        <Button label="Back" primary onPress={s.back} />
      </Shell>
    );
  }
  return (
    <Shell s={s} title="Job complete" subtitle={\`${customer.name} • ${job.service || customer.service}\`} brandCue="Save the useful proof once. Reuse it only with permission.">
      <Card eyebrow="Completed work" title={job.service || customer.service} body={\`${job.date ? formatUKDate(job.date) : "Date saved"}${Number(job.value) > 0 ? \` • £${job.value}\` : ""}\`} footer="Saved to this customer’s job history" tone="green" />
      <Card eyebrow="Optional next step" title="Got any photos from this job?" body="Choose only the photos you want attached to this job. Busy Does It does not browse the rest of your camera roll, and nothing is posted automatically." tone="blue" />
      <Button label="Add job photos" primary onPress={() => s.go("jobPhotos")} />
      <Button label="Skip for now" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPhotos({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  if (!customer || !job) {
    return <Shell s={s} title="Job photos" subtitle="The selected job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell s={s} title="Job photos" subtitle={\`${customer.name} • ${job.service || customer.service}\`} brandCue="You choose the exact images. Busy Does It only sees what you select.">
      <Card eyebrow="Privacy first" title={s.pendingJobPhotos.length ? \`${s.pendingJobPhotos.length} photo${s.pendingJobPhotos.length === 1 ? "" : "s"} selected\` : "No photos selected yet"} body="A photo can stay attached privately to the job. Allowing future marketing suggestions still does not publish it — you approve public use separately." tone="green" />
      <Button label={s.pendingJobPhotos.length ? "Choose more / different photos" : "Choose photos"} primary={!s.pendingJobPhotos.length} onPress={s.chooseJobPhotos} />
      {s.pendingJobPhotos.length ? (
        <View style={styles.photoGrid}>
          {s.pendingJobPhotos.map((photo) => (
            <View key={photo.id || photo.uri} style={styles.photoTile}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <Pressable onPress={() => s.removePendingJobPhoto(photo.id)} style={styles.photoRemove}><Text style={styles.photoRemoveText}>Remove</Text></Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {s.pendingJobPhotos.length ? (
        <ToggleRow title="Let Busy Does It suggest these later" body="Makes these selected photos available for future post/profile/ad suggestions. Nothing is posted without another approval." value={s.jobPhotosMarketingOk} onValueChange={s.setJobPhotosMarketingOk} />
      ) : null}
      {job.postDraft ? (
        <Card eyebrow="Saved draft" title="A finished-job post draft is ready" body="It is stored locally and has not been posted anywhere." tone="blue">
          <Button label="Open saved post draft" onPress={s.openJobPostDraft} />
        </Card>
      ) : null}
      <Button label={s.pendingJobPhotos.length ? "Save job photos" : "Save without photos"} primary={!!s.pendingJobPhotos.length} onPress={s.saveJobPhotos} />
      <Button label="Back to customer" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPhotoOpportunity({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const allowedPhotos = (job?.photos || []).filter((photo) => photo.marketingOk);
  if (!customer || !job) {
    return <Shell s={s} title="Free next move" subtitle="The completed job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell s={s} title="Free next move" subtitle="Use work you already completed before buying more attention." brandCue="Existing proof first. Paid reach later.">
      <Card eyebrow="Finished-job content" title={\`Turn ${allowedPhotos.length} job photo${allowedPhotos.length === 1 ? "" : "s"} into a post?\`} body={\`${customer.name}’s ${(job.service || customer.service).toLowerCase()} job is already saved. Busy Does It can prepare a simple post draft using only the photos you approved for suggestions.\`} footer="Cost: £0 • nothing posts without approval" tone="green" />
      <Button label="Prepare a post" primary disabled={!allowedPhotos.length} onPress={s.prepareJobPost} />
      <Button label="Not now" onPress={() => s.openCustomer(customer.id)} />
    </Shell>
  );
}

function JobPostDraft({ s }) {
  const customer = s.selectedJobCustomer;
  const job = s.selectedJob;
  const allowedPhotos = (job?.photos || []).filter((photo) => photo.marketingOk);
  if (!customer || !job) {
    return <Shell s={s} title="Post draft" subtitle="The completed job could not be found."><Button label="Back" primary onPress={s.back} /></Shell>;
  }
  return (
    <Shell s={s} title="Finished-job post" subtitle="Draft only. Busy Does It will not publish this prototype post." brandCue="Prepare underneath. Owner approves what goes public.">
      <Card eyebrow="Approved source material" title={\`${allowedPhotos.length} job photo${allowedPhotos.length === 1 ? "" : "s"} available\`} body="These are only the photos you selected and allowed Busy Does It to suggest for marketing." tone="green" />
      <Text style={styles.fieldLabel}>Post draft</Text>
      <TextInput multiline value={s.jobPostDraft} onChangeText={s.setJobPostDraft} placeholder="Write the finished-job post" placeholderTextColor="#9AA3B2" style={styles.messageInput} />
      <Text style={styles.helper}>No address or private customer detail is added automatically.</Text>
      <Button label="Save post draft" primary disabled={!s.jobPostDraft.trim()} onPress={s.saveJobPostDraft} />
      <Button label="Back to photos" onPress={() => s.go("jobPhotos")} />
    </Shell>
  );
}

function AddCustomerRecord({ s }) {`.replaceAll("\\`","\x60"),
"photo screens"
);

replaceOnce(
`          onAction: () => s.go("customerActivity"),
        }]
      : []),
    {
      id: "quiet-slot",`,
`          onAction: () => s.go("customerActivity"),
        }]
      : []),
    ...(s.photoOpportunity
      ? [{
          id: \`job-photo-${s.photoOpportunity.jobId}\`,
          eyebrow: "Free content",
          title: \`Use ${s.photoOpportunity.photoCount} recent job photo${s.photoOpportunity.photoCount === 1 ? "" : "s"}\`,
          body: \`${s.photoOpportunity.customerName}’s ${s.photoOpportunity.service.toLowerCase()} job is already saved. Prepare a finished-job post before paying to reach more people.\`,
          footer: "Cost: £0 • nothing posts without approval",
          status: "Free",
          tone: "green",
          why: "These are real job photos you deliberately attached and allowed Busy Does It to suggest. Reusing existing proof costs nothing, so it is worth considering before paid promotion.",
          evidence: [
            ["Approved job photos", String(s.photoOpportunity.photoCount)],
            ["Source", "Completed customer job"],
            ["Public posting", "Still requires approval"],
            ["Advertising required", "£0"],
          ],
          onAction: () => s.openJobPhotoOpportunity(s.photoOpportunity.customerId, s.photoOpportunity.jobId),
        }]
      : []),
    {
      id: "quiet-slot",`.replaceAll("\\`","\x60"),
"home photo opportunity"
);

replaceOnce(
`        <MetricRow left="Completed job value" right={\`£${s.completedJobValue}\`} strong={s.completedJobValue > 0} />
        <MetricRow left="Follow-ups due" right={String(s.dueReminderEntries.length)} />`.replaceAll("\\`","\x60"),
`        <MetricRow left="Completed job value" right={\`£${s.completedJobValue}\`} strong={s.completedJobValue > 0} />
        <MetricRow left="Job photos attached" right={String(s.attachedJobPhotoCount)} />
        <MetricRow left="Photos reusable with permission" right={String(s.reusableJobPhotoCount)} strong={s.reusableJobPhotoCount > 0} />
        <MetricRow left="Finished-job post drafts" right={String(s.preparedPhotoPostCount)} />
        <MetricRow left="Follow-ups due" right={String(s.dueReminderEntries.length)} />`.replaceAll("\\`","\x60"),
"results asset metrics"
);

replaceOnce(
`  customerDetail: CustomerDetail,
  newEnquiry: NewEnquiry,`,
`  customerDetail: CustomerDetail,
  jobCompletePhotos: JobCompletePhotos,
  jobPhotos: JobPhotos,
  jobPhotoOpportunity: JobPhotoOpportunity,
  jobPostDraft: JobPostDraft,
  newEnquiry: NewEnquiry,`,
"screens map"
);

replaceOnce("Prototype v1.2 • daily operations + follow-up","Prototype v1.3 • job photos + reusable assets","version badge");

replaceOnce(
`  nav: {`,
`  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  photoTile: { width: "31%", minWidth: 96, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  photoImage: { width: "100%", aspectRatio: 1, backgroundColor: "#E8ECF3" },
  photoRemove: { paddingVertical: 8, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  photoRemoveText: { color: C.red, fontSize: 12, fontWeight: "800" },
  customerHistoryPhotoMeta: { color: C.green, fontSize: 12, fontWeight: "800", marginTop: 7 },
  customerHistoryPhotoLink: { alignSelf: "flex-start", paddingTop: 7, paddingBottom: 2 },
  customerHistoryPhotoLinkText: { color: C.blue, fontSize: 13, fontWeight: "800" },
  nav: {`,
"photo styles"
);

fs.writeFileSync(appPath, src);

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.version = "1.3.0";
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies["expo-image-picker"] = "~57.0.20";
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

let readme = fs.readFileSync(readmePath, "utf8");
if (!readme.includes("## v1.3 job photos + reusable assets")) {
  readme += `

## v1.3 job photos + reusable assets
- Completing a booked job now offers an optional job-photo step instead of ending the workflow abruptly.
- Job photos are chosen explicitly with the system photo picker; Busy Does It never silently browses the camera roll.
- Selected photos attach to the completed customer job and can stay private to that job.
- A separate permission toggle controls whether those exact photos may be suggested for future marketing; attaching a photo never means it is automatically public.
- Approved job photos can trigger a £0 finished-job content opportunity before paid promotion.
- Busy Does It can prepare an editable finished-job post draft from approved photos, but the prototype does not publish anything.
- Customer job history now shows photo counts and saved post-draft status.
- Results now counts attached job photos, reusable-with-permission photos and prepared finished-job drafts.
- The photo workflow stays service-business-generic and uses the customer’s real saved service rather than exterior-cleaning assumptions.
`;
}
fs.writeFileSync(readmePath, readme);
