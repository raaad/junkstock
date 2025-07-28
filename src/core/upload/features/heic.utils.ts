import type { Tags as RawTags } from 'exifreader';
import { load as loadMeta } from 'exifreader';
import type { IExif } from 'piexif-ts';
import { dump as dumpMeta, insert as insertMeta, Tags, TagValues, Types } from 'piexif-ts';

export { heicTo } from 'heic-to';

// #region types

type TagsFieldNames = keyof typeof Tags;

type TagsSubElement = (typeof Tags)['Exif'][0];

type TagsElement = Record<string, TagsSubElement>;

type TagValue = undefined | string | number | [number, number];

// #endregion

const EXCLUDE_TAGS = [
  TagValues.ImageIFD.Orientation, // remove orientation because image is already rotated
  TagValues.ExifIFD.MakerNote, // skip some tags, because it can be really large for some manufacturers
  TagValues.ExifIFD.UserComment
];

// #region metadata

function getValue(type: number, raw: unknown) {
  if (!raw) return undefined;

  switch (type) {
    case Types.Undefined:
      return Array.isArray(raw) ? String.fromCharCode(...raw) : raw.toString();
    case Types.Ascii:
      return (
        Array.isArray(raw) ?
          raw.length === 1 ?
            (raw[0] as string)
          : String.fromCharCode(...raw)
        : (raw as TagValue)
      );
    case Types.Rational:
    case Types.SRational:
    case Types.Byte:
    case Types.Long:
    case Types.SLong:
    case Types.Short:
    default:
      return raw as TagValue;
  }
}

function normalizeMetadata(type: TagsFieldNames, values: RawTags) {
  return Object.fromEntries(
    Object.entries(Tags[type] as TagsElement)
      .map(([id, { name, type }]) => [+id, getValue(type, values[name]?.value)] as [number, TagValue])
      .filter(([id, v]) => !EXCLUDE_TAGS.includes(id) && !!v)
  );
}

export async function getMetadata(file: File) {
  const raw = await loadMeta(file, { async: true });

  return Object.fromEntries(new Array<TagsFieldNames>('0th', 'Exif', 'GPS').map(type => [type, normalizeMetadata(type, raw)]));
}

export async function insertMetadata(blob: Blob, metadata: IExif) {
  const result = new Promise<string>(resolve => {
    const reader = new FileReader();

    reader.onload = e => {
      const str = dumpMeta(metadata);
      resolve(insertMeta(str, e.target?.result as string));
    };

    reader.readAsDataURL(blob);
  });

  return await (await fetch(await result)).blob();
}

// #endregion
