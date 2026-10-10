import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
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
  if (!preview?.html) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0b1220", padding: 20 }}>
        <Text style={{ color: "#fff", fontSize: 23, fontWeight: "700" }}>Website preview unavailable</Text>
        <Text style={{ color: "#c4ccdc", marginVertical: 14 }}>Return to Website Management and open the hosted preview again.</Text>
        <Button label="Back to Website Management" onPress={s.back} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <View style={{ paddingHorizontal: 15, paddingTop: 12, paddingBottom: 10, gap: 7 }}>
        <Text style={{ color: "#fff", fontSize: 21, fontWeight: "700" }}>Your private website preview</Text>
        <Text style={{ color: "#a9c4ef", fontSize: 13 }}>
          Real hosted pages • Not public • Publishing requires your approval
        </Text>
        <Button label="Back to Website Management" onPress={s.back} />
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
