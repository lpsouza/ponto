migrate((app) => {
    try {
        const adminEmail = $os.getenv("ADMIN_EMAIL");
        const adminPass = $os.getenv("ADMIN_PASSWORD");

        if (!adminEmail || !adminPass) {
            console.log("Skipping initial superuser creation: Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.");
            return;
        }

        const collection = app.findCollectionByNameOrId("_pb_users_auth_");

        // Count existing records
        let totalAdmins = 0;
        try {
            const records = app.findRecordsByFilter("_pb_users_auth_", "email != ''", "", 1, 0);
            totalAdmins = records.length;
        } catch (e) {
            // Probably empty or table doesn't exist yet in a weird state
        }

        if (totalAdmins === 0) {
            console.log(`Creating initial superuser: ${adminEmail}`);
            const record = new Record(collection);

            record.set("email", adminEmail);
            record.set("password", adminPass);
            record.set("passwordConfirm", adminPass);

            app.save(record);
            console.log("Initial superuser created successfully.");
        } else {
            console.log("Superusers already exist. Skipping initial creation.");
        }
    } catch (err) {
        console.log("Error creating initial superuser: " + err);
    }
}, (app) => {
    return null;
})
