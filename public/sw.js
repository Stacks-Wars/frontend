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

            //const clients = await self.clients.matchAll({
            //    type: "window",
            //    includeUncontrolled: true,
            //})
            //if (clients.some((client) => client.focused)) return

            await self.registration.showNotification(data.title, {
                body: data.body,
                tag: data.tag,
                icon: "/android-chrome-192x192.png",
                badge: "/android-chrome-192x192.png",
                data: { url: data.url || "/", tag: data.tag },
            })
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
