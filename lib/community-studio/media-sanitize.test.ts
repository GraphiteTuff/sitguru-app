import assert from 'node:assert/strict';
import {test} from 'node:test';
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {sanitizeCommunityMedia,stripMovieMetadata} from './media-sanitize';
function atom(type:string,payload:Buffer){const header=Buffer.alloc(8);header.writeUInt32BE(payload.length+8);header.write(type,4);return Buffer.concat([header,payload]);}
test('image re-encoding removes EXIF including location metadata',async()=>{
  const original=await sharp({create:{width:4,height:4,channels:3,background:'#009966'}}).jpeg().withMetadata({exif:{IFD0:{Artist:'Private Person'}}}).toBuffer();
  assert.ok((await sharp(original).metadata()).exif);
  const safe=await sanitizeCommunityMedia(original,'image/jpeg');
  const metadata=await sharp(safe.bytes).metadata();assert.equal(metadata.exif,undefined);assert.equal(metadata.xmp,undefined);assert.equal(safe.mime,'image/webp');
});
test('movie container metadata is zeroed without changing media offsets',()=>{
  const handler=Buffer.alloc(32);handler.write('vide',8);
  const file=Buffer.concat([atom('ftyp',Buffer.from('isom0000')),atom('moov',Buffer.concat([atom('udta',Buffer.from('GPS secret')),atom('trak',atom('mdia',atom('hdlr',handler)))])),atom('mdat',Buffer.from('encoded-video'))]);
  const safe=stripMovieMetadata(file);assert.equal(safe.length,file.length);assert.equal(safe.includes(Buffer.from('GPS secret')),false);assert.ok(safe.includes(Buffer.from('encoded-video')));
});
test('malformed, fragmented and non-audio/video movie tracks fail closed',()=>{
  assert.throws(()=>stripMovieMetadata(Buffer.from('not a movie')));
  assert.throws(()=>stripMovieMetadata(atom('moof',Buffer.alloc(16))));
  const handler=Buffer.alloc(32);handler.write('meta',8);assert.throws(()=>stripMovieMetadata(atom('moov',atom('hdlr',handler))));
});
test('the existing SitGuru MP4 remains structurally processable after container metadata removal',()=>{
  const original=readFileSync('public/videos/sitguru-trusted-local-pet-care.mp4');
  const result=stripMovieMetadata(original);assert.equal(result.length,original.length);
  assert.ok(result.includes(Buffer.from('mdat')));assert.ok(result.includes(Buffer.from('moov')));
});
