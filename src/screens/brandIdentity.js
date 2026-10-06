import React from "react";
import { Text, View } from "react-native";

import { styles } from "../theme/styles";
import {
  Shell,
  Card,
  Button,
  Field,
  Choice,
  MetricRow,
  StatusChip,
} from "../components/ui";

const toneChoices = [
  "Friendly and professional",
  "Warm and conversational",
  "Straightforward and practical",
  "Premium and polished",
];

const visualChoices = [
  "Clean and modern",
  "Warm and trustworthy",
  "Traditional and established",
  "Bold and energetic",
];

function BrandIdentity({ s }) {
  const brain = s.brandBrain || {};
  const profile = s.brandProfile || {};
  const completeness = brain.completeness || {};
  const summary = brain.summary || {};
  const checks = brain.checks || [];

  return (
    <Shell
      s={s}
      title="Brand & Business Identity"
      subtitle="One authoritative public identity for websites, social, customer communication and future marketing."
      brandCue="V3.34 • Brand Brain • tell BUSY once, reuse it everywhere."
    >
      <Card
        eyebrow="Website-builder foundation"
        title={brain.websiteReadinessLabel || "Build the business identity first"}
        body={
          brain.websiteReady
            ? "BUSY now has enough core identity information to create a first website draft without starting from a blank page."
            : "Fill the important gaps here now. V3.35 can then generate from real business information instead of asking you to rebuild the profile again."
        }
        footer="Website readiness is a checklist, not a claim that every optional brand detail is finished."
        tone={brain.websiteReady ? "green" : (brain.highCheckCount || 0) > 0 ? "amber" : "blue"}
      >
        <MetricRow
          left="Identity completeness"
          right={`${Number(completeness.score || 0)}%`}
          strong={Number(completeness.score || 0) >= 70}
        />
        <MetricRow
          left="Core gaps"
          right={String(completeness.coreMissing?.length || 0)}
          strong={(completeness.coreMissing?.length || 0) > 0}
        />
        <MetricRow left="Services" right={String(summary.serviceCount || 0)} />
        <MetricRow left="Website-suitable photos" right={String(summary.photoCount || 0)} />
        <MetricRow left="Approved testimonials" right={String(summary.testimonialCount || 0)} />
      </Card>

      <Text style={styles.sectionLabel}>Public business identity</Text>
      <Field label="Business name" value={s.businessName} onChangeText={s.setBusinessName} />
      <Field label="Trade / business type" value={s.trade} onChangeText={s.setTrade} />
      <Field
        label="Tagline / short promise"
        value={profile.tagline || ""}
        onChangeText={(value) => s.updateBrandProfile("tagline", value)}
        placeholder="e.g. Reliable local exterior cleaning"
      />
      <Field
        label="Public business description"
        value={profile.publicDescription || ""}
        onChangeText={(value) => s.updateBrandProfile("publicDescription", value)}
        placeholder="What the business does and who it helps"
      />
      <Field
        label="Business story / About"
        value={profile.story || ""}
        onChangeText={(value) => s.updateBrandProfile("story", value)}
        placeholder="Background, experience and how the business started"
      />
      <Field
        label="What makes you different"
        value={profile.differentiators || ""}
        onChangeText={(value) => s.updateBrandProfile("differentiators", value)}
        placeholder="What should customers remember about you?"
      />

      <Text style={styles.sectionLabel}>Service area & contact</Text>
      <Field label="Base postcode / area" value={s.postcode} onChangeText={s.setPostcode} />
      <Field
        label="Public service area wording"
        value={profile.serviceAreaText || ""}
        onChangeText={(value) => s.updateBrandProfile("serviceAreaText", value)}
        placeholder="e.g. Devon, serving the South West & beyond"
      />
      <Field
        label="Public phone"
        value={profile.phone || ""}
        onChangeText={(value) => s.updateBrandProfile("phone", value)}
        keyboardType="phone-pad"
      />
      <Field
        label="Public email"
        value={profile.email || ""}
        onChangeText={(value) => s.updateBrandProfile("email", value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        label="Opening / contact hours"
        value={profile.openingHours || ""}
        onChangeText={(value) => s.updateBrandProfile("openingHours", value)}
        placeholder="e.g. Mon–Sat, 8am–6pm"
      />
      <Field
        label="Existing website / domain"
        value={profile.websiteDomain || ""}
        onChangeText={(value) => s.updateBrandProfile("websiteDomain", value)}
        autoCapitalize="none"
        placeholder="Leave blank if BUSY will build the first site"
      />

      <Text style={styles.sectionLabel}>Tone of voice</Text>
      {toneChoices.map((option) => (
        <Choice
          key={option}
          label={option}
          selected={profile.toneOfVoice === option}
          onPress={() => s.updateBrandProfile("toneOfVoice", option)}
        />
      ))}

      <Text style={styles.sectionLabel}>Visual direction</Text>
      {visualChoices.map((option) => (
        <Choice
          key={option}
          label={option}
          selected={profile.visualStyle === option}
          onPress={() => s.updateBrandProfile("visualStyle", option)}
        />
      ))}
      <Field
        label="Primary brand colour"
        value={profile.primaryColour || ""}
        onChangeText={(value) => s.updateBrandProfile("primaryColour", value)}
        placeholder="e.g. cream, #F4EFE5, dark green"
      />
      <Field
        label="Secondary brand colour"
        value={profile.secondaryColour || ""}
        onChangeText={(value) => s.updateBrandProfile("secondaryColour", value)}
        placeholder="Optional"
      />
      <Field
        label="Logo / brand mark note"
        value={profile.logoLabel || ""}
        onChangeText={(value) => s.updateBrandProfile("logoLabel", value)}
        placeholder="e.g. Main stacked logo approved"
      />

      <Text style={styles.sectionLabel}>Service master</Text>
      {(brain.serviceMaster || []).map((service) => (
        <Card
          key={service.id}
          eyebrow={service.wanted ? "Priority service" : "Service"}
          title={service.name}
          body={
            service.description ||
            "Add a public description so the future website builder does not have to invent one."
          }
          footer={
            [
              service.value ? `Typical value £${service.value}` : "",
              service.durationHours ? `${service.durationHours} hr planning duration` : "",
            ].filter(Boolean).join(" • ") || "Uses the existing BUSY service record"
          }
          tone={service.description ? "green" : "blue"}
        >
          <Field
            label="Public service description"
            value={profile.serviceDescriptions?.[service.id] || ""}
            onChangeText={(value) => s.updateBrandServiceDescription(service.id, value)}
            placeholder={`Describe ${service.name} for customers`}
          />
        </Card>
      ))}
      <Button label="Manage services" onPress={() => s.go("businessType")} />

      <Text style={styles.sectionLabel}>Photo library intelligence</Text>
      <Card
        eyebrow="Reuse work you already have"
        title={summary.photoCount ? `${summary.photoCount} approved photo${summary.photoCount === 1 ? "" : "s"} available` : "No website-suitable photos yet"}
        body="Brand Brain indexes completed-job photos already approved for marketing plus reusable cloud media from social drafts. It never treats an unapproved customer photo as public website content."
        footer={brain.heroAsset ? `Current hero candidate: ${brain.heroAsset.service || brain.heroAsset.source}` : "Add approved work photos before the final website build for a stronger first draft."}
        tone={summary.photoCount ? "green" : "blue"}
      >
        {(brain.photoLibrary || []).slice(0, 5).map((photo, index) => (
          <MetricRow
            key={photo.key}
            left={photo.service || photo.source || `Photo ${index + 1}`}
            right={photo.key === profile.heroAssetKey ? "Hero selected" : "Available"}
            strong={photo.key === profile.heroAssetKey}
            onPress={() => s.selectBrandHeroAsset(photo.key)}
          />
        ))}
      </Card>

      <Text style={styles.sectionLabel}>FAQs</Text>
      {(profile.faqs || []).map((faq) => (
        <Card
          key={faq.id}
          eyebrow="Approved business answer"
          title={faq.question}
          body={faq.answer}
          tone="blue"
        >
          <Button label="Remove FAQ" onPress={() => s.removeBrandFaq(faq.id)} />
        </Card>
      ))}
      <Field
        label="New FAQ question"
        value={s.newBrandFaqQuestion}
        onChangeText={s.setNewBrandFaqQuestion}
        placeholder="e.g. Do you provide free quotes?"
      />
      <Field
        label="Answer"
        value={s.newBrandFaqAnswer}
        onChangeText={s.setNewBrandFaqAnswer}
        placeholder="Use a factual answer BUSY can safely reuse"
      />
      <Button label="Add FAQ" onPress={s.addBrandFaq} />

      <Text style={styles.sectionLabel}>Approved testimonials</Text>
      {(profile.testimonials || []).map((testimonial) => (
        <Card
          key={testimonial.id}
          eyebrow="Approved for public use"
          title={testimonial.attribution || "Customer testimonial"}
          body={testimonial.text}
          footer="BUSY will only hand testimonials marked approved into website generation."
          tone="green"
        >
          <Button label="Remove testimonial" onPress={() => s.removeBrandTestimonial(testimonial.id)} />
        </Card>
      ))}
      <Card
        eyebrow="Permission boundary"
        title="Positive feedback is not automatically a testimonial"
        body="Add wording here only when you are happy it can be used publicly. BUSY will not scrape every nice customer message into marketing."
        tone="blue"
      />
      <Field
        label="Testimonial wording"
        value={s.newBrandTestimonialText}
        onChangeText={s.setNewBrandTestimonialText}
        placeholder="Approved customer wording"
      />
      <Field
        label="Attribution"
        value={s.newBrandTestimonialAttribution}
        onChangeText={s.setNewBrandTestimonialAttribution}
        placeholder="e.g. Sarah, Exeter"
      />
      <Button label="Add approved testimonial" onPress={s.addBrandTestimonial} />

      <Text style={styles.sectionLabel}>Social identity</Text>
      <Field
        label="Facebook page link"
        value={profile.facebookUrl || ""}
        onChangeText={(value) => s.updateBrandProfile("facebookUrl", value)}
        autoCapitalize="none"
      />
      <Field
        label="Instagram profile link"
        value={profile.instagramUrl || ""}
        onChangeText={(value) => s.updateBrandProfile("instagramUrl", value)}
        autoCapitalize="none"
      />

      <Text style={styles.sectionLabel}>Consistency & missing information</Text>
      {checks.length ? (
        checks.map((check) => (
          <Card
            key={check.id}
            eyebrow={check.severity === "High" ? "Fix before publishing" : "Review"}
            title={check.title}
            body={check.body}
            tone={check.severity === "High" ? "amber" : "blue"}
          />
        ))
      ) : (
        <Card
          eyebrow="Consistency"
          title="No obvious identity conflicts found"
          body="The current BUSY identity fields do not contradict the core business record."
          tone="green"
        />
      )}

      <Card
        eyebrow="V3.35 handoff"
        title={brain.websiteReady ? "Website brief is ready" : "BUSY is building the website brief as you fill this in"}
        body={
          brain.websiteReady
            ? "The next Website Builder sweep can consume this exact structured brief: business story, services, tone, visual direction, contact details, FAQs, testimonials and approved imagery."
            : (brain.missingForWebsite || []).length
            ? `Still needed for a safe first website draft: ${brain.missingForWebsite.join(", ")}.`
            : "Optional brand depth will keep improving the first website draft."
        }
        footer="Nothing has been published publicly by this screen."
        tone={brain.websiteReady ? "green" : "blue"}
      />

      <Button label="Ask BUSY what is missing" onPress={s.askBusyAboutBrandIdentity} />
      <Button label="Save to cloud now" onPress={() => s.syncCloudNow()} />
      <Button label="Back to Business data" onPress={() => s.go("businessData")} />
    </Shell>
  );
}

export { BrandIdentity };
