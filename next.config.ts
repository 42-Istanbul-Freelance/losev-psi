import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	reactCompiler: true,
	// Allow server-side imports of native node modules (better-sqlite3)
	serverExternalPackages: ["better-sqlite3", "socket.io", "bcryptjs", "jsonwebtoken"],
};

export default nextConfig;
