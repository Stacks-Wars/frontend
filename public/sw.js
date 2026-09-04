self.addEventListener("push", (event) => {
    if (!event.data) return

    let data = { title: "Stacks Wars", body: "", url: "/" }
    try {
        data = { ...data, ...event.data.json() }
    } catch {
        data.body = event.data.text()
    }

    event.waitUntil(
        (async () => {
            if (data.action === "close") {
                await closeTaggedNotifications(data.tag)
                return
            }

            const silent = data.silent === true
            const options = {
                body: data.body,
                tag: data.tag,
                icon: "/android-chrome-192x192.png",
                badge: "/android-chrome-192x192.png",
                silent,
                renotify: Boolean(data.tag) && !silent,
                data: { url: data.url || "/", tag: data.tag },
            }
            if (!silent) {
                options.vibrate = [200, 100, 200]
            }
            if (Array.isArray(data.actions) && data.actions.length > 0) {
                options.actions = data.actions
            }

            await self.registration.showNotification(data.title, options)
        })()
    )
})

async function closeTaggedNotifications(tag) {
    if (!tag) return
    const notes = await self.registration.getNotifications({ tag })
    for (const note of notes) {
        note.close()
    }
}

self.addEventListener("notificationclick", (event) => {
    event.notification.close()
    const url = event.notification.data?.url || "/"
    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                const existing = clients.find((client) =>
                    client.url.includes(self.location.origin)
                )
                if (existing) {
                    existing.focus()
                    if ("navigate" in existing) {
                        return existing.navigate(url)
                    }
                    return undefined
                }
                return self.clients.openWindow(url)
            })
    )
})
