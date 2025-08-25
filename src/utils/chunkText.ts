export interface TextChunk {
	startLine: number
	endLine: number
	text: string
}

/**
 * Compute a sensible default max chars per chunk when none is provided.
 * - scales inversely with file size
 * - caps at 20,000 chars per chunk (roughly ~5k tokens)
 * - enforces a 1,000 char minimum to avoid tiny chunks
 */
export function computeDefaultMaxChars(totalChars: number): number {
	const dynamic = Math.floor(totalChars / 50) // larger files → smaller chunks
	return Math.min(20_000, Math.max(1_000, dynamic || 1_000))
}

/**
 * Split text into chunks by lines, enforcing a maxChars limit per chunk.
 * Handles pathological very long single lines (minified code) by hard-splitting that line.
 */
export function chunkTextSmart(full: string, maxChars?: number): TextChunk[] {
	const totalChars = full.length
	const limit = maxChars && maxChars > 0 ? maxChars : computeDefaultMaxChars(totalChars)

	const out: TextChunk[] = []
	const lines = full.split("\n")

	let buf: string[] = []
	let charCount = 0
	let chunkStartLine = 1

	const flush = (endLine: number) => {
		if (buf.length) {
			out.push({
				startLine: chunkStartLine,
				endLine,
				text: buf.join("\n"),
			})
			buf = []
			charCount = 0
			chunkStartLine = endLine + 1
		}
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const lineLen = line.length

		// If single line is excessively long, split it into slices
		if (lineLen > limit) {
			// first flush what we have so far
			flush(i)

			for (let p = 0; p < lineLen; p += limit) {
				const slice = line.slice(p, p + limit)
				out.push({
					startLine: i + 1,
					endLine: i + 1,
					text: slice,
				})
				// each slice is treated as its own chunk
				chunkStartLine = i + 2 // next chunk starts next line unless more slices continue
			}
			continue
		}

		// If adding this line would exceed the limit, flush current chunk
		if (charCount + lineLen + (buf.length > 0 ? 1 : 0) > limit) {
			flush(i)
		}

		buf.push(line)
		charCount += lineLen + (buf.length > 1 ? 1 : 0) // account for newline joins
	}

	// flush remainder
	flush(lines.length)

	return out
}

/**
 * Take chunks until we run out of total character budget.
 */
export function takeChunksWithinBudget(chunks: TextChunk[], maxTotalChars: number): TextChunk[] {
	const out: TextChunk[] = []
	let used = 0
	for (const c of chunks) {
		const len = c.text.length
		if (used + len > maxTotalChars) break
		out.push(c)
		used += len
	}
	return out
}
