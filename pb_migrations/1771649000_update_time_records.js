/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const companies = app.findCollectionByNameOrId("companies");
    const timeRecords = app.findCollectionByNameOrId("time_records");

    unmarshal({
        "fields": [
            {
                "name": "id",
                "type": "text",
                "primaryKey": true,
                "system": true
            },
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
                "values": ["start", "pause", "resume", "finish"],
                "maxSelect": 1
            },
            {
                "name": "timestamp",
                "type": "date",
                "required": true
            },
            {
                "name": "is_manual_entry",
                "type": "bool"
            },
            {
                "name": "notes",
                "type": "text"
            },
            {
                "name": "location",
                "type": "text"
            },
            {
                "name": "created",
                "type": "autodate",
                "system": true,
                "onCreate": true,
                "onUpdate": false
            },
            {
                "name": "updated",
                "type": "autodate",
                "system": true,
                "onCreate": true,
                "onUpdate": true
            }
        ]
    }, timeRecords);

    return app.save(timeRecords);
}, (app) => {
    // Revert logic (simplified)
    const companies = app.findCollectionByNameOrId("companies");
    const timeRecords = app.findCollectionByNameOrId("time_records");

    unmarshal({
        "fields": [
            {
                "name": "id",
                "type": "text",
                "primaryKey": true,
                "system": true
            },
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
            },
            {
                "name": "created",
                "type": "autodate",
                "system": true,
                "onCreate": true,
                "onUpdate": false
            },
            {
                "name": "updated",
                "type": "autodate",
                "system": true,
                "onCreate": true,
                "onUpdate": true
            }
        ]
    }, timeRecords);

    return app.save(timeRecords);
})
