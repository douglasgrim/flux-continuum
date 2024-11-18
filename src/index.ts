import express from 'express';
import axios from 'axios';
import fs from 'fs';

const app = express();

const i2i = async (i:number, imgstring: string) => {
  const response:any = await axios.post( 'http://192.168.0.118:7860/sdapi/v1/img2img', {
      prompt: "cartoon",
      denoising_strength: 0.35,
      sampler_name: "Euler",
      steps: 15,
      cfg_scale: 1,
      height: 512,
      width: 512,
      scheduler: 'simple',
      seed: Math.floor(Math.random() * 999999999999),
      init_images: [imgstring]
  });

  const { data } = response;

  for await(const img of data.images) {
    const buf = Buffer.from(img, 'base64');
    fs.writeFileSync(`image-${i}-${Date.now()}.png`, buf);
  }

  i2i(i + 1, data.images[0]);
}

const go = async (i:number) => {
  const response:any = await axios.post( 'http://192.168.0.118:7860/sdapi/v1/txt2img', {
      prompt: "a cute cartoon cat wearing a red hat and smoking a pipe",
      sampler_name: "Euler",
      steps: 15,
      cfg_scale: 2,
      height: 512,
      width: 512,
      scheduler: 'simple',
      seed: Math.floor(Math.random() * 999999999999),
  });

  const { data } = response;

  for await(const img of data.images) {
    const buf = Buffer.from(img, 'base64');
    fs.writeFileSync(`image-${i}-${Date.now()}.png`, buf);
  }

  i2i(i + 1, data.images[0]);

}

app.get('/', async (req, res) => {
  // res.send('Hello from TypeScript backend!');
  // const response:any = await axios.post( 'http://192.168.0.118:7860/sdapi/v1/txt2img', {
  //     prompt: "a cute cartoon cat sitting on a mat next to a bat and playing with a rat",
  //     sampler_name: "Euler",
  //     steps: 15,
  //     cfg_scale: 2,
  //     height: 512,
  //     width: 512,
  //     scheduler: 'simple',
  //     seed: Math.floor(Math.random() * 999999999999),
  // });

  // const { data } = response;

  // // const json = await res.json();

  // let i = 0;
  // for await(const img of data.images) {
  //   const buf = Buffer.from(img, 'base64');
  //   fs.writeFileSync(`image-${Date.now()}.png`, buf);
  // }
  go(1);
  res.json({ data: 'ok' })

  // result.images.forEach((img:string, i:number) => {

  // });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});