/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const users = app.findCollectionByNameOrId("users");

    // 1. Update users rules
    users.listRule = "id = @request.auth.id";
    users.viewRule = "id = @request.auth.id";
    users.updateRule = "id = @request.auth.id";
    users.deleteRule = "id = @request.auth.id";
    app.save(users);

    // 2. Create companies collection
    const companies = new Collection({
        name: "companies",
        type: "base",
        fields: [
            { "id": "text3208210256", "name": "id", "type": "text", "primaryKey": true, "system": true, "required": true, "autogeneratePattern": "[a-z0-9]{15}" },
            { name: "name", type: "text", required: true, presentable: true },
            { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
            { name: "settings", type: "json" },
            { "id": "autodate2990389176", "name": "created", "type": "autodate", "onCreate": true, "onUpdate": false, "system": true },
            { "id": "autodate3332085495", "name": "updated", "type": "autodate", "onCreate": true, "onUpdate": true, "system": true }
        ],
        listRule: "user = @request.auth.id",
        viewRule: "user = @request.auth.id",
        createRule: "@request.auth.id != ''",
        updateRule: "user = @request.auth.id",
        deleteRule: "user = @request.auth.id"
    });
    app.save(companies);

    // 3. Create time_records collection
    const timeRecords = new Collection({
        name: "time_records",
        type: "base",
        fields: [
            { "id": "text3208210256", "name": "id", "type": "text", "primaryKey": true, "system": true, "required": true, "autogeneratePattern": "[a-z0-9]{15}" },
            { name: "company", type: "relation", required: true, collectionId: companies.id, cascadeDelete: true, maxSelect: 1 },
            { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
            { name: "type", type: "select", required: true, values: ["start", "pause", "resume", "finish", "leave", "holiday", "compensation"], maxSelect: 1 },
            { name: "timestamp", type: "date", required: true },
            { name: "is_manual_entry", type: "bool" },
            { name: "notes", type: "text" },
            { name: "location", type: "text" },
            { name: "metadata", type: "json" },
            { "id": "autodate2990389176", "name": "created", "type": "autodate", "onCreate": true, "onUpdate": false, "system": true },
            { "id": "autodate3332085495", "name": "updated", "type": "autodate", "onCreate": true, "onUpdate": true, "system": true }
        ],
        listRule: "user = @request.auth.id",
        viewRule: "user = @request.auth.id",
        createRule: "@request.auth.id != ''",
        updateRule: "user = @request.auth.id",
        deleteRule: "user = @request.auth.id"
    });
    app.save(timeRecords);

    return null;
}, (app) => {
    return null;
})
