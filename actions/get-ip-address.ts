export async function getIPAddress(): Promise<string | null> {
	try {
		const res = await fetch("https://api64.ipify.org?format=json");
		const data = await res.json();
		return data.ip;
	} catch (error) {
		console.error("Failed to fetch IP address:", error);
		return null;
	}
}
