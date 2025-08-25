/**
 * split a filesystem path into filename and directory for display.
 * - handles both windows and posix separators
 * - does not attempt to normalize or touch the actual filesystem
 * - expects the caller to pre-clean workspace prefixes (e.g., via cleanPathPrefix)
 */
export function getFilenameAndDir(rawPath: string): { file: string; dir: string } {
	if (!rawPath) return { file: "", dir: "" }

	// support both windows and posix separators
	const lastSlash = Math.max(rawPath.lastIndexOf("/"), rawPath.lastIndexOf("\\"))

	if (lastSlash === -1) {
		return { file: rawPath, dir: "" }
	}

	const file = rawPath.slice(lastSlash + 1)
	const dir = rawPath.slice(0, lastSlash)
	return { file, dir }
}
