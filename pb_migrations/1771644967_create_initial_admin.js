migrate((app) => {
    try {
        const adminEmail = $os.getenv("ADMIN_EMAIL");
        const adminPass = $os.getenv("ADMIN_PASSWORD");

        if (!adminEmail || !adminPass) {
            console.log("Skipping initial superuser creation: Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.");
            return;
        }

        const collection = app.findCollectionByNameOrId("_superusers");

        // 1. Ensure password auth is enabled
        unmarshal({
            "passwordAuth": {
                "enabled": true
            }
        }, collection);
        app.save(collection);

        // 2. Count existing records in the _superusers collection
        let totalAdmins = 0;
        try {
            const records = app.findRecordsByFilter("_superusers", "email != ''", "", 1, 0);
            totalAdmins = records.length;
        } catch (e) {
            // Probably empty
        }

        if (totalAdmins === 0) {
            console.log(`Creating initial superuser in _superusers: ${adminEmail}`);
            const record = new Record(collection);

            record.set("email", adminEmail);
            record.setPassword(adminPass);
            record.set("verified", true);

            app.save(record);
            console.log("Initial superuser created successfully.");
        } else {
            console.log("Superusers already exist in _superusers. Skipping initial creation.");
        }
    } catch (err) {
        console.log("Error creating initial superuser: " + err);
    }
}, (app) => {
    return null;
})
