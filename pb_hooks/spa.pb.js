routerAdd("GET", "/{path...}", (c) => {
    let path = c.path()

    // Skip API and Admin UI
    if (path.startsWith("/api/") || path.startsWith("/_")) {
        return c.next()
    }

    // Attempt to serve static file
    // If it fails (e.g. file not found), return index.html for SPA routing
    try {
        return c.file("./pb_public" + path)
    } catch (e) {
        return c.file("./pb_public/index.html")
    }
})
