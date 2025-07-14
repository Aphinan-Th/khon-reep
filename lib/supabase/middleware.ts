import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
	const supabaseResponse = NextResponse.next({
		request,
	});

	if (!hasEnvVars) {
		return supabaseResponse;
	}

	return supabaseResponse;
}
