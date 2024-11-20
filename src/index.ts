import express from 'express';
import axios from 'axios';
import fs from 'fs';
import { kebabCase } from 'lodash';

const app = express();

//const PROMPT = 'Ophelia\'s dream, Low saturation color photography, vintage, grunge, top light, masterful painting in the style of Anders Zorn | Marco Mazzoni | Yuri Ivanovich, Todd McFarlane, Aleksi Briclot, oil on canvas'

//const PROMPT = 'closeup portrait of a goth woman, messy straight-cut cleopatra bob, bangs, multi-tone hair (black with red and blue highlights), long earrings, necklaces, heavy make-up, red lips, dark eyeshadow, dark background';

//const PROMPT = '(intricate details:0.9), full shot, full body, Best quality, masterpiece, ultra high res, (photorealistic:1.4), absurdres, cinema lighting, dark victorian age, (a best long shot photo of a girl wearing work boots and belted apron over the loins and shattered dirty tank), (beautiful ponytail), working in factory, girl working on a machine, retro workshop, smoke, oily dirty machinery, sparks from the machine illuminate the room, lathe, manufacture, wet dirty floor, hyper realistic, steampunk, intricate design, insanely detailed, fine details,  beautiful, pretty face, fine texture, incredibly lifelike sinister setting, extremely detailed (sinister scene) background';

//const PROMPT = 'Ultra fine image quality,best quality,Masterwork,Complex Detail,Container renovation design with screen wall, a container and a large screen with movable horizontal strips ,Design a takeaway window with a strong Thai twist, a stylish coffee snack window ,Coffee window shop design,The johanna is a new restaurant that focuses on views of the city, in the style of tadao ando, dark maroon and brick red, brutalist, muted hues, blown-off-roof perspective, vray tracing,Super resolution,Natural Reality,Photo Quality,Realism,Ultra Detailed,8k,RAW Format,Masterpiece,Best Quality,Full Detail,Fine Effects,High Tolerance,HDR Imaging,Industrial style,coffee shop,outdoor scene,coffee shop facade,city corner,Pedestrians,two-storey glass curtain wall building,industrial wind glass curtain wall,city street scene,trees,grass,dusk,warm lighting atmosphere,natural soft sunlight,window display,wood bench,'

//const PROMPT = '(space opera science fiction style:1.3) street scene photo of a (futuristic high tech kitchen:1.1), afternoon, sunny. (intricate sharp details:1.5), ultra high res, vibrant colors';

// const PROMPT = 'Montana Rangeland, summer, evening, award-winning Nat-Geo photograph, masterpiece, dynamic play of light, high blacks, rich colors, 35mm photograph, Kodachrome'

const PROMPT = 'a cute cartoon puppy in a 2d isometric video game';

const width = 750;
const height = 525;

const FORGE_URL = 'http://192.168.0.118:7860';

const i2i = async (i:number, imgstring: string, folder: string, seed:number, prompt:string) => {
  const response:any = await axios.post( 'http://192.168.0.118:7860/sdapi/v1/img2img', {
      prompt: `cartoon, sin city art style`,
      denoising_strength: 0.75,
      sampler_name: "Euler",
      steps: 15,
      cfg_scale: 1.5,
      height,
      width,
      distilled_cfg_scale: 3.5,
      scheduler: 'simple',
      seed,
      init_images: [imgstring]
  });

  const { data } = response;

  for await(const img of data.images) {
    const buf = Buffer.from(img, 'base64');
    fs.writeFileSync(`images/${folder}/image-iter-${seed}-${i}-${Date.now()}.png`, buf);
//    fs.writeFileSync(`images/${folder}/image-${i}-${Date.now()}.png`, buf);
  }

  // const nextSeed = Math.random() < 0.1 ? seed + 1 : seed;

  const nextSeed = seed + 1;
  return data.images[0];

  // i2i(i + 1, data.images[0], folder, nextSeed);
}

const bgrm = async (i:number, imgstring:string, folder:string, seed:number, prompt:string) => {
  const response:any = await axios.post(`${FORGE_URL}/rembg`, {
    "input_image": imgstring,
    "model": "isnet-general-use",
    "return_mask": false,
    "alpha_matting": false,
    "alpha_matting_foreground_threshold": 240,
    "alpha_matting_background_threshold": 10,
    "alpha_matting_erode_size": 10    
  });
  const { data } = response;
  const buf = Buffer.from(data.image, 'base64');
  fs.writeFileSync(`images/${folder}/image-bgrm-${seed}-${i}-${Date.now()}.png`, buf);

  const cartoon = await i2i(i, data.image, folder, seed, prompt);

  return {
    cartoon,
    removed: data.image,
  }
  // return data.image;
}

const go = async (i:number, folder:string, prompt:string) => {
  const seed = Math.floor(Math.random() * 999999999999)
  const response:any = await axios.post( 'http://192.168.0.118:7860/sdapi/v1/txt2img', {
      prompt,
      sampler_name: "Euler",
      steps: 15,
      cfg_scale: 1,
      distilled_cfg_scale: 3.5,
      height,
      width,
      scheduler: 'simple',
      seed,
  });

  const { data } = response;

  for await(const img of data.images) {
    const buf = Buffer.from(img, 'base64');
    fs.writeFileSync(`images/${folder}/image-${i}-${seed}-${Date.now()}.png`, buf);
  }

  // i2i(i + 1, data.images[0], folder, seed);
  const { removed, cartoon } = await bgrm(i, data.images[0], folder, seed, prompt);
  return {
    removed,
    image: data.images[0],
    cartoon,
  }

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
  try {
    const prompt:string = req.query.prompt as string;
    const folder = kebabCase(prompt);
    try {
      fs.mkdirSync(`images/${folder}`);
    } catch (err) {

    }
    const { image, removed, cartoon } = await go(1, folder, prompt);
    //res.send('ok')

    res.send(`<div style="background-color: green; padding: 20px"><img src="data:image/png;base64,${image}" />
      <img src="data:image/png;base64,${removed}" />
      <img src="data:image/png;base64,${cartoon}" />

      </div>`);

//    res.json({ img })
      
  } catch (err) {
    res.send(`<h1>bad bad bad</h1>`);
  }


  // result.images.forEach((img:string, i:number) => {

  // });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});