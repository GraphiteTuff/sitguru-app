import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import QRCode from "qrcode";
import { guruMatchCardSvg, renderGuruMatchCardPng } from "./card-image";

test("Guru share image renders a 1200x630 downloadable PNG with a QR code", async () => {
  const logo = await sharp({ create: { width: 120, height: 50, channels: 4, background: "#FFFFFF" } }).png().toBuffer();
  const qr = await QRCode.toBuffer("https://www.sitguru.com/s/g/ABCDEFGHIJKLMNOPQRSTUV?via=qr", {
    type: "png", width: 460, margin: 2, errorCorrectionLevel: "H",
  });
  const input = {
    guruName: "George M.", city: "Quakertown", state: "PA", serviceLabel: "Dog Walking",
    logoPng: logo, qrPng: qr, photoPng: null,
  };
  const image = await renderGuruMatchCardPng(input);
  assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  const meta = await sharp(image).metadata();
  assert.equal(meta.format, "png");
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 630);
  assert.ok(image.byteLength > 10000);
  assert.match(guruMatchCardSvg(input), /Scan to meet this Guru/);
});

test("Guru-controlled text cannot inject markup into card SVG", async () => {
  const png = await sharp({ create: { width: 16, height: 16, channels: 4, background: "#FFFFFF" } }).png().toBuffer();
  const svg = guruMatchCardSvg({
    guruName: "A <script>& Evil", city: "R&D <City>", state: "PA",
    serviceLabel: 'Sitting "Deluxe"', logoPng: png, qrPng: png, photoPng: null,
  });
  assert.ok(!svg.includes("<script>"));
  assert.match(svg, /A &lt;script&gt;&amp; Evil/);
  assert.match(svg, /R&amp;D &lt;City&gt;/);
  assert.match(svg, /Sitting &quot;Deluxe&quot;/);
});

test("Guru card also renders a real PNG when a profile photo is present", async () => {
  const photo = await sharp({create:{
    width:120,height:120,channels:4,background:"#0D5C3A"
  }}).png().toBuffer();
  const qr = await QRCode.toBuffer("https://www.sitguru.com/s/g/ABCDEFGHIJKLMNOPQRSTUV?via=qr",{
    type:"png",width:300,margin:2
  });
  const bytes=await renderGuruMatchCardPng({
    guruName:"Kara",city:"Huntsville",state:"AL",serviceLabel:"Dog Walking",
    logoPng:photo,qrPng:qr,photoPng:photo
  });
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  const meta=await sharp(bytes).metadata();
  assert.equal(meta.width,1200);
  assert.equal(meta.height,630);
  assert.ok(bytes.length>10000);
});
