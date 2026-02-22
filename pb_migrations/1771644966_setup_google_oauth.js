/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const clientId = os.getenv("GOOGLE_CLIENT_ID");
    const clientSecret = os.getenv("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
        console.log("Skipping Google OAuth2 configuration: Missing environment variables GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
        return;
    }

    const settings = app.settings();

    // Enable OAuth2
    settings.oauth2.enabled = true;

    // Configure Google Provider
    settings.oauth2.providers = settings.oauth2.providers || [];

    const googleIndex = settings.oauth2.providers.findIndex(p => p.name === "google");
    const googleConfig = {
        name: "google",
        enabled: true,
        clientId: clientId,
        clientSecret: clientSecret,
        displayName: "Google"
    };

    if (googleIndex > -1) {
        settings.oauth2.providers[googleIndex] = Object.assign(settings.oauth2.providers[googleIndex], googleConfig);
    } else {
        settings.oauth2.providers.push(googleConfig);
    }

    app.saveSettings(settings);
    console.log("Google OAuth2 configured successfully via environment variables.");
}, (app) => {
    // Rollback is not strictly necessary as this is a configuration sync, 
    // but we could disable the provider if we wanted to be strict.
    return null;
})
