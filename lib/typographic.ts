const shortWordsPattern =
  /(?<![\p{L}\p{N}])(а|без|бы|в|во|для|до|же|за|и|из|или|к|как|ко|ли|на|над|не|ни|но|о|об|от|по|под|при|про|с|со|у|через|что)\s+/giu;

/**
 * Заменяет пробелы после коротких русских предлогов/союзов на неразрывные,
 * чтобы предлог не оставался висячим в конце строки.
 */
export function typographic(text: string): string {
  return text.replace(shortWordsPattern, (word) => `${word.trim()}\u00a0`);
}
