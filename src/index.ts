import nodeFetch from "node-fetch";
// const nodeFetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
import { createApi } from "unsplash-js";
import accessKey from "./key";
import http from "http";
import sharp, { fit } from "sharp";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { URL } from "url";
import imageSize from "image-size";

const unsplash = createApi({
  accessKey,
  //@ts-ignore
  fetch: nodeFetch.default,
});

async function searchImage(query: string) {
  const result = await unsplash.search.getPhotos({ query });
  // console.log(result.response.results);

  if (!result.response) {
    throw new Error("Failed to search image.");
  }

  const image = result.response.results[0];

  if (!image) {
    throw new Error("No image found.");
  }

  return {
    description: image.description || image.alt_description,
    url: image.urls.regular,
  };
}

// return => image 검색 결과 또는 cache image
async function getCachedImageOrSearchedImage(query: string) {
  const imageFilePath = path.resolve(__dirname, `../images/${query}`);

  if (fs.existsSync(imageFilePath)) {
    return {
      message: `Returning cached image: ${query}`,
      stream: fs.createReadStream(imageFilePath),
    };
  }

  const result = await searchImage(query);
  const resp = await nodeFetch(result.url);

  // stream은 한 번 쓰면 더이상 쓸 수 없기 때문에 새롭게 만들어줘야함
  await promisify(pipeline)(resp.body, fs.createWriteStream(imageFilePath));
  const size = imageSize(imageFilePath);

  return {
    message: `Returning new image: ${query}, width: ${size.width}, height: ${size.height}`,
    stream: fs.createReadStream(imageFilePath),
  };
}

function convertURLToImageInfo(url: string) {
  const urlObj = new URL(url, "http://localhost:5000");

  function getSearchParam(name: string, defaultValue: number) {
    const str = urlObj.searchParams.get(name);
    return str ? +str : defaultValue;
  }
  const width = getSearchParam("width", 400);
  const height = getSearchParam("height", 400);
  return {
    query: urlObj.pathname.slice(1),
    width,
    height,
  };
}

const server = http.createServer((req, res) => {
  async function main() {
    if (!req.url) {
      res.statusCode = 400;
      res.end("Needs URL.");
      return;
    }
    const { query, width, height } = convertURLToImageInfo(req.url);
    try {
      const { message, stream } = await getCachedImageOrSearchedImage(query);

      console.log(`message`, message, width, height);

      await promisify(pipeline)(
        stream,
        sharp()
          .resize(width, height, {
            fit: "contain",
          })
          .png(),
        res
      );

      // stream.pipe(res);
    } catch (err) {
      res.statusCode = 400;
      res.end();
    }
  }

  main();
});

const PORT = 5000;

server.listen(PORT, () => {
  console.log("The server is listening at port", PORT);
});
