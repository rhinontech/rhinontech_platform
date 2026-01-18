// Remove dotenv dependency
const API_URL = "https://api.rhinon.tech/api";
const identifier = "5n26450vcq2jmlcsy72eu";

async function testFetch() {
    console.log("Testing Fetch...");
    console.log("API_URL:", API_URL);
    console.log("Identifier:", identifier);
    console.log("Full URL:", `${API_URL}/kb/${identifier}`);

    try {
        const res = await fetch(`${API_URL}/kb/${identifier}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("Status:", res.status);
        console.log("StatusText:", res.statusText);

        if (!res.ok) {
            console.error("Fetch failed!");
            const text = await res.text();
            console.log("Body:", text);
        } else {
            const data = await res.json();
            console.log("Success! Data received.");
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

testFetch();
