/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    console.log("Starting consolidated migration...");

    // 1. Update users collection rules
    try {
        const users = app.findCollectionByNameOrId("users");
        console.log("Updating users rules...");
        users.listRule = "id = @request.auth.id";
        users.viewRule = "id = @request.auth.id";
        users.updateRule = "id = @request.auth.id";
        users.deleteRule = "id = @request.auth.id";
        app.save(users);
    } catch (e) {
        console.log("Error updating users:", e);
    }

    // 2. Create companies collection
    console.log("Creating companies collection...");
    const companies = new Collection({
        "name": "companies",
        "type": "base",
        "fields": [
            {
                "name": "name",
                "type": "text",
                "required": true,
                "presentable": true
            },
            {
                "name": "user",
                "type": "relation",
                "required": true,
                "collectionId": "_pb_users_auth_",
                "cascadeDelete": true,
                "maxSelect": 1
            },
            {
                "name": "settings",
                "type": "json"
            }
        ],
        "listRule": "user = @request.auth.id",
        "viewRule": "user = @request.auth.id",
        "createRule": "@request.auth.id != \"\"",
        "updateRule": "user = @request.auth.id",
        "deleteRule": "user = @request.auth.id"
    });
    app.save(companies);

    // 3. Create time_records collection
    console.log("Creating time_records collection...");
    const timeRecords = new Collection({
        "name": "time_records",
        "type": "base",
        "fields": [
            {
                "name": "company",
                "type": "relation",
                "required": true,
                "collectionId": companies.id,
                "cascadeDelete": true,
                "maxSelect": 1
            },
            {
                "name": "user",
                "type": "relation",
                "required": true,
                "collectionId": "_pb_users_auth_",
                "cascadeDelete": true,
                "maxSelect": 1
            },
            {
                "name": "type",
                "type": "select",
                "required": true,
                "values": ["entry", "exit"],
                "maxSelect": 1
            },
            {
                "name": "timestamp",
                "type": "autodate",
                "onCreate": true,
                "onUpdate": false
            },
            {
                "name": "manual_timestamp",
                "type": "date"
            },
            {
                "name": "comment",
                "type": "text"
            }
        ],
        "listRule": "user = @request.auth.id",
        "viewRule": "user = @request.auth.id",
        "createRule": "@request.auth.id != \"\"",
        "updateRule": "user = @request.auth.id",
        "deleteRule": "user = @request.auth.id"
    });

    return app.save(timeRecords);
})
