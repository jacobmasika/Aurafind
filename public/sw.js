self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "AuraFind Alert", body: "New case in your area." };
  event.waitUntil(
    self.registration.showNotification(data.title || "AuraFind Alert", {
      body: data.body || "New geofenced alert.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    }),
  );
});
