export async function getFiles(list: DataTransferItemList | undefined) {
  const items = list
    ? new Array(list.length)
        .fill(0)
        .map((_, i) => list[i])
        .map(i => i.webkitGetAsEntry?.() ?? i.getAsFile())
        .filter(i => !!i)
    : [];

  const files = items.filter(i => i instanceof File);
  const entries = items.filter((i): i is FileSystemEntry => !(i instanceof File));

  return [...files, ...(await Array.fromAsync(scanEntries(...entries)))];

  async function* scanEntries(...entries: FileSystemEntry[]): AsyncGenerator<File, void, void> {
    for (const entry of entries) {
      if (entry.isFile) {
        yield await new Promise<File>((r, rj) => (entry as FileSystemFileEntry).file(f => r(preservePath(f, entry)), rj));
      } else if (entry.isDirectory) {
        for await (const item of scanDir(entry as FileSystemDirectoryEntry)) {
          yield* scanEntries(item);
        }
      }
    }
  }

  async function* scanDir(entry: FileSystemDirectoryEntry) {
    const reader = entry.createReader();

    while (true) {
      const chunk = await new Promise<FileSystemEntry[]>((r, rj) => reader.readEntries(r, rj));
      yield* chunk;

      if (!chunk.length) break;
    }
  }

  function preservePath(file: File, entry: FileSystemEntry) {
    Object.defineProperties(file, {
      webkitRelativePath: {
        writable: true
      }
    });

    (file as { webkitRelativePath: string }).webkitRelativePath ||= entry.fullPath.replace(/^\//, '');

    return file;
  }
}
