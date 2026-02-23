migrate((app) => {
    const clientId = $os.getenv("GOOGLE_CLIENT_ID");
    const clientSecret = $os.getenv("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
        console.log("Skipping Google OAuth2 configuration: Missing environment variables GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
        return;
    }

    const collection = app.findCollectionByNameOrId("_pb_users_auth_");

    unmarshal({
        "oauth2": {
            "enabled": true,
            "providers": [
                {
                    "name": "google",
                    "clientId": clientId,
                    "clientSecret": clientSecret,
                    "displayName": "Google"
                }
            ]
        }
    }, collection);

    return app.save(collection);
}, (app) => {
    // Rollback is not strictly necessary as this is a configuration sync, 
    // but we could disable the provider if we wanted to be strict.
    return null;
})
