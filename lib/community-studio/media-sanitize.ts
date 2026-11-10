import sharp from 'sharp';

/** Preserve MP4 offsets while removing container metadata, location/user-data and timestamps.
 * Only non-fragmented audio/video movies are accepted. Unknown container structures fail closed.
 * Visible/encoded identifying information still requires the existing human moderation review.
 */
export function stripMovieMetadata(input: Uint8Array) {
  const out = Buffer.from(input);
  let movie = false, media = false, tracks = 0;
  const containers = new Set(['moov','trak','mdia','minf','stbl','edts','dinf']);
  const leaves = new Set(['ftyp','mdat','mvhd','tkhd','mdhd','hdlr','vmhd','smhd','dref','stsd','stts','ctts','stsc','stsz','stco','co64','stss','sdtp','elst','stps','cslg','sgpd','sbgp']);
  function walk(start: number, end: number, depth: number) {
    if (depth > 8) throw new Error('Unsupported movie nesting.');
    let at = start;
    while (at < end) {
      if (at + 8 > end) throw new Error('Truncated movie.');
      const size = out.readUInt32BE(at);
      const type = out.toString('latin1', at + 4, at + 8);
      if (size < 8 || at + size > end) throw new Error('Unsupported movie atom size.');
      if (type === 'moov') movie = true;
      if (type === 'mdat') media = true;
      if (type === 'hdlr') {
        if (size < 32 || !['vide','soun'].includes(out.toString('latin1', at + 16, at + 20))) throw new Error('Only video/audio tracks are supported.');
        tracks++;
        out.fill(0, at + 32, at + size);
      }
      if (type === 'dref') {
        // Never publish external file references, filenames, or network locations.
        if (size !== 28 || out.readUInt32BE(at + 12) !== 1 || out.toString('latin1',at+20,at+24) !== 'url ' || out.readUInt32BE(at+24) !== 1) throw new Error('External movie references are not supported.');
      }
      if (type === 'stsd') {
        if(size < 16) throw new Error('Invalid movie sample description.');
        let sample=at+16;
        const count=out.readUInt32BE(at+12);
        if(count>16)throw new Error('Too many movie sample formats.');
        for(let index=0;index<count;index++) {
          if(sample+16>at+size)throw new Error('Truncated movie sample.');
          const length=out.readUInt32BE(sample),codec=out.toString('latin1',sample+4,sample+8);
          if(length<16||sample+length>at+size)throw new Error('Invalid movie sample length.');
          if(['avc1','avc3','hvc1','hev1','mp4v','av01','vp09'].includes(codec)) {
            if(length<86)throw new Error('Invalid visual sample.');
            out.fill(0,sample+50,sample+82); // Human-readable compressor/camera name.
          } else if(!['mp4a','alac','ac-3','ec-3','lpcm','sowt','twos'].includes(codec)) throw new Error('Export an MP4 with standard video/audio codecs.');
          sample+=length;
        }
        if(sample!==at+size)throw new Error('Invalid movie sample boundaries.');
      }
      if (['mvhd','tkhd','mdhd'].includes(type)) {
        const width = out[at + 8] === 0 ? 8 : out[at + 8] === 1 ? 16 : 0;
        if (!width || size < 12 + width) throw new Error('Invalid movie header.');
        out.fill(0, at + 12, at + 12 + width);
      }
      if (containers.has(type)) walk(at + 8, at + size, depth + 1);
      else if (!leaves.has(type)) {
        if (['moof','mvex','cmov','rmra'].includes(type)) throw new Error('Please export a standard MP4 video.');
        out.write('free', at + 4, 'latin1'); out.fill(0, at + 8, at + size);
      }
      at += size;
    }
  }
  walk(0, out.length, 0);
  if (!movie || !media || !tracks) throw new Error('Choose a valid MP4 or MOV video.');
  return out;
}

export async function sanitizeCommunityMedia(bytes: Uint8Array, mime: string) {
  if (mime.startsWith('video/')) return { bytes: stripMovieMetadata(bytes), mime, extension: mime === 'video/quicktime' ? 'mov' : 'mp4' };
  // Re-encoding strips EXIF/IPTC/XMP (including GPS); orient before metadata removal.
  const image = sharp(bytes, { limitInputPixels: 40_000_000, animated: false }).rotate().resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true });
  return { bytes: await image.webp({ quality: 88 }).toBuffer(), mime: 'image/webp', extension: 'webp' };
}
