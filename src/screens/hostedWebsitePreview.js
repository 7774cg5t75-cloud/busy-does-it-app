import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { styles } from "../theme/styles";
import { Button } from "../components/ui";

/**
 * Renders the SAME immutable HTML saved to the private Storage deployment.
 * A Storage signed URL served to Safari is intentionally text/plain, so it
 * cannot be used as a browser preview. No user HTML is executed in BUSY:
 * scripts, DOM storage, downloads and arbitrary page navigation are disabled.
 */
function HostedWebsitePreview({ s }) {
  const preview = s.hostedWebsitePreview;
  const returnScreen = Array.isArray(s.history) && s.history.length
    ? s.history[s.history.length - 1] : "";
  const backLabel = returnScreen === "websitePreview"
    ? "Back to my website draft"
    : returnScreen === "websiteBuilder"
    ? "Back to Website Builder"
    : "Back to Website Management";
  if (!preview?.html) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0b1220", padding: 20 }}>
        <Text style={{ color: "#fff", fontSize: 23, fontWeight: "700" }}>Website preview unavailable</Text>
        <Text style={{ color: "#c4ccdc", marginVertical: 14 }}>Return to Website Management and open the hosted preview again.</Text>
        <Button label={backLabel} onPress={s.back} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <View style={{ paddingHorizontal: 15, paddingTop: 12, paddingBottom: 10, gap: 7 }}>
        <Text style={{ color: "#fff", fontSize: 21, fontWeight: "700" }}>{preview.brandName ? "Previewing " + preview.brandName : "Your private website preview"}</Text>
        <Text style={{ color: "#a9c4ef", fontSize: 13 }}>
          Real hosted pages • Not public • Publishing requires your approval
        </Text>
        <Button label={backLabel} onPress={s.back} />
        {Array.isArray(preview.pages) && preview.pages.length > 1 ? (
          <View>
            <Text style={{ color: "#ccd7e9", fontSize: 12, marginBottom: 7 }}>
              Browse your website pages — you can return to them as often as you like
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: "row", gap: 8, paddingRight: 12 }}>
              {preview.pages.map((page, index) => (
                <Pressable
                  key={page.path || page.id || index}
                  accessibilityRole="button"
                  accessibilityLabel={"Open " + (page.id === "home" ? "Home" : page.label || page.id || "Page") + " website page"}
                  accessibilityState={{ selected: preview.pageId === page.id, disabled: !!preview.loading }}
                  disabled={!!preview.loading}
                  onPress={() => s.openHostedWebsitePreviewPage(page.url)}
                  style={{
                    paddingVertical: 9, paddingHorizontal: 13, borderRadius: 11,
                    backgroundColor: preview.pageId === page.id ? "#e0ecff" : "#263448",
                    borderWidth: 1, borderColor: preview.pageId === page.id ? "#8cbaff" : "#3b4a60",
                  }}
                >
                  <Text style={{ color: preview.pageId === page.id ? "#15263f" : "#f0f5ff", fontWeight: "700", fontSize: 13 }}>
                    {page.id === "home" ? "Home" : (page.label || page.id || "Page").replace(/-/g, " ").replace(/^./, x => x.toUpperCase())}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
        {preview.error ? <Text style={{ color: "#ffcc8d" }}>{preview.error}</Text> : null}
      </View>
      <View style={{ flex: 1, marginHorizontal: 8, marginBottom: 8, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" }}>
        <WebView
          key={preview.pageId + ":" + preview.version}
          source={{ html: preview.html, baseUrl: "about:blank" }}
          style={{ flex: 1, backgroundColor: "#fff" }}
          originWhitelist={["*"]}
          javaScriptEnabled={false}
          domStorageEnabled={false}
          incognito
          mixedContentMode="never"
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(request) => {
            const href = request?.url || "";
            if (href === "about:blank" || href.startsWith("about:blank#")) return true;
            // Page-to-page links are resolved exclusively against the
            // server-generated manifest for this exact private deployment.
            // External domains, payments, scripts and unknown URLs are blocked.
            s.openHostedWebsitePreviewPage(href);
            return false;
          }}
          renderLoading={() => <ActivityIndicator style={{ flex: 1 }} />}
          startInLoadingState
          onError={() => s.hostedWebsitePreviewLoadError("The website preview couldn't render. Try reopening it.")}
        />
        {preview.loading ? (
          <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
            backgroundColor: "rgba(255,255,255,.85)", justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10, color: "#334155" }}>Opening website page…</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export { HostedWebsitePreview };
